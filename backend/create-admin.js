// Create default admin account
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function createAdmin() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 30000
        });
        
        console.log('✅ Connected to MongoDB\n');
        
        // Check if admin exists
        const existingAdmin = await Admin.findOne({ adminLoginID: 'admin1000' });
        
        if (existingAdmin) {
            console.log('✅ Admin already exists:');
            console.log('   Login ID:', existingAdmin.adminLoginID);
            console.log('   Password:', existingAdmin.adminPassword);
            console.log('   Name:', existingAdmin.firstName, existingAdmin.lastName);
        } else {
            console.log('💡 Creating new admin account...');
            
            const newAdmin = new Admin({
                adminLoginID: 'admin1000',
                adminPassword: 'admin1000',
                firstName: 'Admin',
                lastName: 'User',
                emailId: 'admin@college.edu',
                domainMailId: 'admin@college.edu',
                phoneNumber: '1234567890',
                department: 'Placement Cell',
                gender: 'Male'
            });
            
            await newAdmin.save();
            console.log('✅ Admin account created successfully!');
            console.log('   Login ID: admin1000');
            console.log('   Password: admin1000');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

createAdmin();
