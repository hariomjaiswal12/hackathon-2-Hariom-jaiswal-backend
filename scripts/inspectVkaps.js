const mongoose = require('mongoose');
const env = require('../src/config/env');

async function inspect() {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const comp = await db.collection('companies').findOne({ slug: 'vkaps-it-solutions' });
  console.log('--- COMPANY ---');
  console.log('name:', comp?.name);
  console.log('legalName:', comp?.legalName);
  console.log('foundedYear:', comp?.foundedYear);
  console.log('registrationNumber:', comp?.registrationNumber);
  console.log('leadership:', JSON.stringify(comp?.leadership, null, 2));
  console.log('dataSources count:', comp?.dataSources?.length);
  console.log('overallScore:', comp?.overallScore);
  console.log('confidence:', JSON.stringify(comp?.confidence, null, 2));
  
  const sources = await db.collection('sources').find({ companySlug: 'vkaps-it-solutions' }).toArray();
  console.log('--- SOURCES (count: ' + sources.length + ') ---');
  sources.forEach(s => console.log(s.name, '|', s.type, '|', s.status, '|', s.url));

  const evidences = await db.collection('evidences').find({ companySlug: 'vkaps-it-solutions' }).toArray();
  console.log('--- EVIDENCES (count: ' + evidences.length + ') ---');
  evidences.forEach(e => console.log(e.categoryKey, '| status:', e.status, '| reviews:', e.reviewsAnalyzed));
  
  await mongoose.disconnect();
}

inspect().catch(err => { console.error(err); process.exit(1); });

