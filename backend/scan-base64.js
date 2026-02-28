const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

// Patterns that indicate Base64 file data
const base64Patterns = [
  /^data:[a-z]+\/[a-z0-9.+-]+;base64,/i,  // data:image/png;base64,...
  /^[A-Za-z0-9+/]{500,}={0,2}$/            // raw base64 string (500+ chars)
];

function isBase64(value) {
  if (typeof value !== 'string') return false;
  if (value.length < 500) return false; // skip short strings
  return base64Patterns.some(p => p.test(value));
}

function findBase64Fields(obj, path = '') {
  const fields = [];
  if (!obj || typeof obj !== 'object') return fields;

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (key === '_id' || key === '__v') continue;

    if (typeof value === 'string' && isBase64(value)) {
      fields.push({ path: currentPath, length: value.length });
    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        if (typeof item === 'string' && isBase64(item)) {
          fields.push({ path: `${currentPath}[${idx}]`, length: item.length });
        } else if (typeof item === 'object' && item) {
          fields.push(...findBase64Fields(item, `${currentPath}[${idx}]`));
        }
      });
    } else if (typeof value === 'object' && value) {
      fields.push(...findBase64Fields(value, currentPath));
    }
  }
  return fields;
}

async function scanAndClean() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('placement-portal');
    const collections = await db.listCollections().toArray();

    console.log(`Found ${collections.length} collections. Scanning for Base64...\n`);

    for (const col of collections) {
      const name = col.name;
      const collection = db.collection(name);
      const sampleDocs = await collection.find({}).limit(50).toArray();

      if (sampleDocs.length === 0) {
        console.log(`[${name}] Empty - skipping`);
        continue;
      }

      // Scan sample docs for base64 fields
      const allBase64Fields = new Map(); // field path -> count
      let docsWithBase64 = 0;

      for (const doc of sampleDocs) {
        const fields = findBase64Fields(doc);
        if (fields.length > 0) {
          docsWithBase64++;
          for (const f of fields) {
            const existing = allBase64Fields.get(f.path.replace(/\[\d+\]/, '[*]')) || { count: 0, totalSize: 0 };
            existing.count++;
            existing.totalSize += f.length;
            allBase64Fields.set(f.path.replace(/\[\d+\]/, '[*]'), existing);
          }
        }
      }

      if (allBase64Fields.size === 0) {
        console.log(`[${name}] Clean (${sampleDocs.length} docs checked)`);
        continue;
      }

      console.log(`\n[${name}] FOUND BASE64 in ${docsWithBase64}/${sampleDocs.length} docs:`);
      for (const [field, info] of allBase64Fields) {
        console.log(`  - ${field} (${info.count} docs, ~${Math.round(info.totalSize / 1024)}KB total)`);
      }

      // Build $unset for top-level fields, handle nested separately
      const unsetFields = {};
      const topLevelFields = new Set();

      for (const fieldPath of allBase64Fields.keys()) {
        // Get the top-level field name (before first . or [)
        const topField = fieldPath.split(/[.\[]/)[0];
        topLevelFields.add(topField);
        
        // For simple top-level fields, unset them
        const cleanPath = fieldPath.replace(/\[\*\]/g, '').replace(/\[\d+\]/g, '');
        unsetFields[cleanPath] = '';
      }

      // Clear the base64 fields
      const totalDocs = await collection.countDocuments();
      const result = await collection.updateMany({}, { $unset: unsetFields });
      console.log(`  -> CLEARED: ${result.modifiedCount}/${totalDocs} docs updated`);
      console.log(`     Fields removed: ${Object.keys(unsetFields).join(', ')}`);
    }

    console.log('\n--- Scan & cleanup complete! ---');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
}

scanAndClean();
