const mongoose = require('mongoose');
const env = require('../src/config/env');

async function check() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB. Searching all collections...');

  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    const docs = await mongoose.connection.db.collection(col.name).find({}).toArray();
    for (const doc of docs) {
      const str = JSON.stringify(doc);
      if (str.toLowerCase().includes('unavailable') || str.toLowerCase().includes('example.com') || str.toLowerCase().includes('company.com')) {
        console.log(`\nMATCH IN COLLECTION: ${col.name} (ID: ${doc._id}, SLUG: ${doc.slug || doc.companySlug || doc.name || ''})`);
        
        function recurse(obj, path = '') {
          if (!obj) return;
          if (typeof obj === 'string') {
            if (obj.toLowerCase().includes('unavailable') || obj.toLowerCase().includes('example.com') || obj.toLowerCase().includes('company.com')) {
              console.log(`  ${path}: "${obj}"`);
            }
          } else if (Array.isArray(obj)) {
            obj.forEach((item, idx) => recurse(item, `${path}[${idx}]`));
          } else if (typeof obj === 'object') {
            for (const key of Object.keys(obj)) {
              recurse(obj[key], path ? `${path}.${key}` : key);
            }
          }
        }
        recurse(doc);
      }
    }
  }

  // Also check all URLs in all companies and sources
  console.log('\n--- AUDITING ALL EXTERNAL URLS IN DB ---');
  const companies = await mongoose.connection.db.collection('companies').find({}).toArray();
  for (const c of companies) {
    if (c.website) console.log(`${c.slug} | website: ${c.website}`);
    if (c.socialLinks) console.log(`${c.slug} | socialLinks: ${JSON.stringify(c.socialLinks)}`);
    if (c.workforce?.careersUrl) console.log(`${c.slug} | careersUrl: ${c.workforce.careersUrl}`);
    if (c.dataSources) {
      c.dataSources.forEach((ds, i) => {
        if (ds.sourceUrl) console.log(`${c.slug} | dataSource[${i}]: ${ds.provider} -> ${ds.sourceUrl}`);
      });
    }
  }

  const sources = await mongoose.connection.db.collection('sources').find({}).toArray();
  for (const s of sources) {
    if (s.url) console.log(`SOURCE: ${s.companySlug} | ${s.name} -> ${s.url}`);
  }

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});

