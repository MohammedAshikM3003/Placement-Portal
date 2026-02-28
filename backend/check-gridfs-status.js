require('dotenv').config();
const { MongoClient } = require('mongodb');

async function check() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('placement-portal');

  console.log('========================================');
  console.log('   GridFS Migration Status Check');
  console.log('========================================\n');

  // 1. Check GridFS bucket
  const fsFiles = await db.collection('student_files.files').find({}).toArray();
  const chunkCount = await db.collection('student_files.chunks').countDocuments();
  console.log('--- GridFS Bucket (student_files) ---');
  console.log('  Files stored:', fsFiles.length);
  console.log('  Chunks:', chunkCount);
  if (fsFiles.length > 0) {
    fsFiles.forEach(f => {
      console.log(`  [${f._id}] ${f.filename} | ${f.length} bytes | ${f.contentType} | ${f.uploadDate}`);
    });
  } else {
    console.log('  (No files uploaded to GridFS yet)');
  }

  // 2. Check admins for base64 vs GridFS urls
  console.log('\n--- Admins ---');
  const admins = await db.collection('admins').find({}).toArray();
  console.log('  Total admins:', admins.length);
  for (const admin of admins) {
    console.log(`  Admin: ${admin.adminLoginID || admin._id}`);
    for (const field of ['profilePhoto', 'collegeBanner', 'naacCertificate', 'nbaCertificate', 'collegeLogo']) {
      const v = admin[field];
      if (!v || v === '') {
        console.log(`    ${field}: (empty)`);
      } else if (typeof v === 'string' && v.startsWith('data:')) {
        console.log(`    ${field}: ❌ BASE64 (${v.length} chars)`);
      } else if (typeof v === 'string' && v.includes('/api/file/')) {
        console.log(`    ${field}: ✅ GRIDFS URL -> ${v}`);
      } else {
        console.log(`    ${field}: ${typeof v === 'string' ? v.substring(0, 60) : typeof v}`);
      }
    }
  }

  // 3. Check students for base64 profile pics
  console.log('\n--- Students ---');
  const students = await db.collection('students').find({}).toArray();
  let base64Students = 0, gridfsStudents = 0, emptyStudents = 0;
  for (const stu of students) {
    const v = stu.profilePicURL;
    if (!v || v === '') {
      emptyStudents++;
    } else if (typeof v === 'string' && v.startsWith('data:')) {
      base64Students++;
    } else if (typeof v === 'string' && v.includes('/api/file/')) {
      gridfsStudents++;
    }
  }
  console.log(`  Total: ${students.length} | Base64: ${base64Students} | GridFS: ${gridfsStudents} | Empty: ${emptyStudents}`);

  // 4. Check coordinators
  console.log('\n--- Coordinators ---');
  const coordinators = await db.collection('coordinators').find({}).toArray();
  let base64Coo = 0, gridfsCoo = 0, emptyCoo = 0;
  for (const coo of coordinators) {
    const v = coo.profilePhoto || coo.profilePicURL || coo.profilePhotoData;
    if (!v || v === '') {
      emptyCoo++;
    } else if (typeof v === 'string' && v.startsWith('data:')) {
      base64Coo++;
    } else if (typeof v === 'string' && v.includes('/api/file/')) {
      gridfsCoo++;
    }
  }
  console.log(`  Total: ${coordinators.length} | Base64: ${base64Coo} | GridFS: ${gridfsCoo} | Empty: ${emptyCoo}`);

  // 5. Check certificates
  console.log('\n--- Certificates ---');
  const certs = await db.collection('certificates').find({}).toArray();
  let base64Certs = 0, gridfsCerts = 0, emptyCerts = 0;
  for (const cert of certs) {
    if (cert.gridfsFileId || cert.gridfsFileUrl) {
      gridfsCerts++;
    } else if (cert.fileData && cert.fileData.length > 100) {
      base64Certs++;
    } else {
      emptyCerts++;
    }
  }
  console.log(`  Total: ${certs.length} | Base64: ${base64Certs} | GridFS: ${gridfsCerts} | Empty: ${emptyCerts}`);

  // 6. Check resumes
  console.log('\n--- Resumes ---');
  const resumes = await db.collection('resume').find({}).toArray();
  let base64Res = 0, gridfsRes = 0, emptyRes = 0;
  for (const res of resumes) {
    if (res.gridfsFileId || res.gridfsFileUrl) {
      gridfsRes++;
    } else if (res.fileData && res.fileData.length > 100) {
      base64Res++;
    } else {
      emptyRes++;
    }
  }
  console.log(`  Total: ${resumes.length} | Base64: ${base64Res} | GridFS: ${gridfsRes} | Empty: ${emptyRes}`);

  // 7. Check placed_students
  console.log('\n--- Placed Students ---');
  const placed = await db.collection('placed_students').find({}).toArray();
  let base64Placed = 0, gridfsPlaced = 0, emptyPlaced = 0;
  for (const p of placed) {
    const v = p.profilePhoto || p.profilePicURL;
    if (!v || v === '') {
      emptyPlaced++;
    } else if (typeof v === 'string' && v.startsWith('data:')) {
      base64Placed++;
    } else if (typeof v === 'string' && v.includes('/api/file/')) {
      gridfsPlaced++;
    } else {
      emptyPlaced++;
    }
  }
  console.log(`  Total: ${placed.length} | Base64: ${base64Placed} | GridFS: ${gridfsPlaced} | Empty: ${emptyPlaced}`);

  console.log('\n========================================');
  console.log('   SUMMARY');
  console.log('========================================');
  console.log(`  GridFS bucket files: ${fsFiles.length}`);
  console.log(`  Collections with Base64 data still present:`);
  const hasBase64 = [];
  if (base64Students > 0) hasBase64.push(`students (${base64Students})`);
  if (base64Coo > 0) hasBase64.push(`coordinators (${base64Coo})`);
  if (base64Certs > 0) hasBase64.push(`certificates (${base64Certs})`);
  if (base64Res > 0) hasBase64.push(`resumes (${base64Res})`);
  if (base64Placed > 0) hasBase64.push(`placed_students (${base64Placed})`);
  // check admins
  let adminBase64 = 0;
  for (const admin of admins) {
    for (const field of ['profilePhoto', 'collegeBanner', 'naacCertificate', 'nbaCertificate', 'collegeLogo']) {
      const v = admin[field];
      if (v && typeof v === 'string' && v.startsWith('data:')) adminBase64++;
    }
  }
  if (adminBase64 > 0) hasBase64.push(`admins (${adminBase64} fields)`);

  if (hasBase64.length === 0) {
    console.log('    ✅ NONE - All Base64 data has been cleared!');
  } else {
    hasBase64.forEach(h => console.log(`    ❌ ${h}`));
  }
  console.log('========================================\n');

  await client.close();
}

check().catch(e => console.error('Error:', e.message));
