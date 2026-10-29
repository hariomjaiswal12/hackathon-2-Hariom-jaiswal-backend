const mongoose = require('mongoose');
const comparisonService = require('../src/services/comparisonService');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/companyiq');
  console.log('--- TEST 1: VKAPS vs TCS ---');
  const res1 = await comparisonService.calculateComparison(['vkaps-it-solutions', 'tcs']);
  console.log('Companies:', res1.companies.map(c => c.shortName));
  console.log('Battle archetype:', res1.battleAnalysis?.tradeoffAnalysis?.archetype);
  console.log('Battle title:', res1.battleAnalysis?.tradeoffAnalysis?.title);
  console.log('Battle verdict:', res1.battleAnalysis?.tradeoffAnalysis?.verdict);
  console.log('Category battles count:', res1.battleAnalysis?.categoryBattles?.length);
  const sampleBattle = res1.battleAnalysis?.categoryBattles?.[0];
  console.log('Sample category battle:', sampleBattle);

  console.log('\n--- TEST 2: VKAPS vs Infosys ---');
  const res2 = await comparisonService.calculateComparison(['vkaps-it-solutions', 'infosys']);
  console.log('Companies:', res2.companies.map(c => c.shortName));
  console.log('Battle archetype:', res2.battleAnalysis?.tradeoffAnalysis?.archetype);

  console.log('\n--- TEST 3: Microsoft vs Google ---');
  const res3 = await comparisonService.calculateComparison(['microsoft', 'google']);
  console.log('Companies:', res3.companies.map(c => c.shortName));
  console.log('Battle archetype:', res3.battleAnalysis?.tradeoffAnalysis?.archetype);

  console.log('\n--- TEST 4: 3-Company (TCS vs Infosys vs Accenture) ---');
  const res4 = await comparisonService.calculateComparison(['tcs', 'infosys', 'accenture']);
  console.log('Companies:', res4.companies.map(c => c.shortName));
  console.log('Rankings:', res4.rankings);
  console.log('Battle analysis companies count:', res4.battleAnalysis?.companies?.length);

  await mongoose.disconnect();
  console.log('\nAll comparison tests passed!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

