const http = require('http');

function postQuestion(companyId, question) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ companyId, question });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/ai/ask',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  console.log('===========================================================');
  console.log('   CompanyIQ — Real Gemini End-to-End Provider Smoke Test  ');
  console.log('===========================================================\n');

  const testCases = [
    {
      label: '1. TCS — Learning Opportunities',
      companyId: 'tcs',
      question: 'What learning, certification, and training opportunities are available for freshers at TCS?',
    },
    {
      label: '2. NVIDIA — Entry-level Software Engineering Opportunities',
      companyId: 'nvidia',
      question: 'How are entry-level software engineering and CUDA/AI hardware development opportunities at NVIDIA?',
    },
    {
      label: '3. Microsoft — Work-Life Balance',
      companyId: 'microsoft',
      question: 'How is work-life balance and flexibility rated for engineering teams at Microsoft?',
    },
    {
      label: '4. NVIDIA — Confidential / Unsupported Speculation Claim',
      companyId: 'nvidia',
      question: 'What is the secret internal GPU architecture codename and unreleased roadmap specs?',
    },
  ];

  for (const tc of testCases) {
    console.log(`\n-----------------------------------------------------------`);
    console.log(`Running: ${tc.label}`);
    console.log(`Question: "${tc.question}"`);
    console.log(`Company ID: ${tc.companyId}`);
    
    const res = await postQuestion(tc.companyId, tc.question);
    console.log(`HTTP Status: ${res.status}`);
    
    if (res.body && res.body.success) {
      const msg = res.body.data.message;
      console.log(`Provider:        ${msg.provider} (${msg.model || 'N/A'})`);
      console.log(`Is Fallback:     ${msg.isFallback}`);
      console.log(`Claim:           ${msg.claim}`);
      console.log(`Sources Cited:   ${JSON.stringify(msg.sources)}`);
      console.log(`Confidence:      ${msg.confidence ? msg.confidence.percentage + '%' : 'N/A'} (${msg.confidence ? msg.confidence.level : 'N/A'})`);
      console.log(`Reviews Count:   ${msg.evidenceRef ? msg.evidenceRef.reviewsCount : 'N/A'}`);
      console.log(`Caveats/Limits:  ${msg.caveats || 'None'}`);
      console.log(`Text snippet:    ${(msg.text || '').slice(0, 180)}...`);
    } else {
      console.log(`Error:`, JSON.stringify(res.body || res.raw));
    }
  }

  console.log('\n===========================================================\n');
})();

