const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

(async () => {
  for (const m of ['gemini-3.5-flash', 'gemini-3.8-flash']) {
    console.log(`\nTesting ${m}...`);
    try {
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Return a JSON object: {"company": "CompanyIQ", "status": "active", "model": "' + m + '"}',
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      console.log(`>>> ${m} SUCCESS:`);
      console.log(res.text);
    } catch (err) {
      console.error(`${m} error:`, err.message);
    }
  }
})();

