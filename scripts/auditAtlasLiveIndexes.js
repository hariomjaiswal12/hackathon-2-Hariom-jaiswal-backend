const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;

(async () => {
  console.log('=== AUDITING LIVE ATLAS CLUSTER INDEXES ===\n');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, autoIndex: false });
    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();
    console.log(`Auditing ${collections.length} collections on Atlas database "${db.databaseName}":\n`);

    for (const col of collections) {
      const idxs = await db.collection(col.name).indexes();
      console.log(`Collection: ${col.name} (${idxs.length} index(es))`);
      idxs.forEach(idx => {
        const key = Object.entries(idx.key).map(([k, v]) => `${k}:${v}`).join(', ');
        const isUnique = idx.unique ? ' [UNIQUE]' : '';
        const isTtl = idx.expireAfterSeconds !== undefined ? ` [TTL: ${idx.expireAfterSeconds}s]` : '';
        console.log(`  - ${idx.name}: { ${key} }${isUnique}${isTtl}`);
      });
    }

  } catch (err) {
    console.error('Error auditing Atlas indexes:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nAudit completed and disconnected.');
  }
})();

