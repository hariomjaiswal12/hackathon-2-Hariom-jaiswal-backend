const mongoose = require('mongoose');
const Company = require('../src/models/Company');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/companyiq');
  const comps = await Company.find({}, 'slug name shortName verifiedRegistryInfo').lean();
  console.log(`Found ${comps.length} companies:`);
  comps.forEach(c => console.log(`- ${c.slug} | ${c.name} | ${c.shortName} | CIN: ${c.verifiedRegistryInfo?.cin || 'N/A'}`));
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

