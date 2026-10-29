const mongoose = require('mongoose');
const Company = require('../src/models/Company');
const CompanyIntelligence = require('../src/models/CompanyIntelligence');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/companyiq');
  const intelligences = await CompanyIntelligence.find({}).lean();
  console.log(`Verified companies with intelligence (${intelligences.length}):`);
  intelligences.forEach(i => console.log(`- ${i.companySlug}`));
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
