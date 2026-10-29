const http = require('http');

const data = JSON.stringify({
  question: 'What core services does VKAPS provide?',
  companyId: 'vkaps-it-solutions',
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/ai/ask',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const json = JSON.parse(body);
        console.log('Success:', json.success);
        console.log('Claim:', json.data?.message?.claim);
        console.log('Answer Text:', json.data?.message?.text?.slice(0, 150));
        console.log('Company Context:', json.data?.companyContext?.name);
      } catch {
        console.log('Body:', body.slice(0, 300));
      }
    });
  }
);

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
