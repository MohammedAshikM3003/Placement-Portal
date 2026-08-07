// Create default coordinator account
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Coordinator schema (inline for standalone script)
const coordinatorSchema = new mongoose.Schema({
    coordinatorId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String },
    gender: { type: String },
    email: { type: String, required: true, unique: true },
    domainEmail: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    department: { type: String, required: true },
    cabin: { type: String },
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    isBlocked: { type: Boolean, default: false }
}, { timestamps: true, strict: false });

const Coordinator = mongoose.model('Coordinator', coordinatorSchema, 'coordinators');

async function createCoordinator() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 30000
        });
        
        console.log('✅ Connected to MongoDB\n');
        
        // Check existing coordinators
        console.log('📋 Fetching all coordinators...');
        const allCoordinators = await Coordinator.find({}).lean();
        console.log(`Found ${allCoordinators.length} coordinator(s):\n`);
        
        if (allCoordinators.length > 0) {
            allCoordinators.forEach((coord, index) => {
                console.log(`Coordinator ${index + 1}:`);
                console.log(`  - ID: ${coord._id}`);
                console.log(`  - coordinatorId: ${coord.coordinatorId}`);
                console.log(`  - username: ${coord.username}`);
                console.log(`  - Name: ${coord.firstName} ${coord.lastName}`);
                console.log(`  - Email: ${coord.email}`);
                console.log(`  - Department: ${coord.department}`);
                console.log(`  - Blocked: ${coord.isBlocked || false}`);
                console.log('');
            });
        }
        
        // Check if default coordinator exists
        console.log('🔍 Checking for coord_cse...');
        const existingCoord = await Coordinator.findOne({ 
            $or: [
                { coordinatorId: 'coord_cse' },
                { username: 'coord_cse' }
            ]
        });
        
        if (existingCoord) {
            console.log('✅ Coordinator already exists:');
            console.log('   Coordinator ID:', existingCoord.coordinatorId);
            console.log('   Username:', existingCoord.username);
            console.log('   Name:', existingCoord.firstName, existingCoord.lastName);
            console.log('   Email:', existingCoord.email);
            console.log('   Department:', existingCoord.department);
            console.log('\n💡 Use these credentials to login:');
            console.log('   coordinatorId: coord_cse');
            console.log('   password: coord123');
        } else {
            console.log('💡 Creating new coordinator account...');
            
            // Hash password
            const hashedPassword = await bcrypt.hash('coord123', 10);
            
            const newCoordinator = new Coordinator({
                coordinatorId: 'coord_cse',
                firstName: 'CSE',
                lastName: 'Coordinator',
                fullName: 'CSE Coordinator',
                gender: 'Male',
                email: 'cse.coord@college.edu',
                domainEmail: 'cse.coordinator@college.edu',
                phone: '9876543210',
                department: 'CSE',
                cabin: 'A-101',
                username: 'coord_cse',
                passwordHash: hashedPassword,
                isBlocked: false
            });
            
            await newCoordinator.save();
            console.log('✅ Coordinator account created successfully!');
            console.log('   Coordinator ID: coord_cse');
            console.log('   Username: coord_cse');
            console.log('   Password: coord123');
            console.log('   Department: CSE');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 11000) {
            console.log('\n💡 Duplicate key error - coordinator might already exist with different field.');
            console.log('   Check the existing coordinators above.');
        }
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

createCoordinator();
