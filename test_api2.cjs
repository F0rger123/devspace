const http = require('http');

const endpoints = [
  '/api/github/file',
  '/api/github/tree',
  '/api/github/pull',
  '/api/github/issues',
  '/api/github/repos',
  '/api/github/milestones',
  '/api/workspace/doc'
];

endpoints.forEach(path => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`${path}: ${res.statusCode} - ${data.substring(0, 100)}`);
    });
  });

  req.on('error', (e) => {
    console.error(`problem with request ${path}: ${e.message}`);
  });

  req.write(JSON.stringify({ repo: 'google/genai-js' }));
  req.end();
});
