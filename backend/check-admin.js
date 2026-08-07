// Check if admin exists in database
require('dotenv').config();
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    adminLoginID: { type: String, required: true },
    adminPassword: { type: String, required: true },
    firstName: String,
    lastName: String,
    emailId: String,
    domainMailId: String,
    phoneNumber: String,
    department: String,
    profilePhoto: String
}, { strict: false });

const Admin = mongoose.model('Admin', adminSchema, 'admins');

async function checkAdmin() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        console.log('Connection string:', process.env.MONGODB_URI?.substring(0, 50) + '...');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 30000
        });
        
        console.log('✅ Connected to MongoDB\n');
        
        // Check all admins
        console.log('📋 Fetching all admins...');
        const allAdmins = await Admin.find({}).lean();
        console.log(`Found ${allAdmins.length} admin(s):\n`);
        
        allAdmins.forEach((admin, index) => {
            console.log(`Admin ${index + 1}:`);
            console.log(`  - ID: ${admin._id}`);
            console.log(`  - adminLoginID: ${admin.adminLoginID}`);
            console.log(`  - adminPassword: ${admin.adminPassword}`);
            console.log(`  - Name: ${admin.firstName} ${admin.lastName}`);
            console.log(`  - Email: ${admin.emailId}`);
            console.log('');
        });
        
        // Check specific admin
        console.log('🔍 Checking for admin1000...');
        const admin = await Admin.findOne({ adminLoginID: 'admin1000' }).lean();
        
        if (admin) {
            console.log('✅ Admin found:');
            console.log(JSON.stringify(admin, null, 2));
        } else {
            console.log('❌ Admin with adminLoginID "admin1000" not found');
            console.log('\n💡 Creating admin account...');
            
            const newAdmin = new Admin({
                adminLoginID: 'admin1000',
                adminPassword: 'admin1000',
                firstName: 'Admin',
                lastName: 'User',
                emailId: 'admin@college.edu',
                domainMailId: 'admin@college.edu',
                phoneNumber: '1234567890',
                department: 'Placement Cell'
            });
            
            await newAdmin.save();
            console.log('✅ Admin account created successfully');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

checkAdmin();
