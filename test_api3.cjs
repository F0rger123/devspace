const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/invalid_route',
  method: 'POST',
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode} HEADERS: ${JSON.stringify(res.headers)} BODY: ${data.substring(0,100)}`);
  });
});

req.on('error', (e) => console.error(e));
req.end();
