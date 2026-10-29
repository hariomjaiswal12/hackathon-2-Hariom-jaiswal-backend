const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const env = require('../src/config/env');

async function checkApi() {
  await mongoose.connect(env.MONGODB_URI);
  
  const compRes = await request(app).get('/api/v1/companies/vkaps-it-solutions');
  console.log('=== GET /companies/vkaps-it-solutions ===');
  console.log('Status:', compRes.status);
  console.log('overallScore:', compRes.body.data.overallScore);
  console.log('confidence:', compRes.body.data.confidence);
  console.log('sampleSourcesCount:', compRes.body.data.sampleSourcesCount);
  console.log('legalName:', compRes.body.data.legalName);
  console.log('brandName:', compRes.body.data.brandName);
  console.log('legalIncorporationDate:', compRes.body.data.legalIncorporationDate);
  console.log('foundedYear:', compRes.body.data.foundedYear);
  console.log('legalDirectors count:', compRes.body.data.legalDirectors?.length);
  console.log('businessLeadership count:', compRes.body.data.businessLeadership?.length);
  console.log('careerFit statusNotice:', compRes.body.data.careerFit?.statusNotice, '| score:', compRes.body.data.careerFit?.fitScore);

  const fitRes = await request(app).get('/api/v1/career-fit/vkaps-it-solutions?role=Backend%20Developer&experience=Fresher');
  console.log('=== GET /career-fit/vkaps-it-solutions?role=Backend%20Developer&experience=Fresher ===');
  console.log('Status:', fitRes.status);
  console.log('hasSufficientData:', fitRes.body.data.hasSufficientData);
  console.log('fitScore:', fitRes.body.data.fitScore);
  console.log('tier:', fitRes.body.data.tier);
  console.log('statusNotice:', fitRes.body.data.statusNotice);

  // Check TCS as a second company to verify no hardcoded breakages
  const tcsRes = await request(app).get('/api/v1/companies/tcs');
  console.log('=== GET /companies/tcs ===');
  console.log('Status:', tcsRes.status);
  console.log('name:', tcsRes.body.data.name);
  console.log('overallScore:', tcsRes.body.data.overallScore);
  console.log('confidence:', tcsRes.body.data.confidence?.percentage);

  await mongoose.disconnect();
}

checkApi().catch((err) => {
  console.error(err);
  process.exit(1);
});

