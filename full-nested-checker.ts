import * as fs from 'fs';

const filePath = 'src/pages/AgenticOS.tsx';
const fileContent = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// We split by lines for reporting
const lines = fileContent.split('\n');

// Let's tokenise the whole file to find JSX tags.
// Any tag like <Tag ...> or </Tag>
const tagRegex = /<(\/?[a-zA-Z0-9.\-_]+)(?:\s+[^>]*?)?(\/?)>/g;

interface OpenTag {
  tag: string;
  line: number;
}

const stack: OpenTag[] = [];
let insideScript = false;

for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
  const line = lines[lineIdx];
  const lineNum = lineIdx + 1;

  // Simple scan of tags on the line
  let match;
  while ((match = tagRegex.exec(line)) !== null) {
    const tagName = match[1];
    const isClosing = tagName.startsWith('/');
    const isSelfClosing = match[2] === '/';

    // Skip comments, CDATAs or standard self-closing elements
    if (isSelfClosing) continue;
    
    const lowerTagName = tagName.replace('/', '').toLowerCase();
    const selfClosingTags = ['input', 'br', 'hr', 'img', 'textarea', 'meta', 'link'];
    if (selfClosingTags.includes(lowerTagName)) continue;

    if (isClosing) {
      const cleanClose = tagName.substring(1);
      if (stack.length === 0) {
        console.log(`[Error] Extra closing tag </${cleanClose}> on line ${lineNum}`);
      } else {
        const top = stack.pop();
        if (top && top.tag !== cleanClose) {
          console.log(`[Error] Tag mismatch on line ${lineNum}: opened <${top.tag}> (line ${top.line}) but closed with </${cleanClose}>`);
        }
      }
    } else {
      // Avoid raw numbers like "a < b" inside JS code being parsed as tags
      // If the tagName is not starting with an alphanumeric letter or capital letter, skip it
      if (!/^[A-Za-z]/.test(tagName)) continue;
      
      stack.push({ tag: tagName, line: lineNum });
    }
  }
}

if (stack.length > 0) {
  console.log(`\nFound ${stack.length} unclosed tags:`);
  stack.forEach(t => {
    console.log(`- <${t.tag}> opened on line ${t.line}`);
  });
} else {
  console.log("\nSuccess: All tags are perfectly balanced in the entire file!");
}
