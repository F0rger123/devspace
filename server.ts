import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

interface VectorItem {
  id: string;
  text: string;
  embedding: number[];
  source: string;
}

const vectorStore: VectorItem[] = [];

function cosineSimilarity(A: number[], B: number[]) {
    let dotproduct = 0;
    let mA = 0;
    let mB = 0;
    for(let i = 0; i < A.length; i++){
        dotproduct += (A[i] * B[i]);
        mA += (A[i]*A[i]);
        mB += (B[i]*B[i]);
    }
    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    return (dotproduct)/((mA)*(mB));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Workspace API to list Google Docs from Google Drive
  app.post('/api/workspace/list', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const response = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.document%27&fields=files(id%2Cname%2CwebViewLink%2CmodifiedTime)&pageSize=25", {
        headers: { Authorization: authHeader }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to list Google Drive files' });
      }

      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Workspace API to fetch a Google Doc
  app.post('/api/workspace/doc', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const { documentId } = req.body;
      
      if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!documentId) {
         return res.status(400).json({ error: 'documentId is required' });
      }
      
      const response = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
        headers: { Authorization: authHeader }
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch document' });
      }
      
      const data = await response.json();

      // Extract text and index it asynchronously
      if (process.env.GEMINI_API_KEY) {
          const ai = new GoogleGenAI({ 
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });
          
          let fullText = "";
          if (data.body && data.body.content) {
             for (const el of data.body.content) {
                 if (el.paragraph && el.paragraph.elements) {
                     for (const pel of el.paragraph.elements) {
                         if (pel.textRun && pel.textRun.content) {
                             fullText += pel.textRun.content;
                         }
                     }
                 }
             }
          }

          if (fullText.trim()) {
            // Split into chunks of ~500 chars roughly
             const chunks = fullText.match(/.{1,500}(\s|$)/g) || [fullText];
             
             for (let i = 0; i < Math.min(chunks.length, 10); i++) { // cap at 10 chunks to avoid rate limits
                 try {
                     const embRes = await ai.models.embedContent({
                        model: 'text-embedding-004',
                        contents: chunks[i]
                     });
                     if (embRes.embeddings && embRes.embeddings[0].values) {
                         vectorStore.push({
                            id: `${documentId}-${i}`,
                            text: chunks[i],
                            embedding: embRes.embeddings[0].values,
                            source: data.title || documentId
                         });
                     }
                 } catch (e) {
                    console.error('Embed err:', e);
                 }
             }
          }
      }

      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Workspace API to save/edit a Google Doc
  app.post('/api/workspace/update-doc', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const { documentId, currentLength, newText } = req.body;
      
      if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!documentId || newText === undefined) {
         return res.status(400).json({ error: 'documentId and newText are required' });
      }

      // Prepare requests to rewrite document:
      // Deletes old content and inserts new text at index 1
      const requests = [];
      const safeLength = currentLength && currentLength > 2 ? currentLength : 1000;
      
      requests.push({
         deleteContentRange: {
            range: {
               startIndex: 1,
               endIndex: safeLength - 1
            }
         }
      });
      
      requests.push({
         insertText: {
            text: newText,
            location: { index: 1 }
         }
      });

      const response = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: { 
          Authorization: authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });
      
      if (!response.ok) {
        // Fallback for document length mismatch: try single insert
        const singleInsertResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
          method: 'POST',
          headers: { 
            Authorization: authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [{
              insertText: {
                text: newText,
                location: { index: 1 }
              }
            }]
          })
        });
        
        if (!singleInsertResponse.ok) {
          const errPayload = await singleInsertResponse.json().catch(() => ({}));
          return res.status(singleInsertResponse.status).json({ error: 'Failed to update document', details: errPayload });
        }
        
        const rData = await singleInsertResponse.json();
        return res.json(rData);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Github API proxy (No auth required for public repos or use user provided token)
  app.post('/api/github/pull', async (req, res) => {
     try {
       const { repo, branch, token } = req.body;
       if (!repo) {
          return res.status(400).json({ error: 'repo is required' });
       }
       
       const headers: any = {
         'Accept': 'application/vnd.github.v3+json',
         'User-Agent': 'DevSpace'
       };
       if (token) {
         headers['Authorization'] = `token ${token}`;
       }

       const response = await fetch(`https://api.github.com/repos/${repo}/commits?sha=${branch || 'main'}&per_page=20`, {
         headers
       });

       if (!response.ok) {
          return res.status(response.status).json({ error: 'Failed to fetch GitHub commits' });
       }

       const data = await response.json();
       res.json(data);
     } catch (e: any) {
       res.status(500).json({ error: e.message });
     }
  });

  // Github API Proxy for issues
  app.post('/api/github/issues', async (req, res) => {
     try {
       const { repo, state, token } = req.body;
       if (!repo) {
          return res.status(400).json({ error: 'repo is required' });
       }
       
       const headers: any = {
         'Accept': 'application/vnd.github.v3+json',
         'User-Agent': 'DevSpace'
       };
       if (token) {
         headers['Authorization'] = `token ${token}`;
       }

       const response = await fetch(`https://api.github.com/repos/${repo}/issues?state=${state || 'all'}&per_page=10`, {
         headers
       });

       if (!response.ok) {
          return res.status(response.status).json({ error: 'Failed to fetch GitHub issues' });
       }

       const data = await response.json();
       res.json(data);
     } catch (e: any) {
       res.status(500).json({ error: e.message });
     }
  });

  // Github API Proxy for repo tree
  app.post('/api/github/tree', async (req, res) => {
     try {
       const { repo, token } = req.body;
       if (!repo) {
          return res.status(400).json({ error: 'repo is required' });
       }
       
       const reqHeaders = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'DevSpace', ...(token ? { 'Authorization': `token ${token}` } : {}) };
       const response = await fetch(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`, {
         headers: reqHeaders
       });

       // Fallback to master if main fails
       if (!response.ok) {
           const fallbackResponse = await fetch(`https://api.github.com/repos/${repo}/git/trees/master?recursive=1`, {
             headers: reqHeaders
           });
           if (!fallbackResponse.ok) {
               return res.status(fallbackResponse.status).json({ error: 'Failed to fetch GitHub tree' });
           }
           const data = await fallbackResponse.json();
           return res.json(data);
       }

       const data = await response.json();
       res.json(data);
     } catch (e: any) {
       res.status(500).json({ error: e.message });
     }
  });

  // Github API Proxy for file content
  app.post('/api/github/file', async (req, res) => {
     try {
       const { repo, path: filePath, token } = req.body;
       if (!repo || !filePath) {
          return res.status(400).json({ error: 'repo and path are required' });
       }
       
       const headers: any = {
         'Accept': 'application/vnd.github.v3+json',
         'User-Agent': 'DevSpace'
       };
       if (token) {
         headers['Authorization'] = `token ${token}`;
       }

       const response = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
         headers
       });

       if (!response.ok) {
          return res.status(response.status).json({ error: 'Failed to fetch GitHub file' });
       }

      const data = await response.json();
       if (data.content) {
        // content is base64 encoded
        const buffer = Buffer.from(data.content, 'base64');
        const fileContent = buffer.toString('utf8');
        res.json({ content: fileContent, name: data.name });

        // Extract text and index it asynchronously
        if (process.env.GEMINI_API_KEY && fileContent.trim()) {
          const ai = new GoogleGenAI({ 
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });

          // Split into chunks of ~1000 chars roughly
          const chunks = fileContent.match(/.{1,1000}(\n|$)/g) || [fileContent];
          
          for (let i = 0; i < Math.min(chunks.length, 5); i++) { // cap at 5 chunks
              try {
                  const embRes = await ai.models.embedContent({
                     model: 'text-embedding-004',
                     contents: chunks[i]
                  });
                  if (embRes.embeddings && embRes.embeddings[0].values) {
                      vectorStore.push({
                         id: `${filePath}-${i}`,
                         text: chunks[i],
                         embedding: embRes.embeddings[0].values,
                         source: `GitHub:${repo}/${filePath}`
                      });
                  }
              } catch (e) {
                 console.error('Embed err:', e);
              }
          }
        }
      } else {
        res.json({ content: '', name: data.name });
      }
     } catch (e: any) {
       res.status(500).json({ error: e.message });
     }
  });

  // Github API Proxy for repos
  app.post('/api/github/repos', async (req, res) => {
     try {
       const { org, user, token, isOwnProfile } = req.body;
       
       let url = '';
       if (org) {
         url = `https://api.github.com/orgs/${org}/repos?sort=updated&per_page=100`;
       } else if (token && (isOwnProfile || !user)) {
         url = 'https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member';
       } else if (user) {
         url = `https://api.github.com/users/${user}/repos?sort=updated&per_page=100`;
       } else {
         return res.status(400).json({ error: 'org, user, or token is required' });
       }
       
       const headers: any = {
         'Accept': 'application/vnd.github.v3+json',
         'User-Agent': 'DevSpace'
       };
       if (token) {
         headers['Authorization'] = `token ${token}`;
       }
       
       const response = await fetch(url, { headers });

       if (!response.ok) {
          return res.status(response.status).json({ error: 'Failed to fetch GitHub repos' });
       }

       const data = await response.json();
       res.json(data);
     } catch (e: any) {
       res.status(500).json({ error: e.message });
     }
  });

  // Github API Proxy for milestones
  app.post('/api/github/milestones', async (req, res) => {
     try {
       const { repo, state } = req.body;
       if (!repo) {
          return res.status(400).json({ error: 'repo is required' });
       }
       
       const response = await fetch(`https://api.github.com/repos/${repo}/milestones?state=${state || 'all'}&per_page=10`, {
         headers: {
           'Accept': 'application/vnd.github.v3+json',
           'User-Agent': 'DevSpace'
         }
       });

       if (!response.ok) {
          return res.status(response.status).json({ error: 'Failed to fetch GitHub milestones' });
       }

       const data = await response.json();
       res.json(data);
     } catch (e: any) {
       res.status(500).json({ error: e.message });
     }
  });

  // Gemini Streaming API
  app.post('/api/gemini/stream', async (req, res) => {
    try {
      const { messages, files, context } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let textContent = "";
      if (context) {
         textContent += `Context:\n${context}\n\n`;
      }
      
      const lastMessage = messages[messages.length - 1].content;
      textContent += lastMessage;

      // Query vector store for similar context
      if (vectorStore.length > 0) {
         try {
             const embRes = await ai.models.embedContent({
                 model: 'text-embedding-004',
                 contents: lastMessage
             });
             if (embRes.embeddings && embRes.embeddings[0].values) {
                 const userEmb = embRes.embeddings[0].values;
                 const scored = vectorStore.map(v => ({
                     ...v,
                     score: cosineSimilarity(userEmb, v.embedding)
                 })).sort((a, b) => b.score - a.score);
                 
                 const topRes = scored.slice(0, 3).filter(s => s.score > 0.6);
                 if (topRes.length > 0) {
                     textContent = "Retrieved Document Context:\n" + topRes.map(t => `[Source: ${t.source}]\n${t.text}`).join('\n\n') + "\n\n" + textContent;
                 }
             }
         } catch (e) {
             console.error('Vector search fail:', e);
         }
      }

      const contents = {
         role: 'user',
         parts: [{ text: textContent }] as any[]
      };

      if (files && files.length > 0) {
         for (const file of files) {
            contents.parts.push({
               inlineData: {
                 data: file.data,
                 mimeType: file.mime
               }
            });
         }
      }

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.5-flash',
        contents: [contents],
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          // Format as server-sent events
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (e: any) {
      console.error(e);
      res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
      res.end();
    }
  });

  // Catch-all API to guarantee no HTML is served
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
