const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

console.log('=== PHASE 4: SCHEMA & INDEX COMPATIBILITY AUDIT ===\n');

const modelsDir = path.resolve(__dirname, '../src/models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  try {
    const model = require(path.join(modelsDir, file));
    const schema = model.schema;
    if (!schema) return;

    const indexes = schema.indexes();
    const indexSummary = indexes.map(([fields, options]) => {
      const fieldStr = Object.entries(fields).map(([k, v]) => `${k}:${v}`).join(', ');
      const optStr = options && Object.keys(options).length > 0 ? ` (${JSON.stringify(options)})` : '';
      return `${fieldStr}${optStr}`;
    });

    console.log(`[Model] ${model.modelName} (${file}):`);
    console.log(`  - Declared Indexes (${indexes.length}):`);
    if (indexes.length === 0) {
      console.log('    (default _id only)');
    } else {
      indexSummary.forEach(idx => console.log(`    * ${idx}`));
    }
  } catch (err) {
    console.error(`  - Error loading ${file}:`, err.message);
  }
});

