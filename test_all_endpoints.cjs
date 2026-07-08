const http = require('http');

const endpoints = [
  '/api/whatsapp/pending-actions',
  '/api/telegram/pending-actions',
  '/api/telegram/config',
  '/api/whatsapp/config',
  '/api/email/automated-settings'
];

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ path, status: res.statusCode, body: data });
      });
    });
    req.on('error', (e) => {
      resolve({ path, error: e.message });
    });
    req.end();
  });
}

async function run() {
  for (const endpoint of endpoints) {
    const res = await testEndpoint(endpoint);
    console.log(`Endpoint: ${res.path}`);
    if (res.error) {
      console.log(`  ERROR: ${res.error}`);
    } else {
      console.log(`  STATUS: ${res.status}`);
      console.log(`  BODY: ${res.body.substring(0, 150)}`);
    }
  }
}

run();
