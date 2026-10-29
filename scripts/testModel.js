const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
console.log('Testing with key present:', !!apiKey, 'length:', apiKey ? apiKey.length : 0);
const ai = new GoogleGenAI({ apiKey });

const models = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-pro-latest'
];

(async () => {
  for (const m of models) {
    process.stdout.write(`Testing model [${m}]... `);
    try {
      const res = await Promise.race([
        ai.models.generateContent({
          model: m,
          contents: 'Say OK',
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_10S')), 10000))
      ]);
      console.log('SUCCESS! Response:', (res.text || '').trim().slice(0, 50));
      console.log(`>>> RECOMMENDED MODEL: ${m} <<<`);
      break;
    } catch (err) {
      console.log('FAILED:', err.message.slice(0, 150));
    }
  }
})();
