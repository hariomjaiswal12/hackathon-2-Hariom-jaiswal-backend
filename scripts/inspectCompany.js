const mongoose = require('mongoose');
const Company = require('../src/models/Company');
const Intel = require('../src/models/CompanyIntelligence');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/companyiq');
  const c = await Company.findOne({ slug: 'vkaps-it-solutions' }).lean();
  const intel = await Intel.findOne({ companySlug: 'vkaps-it-solutions' }).lean();
  console.log('Company:', c ? { slug: c.slug, name: c.name, shortName: c.shortName, overallScore: c.overallScore } : null);
  console.log('Intel exists:', !!intel);
  if (intel) {
    console.log('Categories:', Object.keys(intel.categories || {}));
    console.log('Sample category learning:', intel.categories?.learning);
  }
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

