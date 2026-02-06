/**
 * Cleanup Orphaned Eligible Students Records
 * 
 * This script removes eligible student records that don't have a corresponding
 * company drive in the companies.drives collection.
 * 
 * Run this once to clean up existing orphaned data.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://your-connection-string';
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Connected');
        return true;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        return false;
    }
};

// Define schemas (simplified versions)
const companyDriveSchema = new mongoose.Schema({
    companyName: String,
    jobRole: String,
    startingDate: String,
    endingDate: String
}, { collection: 'companies drives' });

const eligibleStudentSchema = new mongoose.Schema({
    companyName: String,
    driveStartDate: String,
    jobRole: String,
    students: Array
}, { collection: 'eligible students' });

const CompanyDrive = mongoose.model('CompanyDrive', companyDriveSchema);
const EligibleStudent = mongoose.model('EligibleStudent', eligibleStudentSchema);

// Main cleanup function
const cleanupOrphanedRecords = async () => {
    try {
        console.log('\n🔍 Starting cleanup of orphaned eligible students records...\n');

        // Get all company drives
        const allDrives = await CompanyDrive.find({});
        console.log(`📊 Found ${allDrives.length} company drives in database`);

        // Get all eligible student records
        const allEligibleStudents = await EligibleStudent.find({});
        console.log(`📊 Found ${allEligibleStudents.length} eligible student records in database\n`);

        // Create a Set of valid drive keys for quick lookup
        const validDriveKeys = new Set();
        allDrives.forEach(drive => {
            const key = `${drive.companyName}|${drive.startingDate}`;
            validDriveKeys.add(key);
        });

        console.log('Valid drive keys:', Array.from(validDriveKeys));

        // Find orphaned records
        const orphanedRecords = [];
        allEligibleStudents.forEach(es => {
            const key = `${es.companyName}|${es.driveStartDate}`;
            if (!validDriveKeys.has(key)) {
                orphanedRecords.push({
                    _id: es._id,
                    companyName: es.companyName,
                    driveStartDate: es.driveStartDate,
                    studentCount: es.students ? es.students.length : 0
                });
            }
        });

        if (orphanedRecords.length === 0) {
            console.log('✅ No orphaned records found! Database is clean.\n');
            return;
        }

        console.log(`\n⚠️  Found ${orphanedRecords.length} orphaned eligible student records:\n`);
        orphanedRecords.forEach((record, index) => {
            console.log(`${index + 1}. ${record.companyName} - ${record.driveStartDate} (${record.studentCount} students)`);
        });

        // Delete orphaned records
        console.log('\n🗑️  Deleting orphaned records...');
        const orphanedIds = orphanedRecords.map(r => r._id);
        const deleteResult = await EligibleStudent.deleteMany({
            _id: { $in: orphanedIds }
        });

        console.log(`\n✅ Successfully deleted ${deleteResult.deletedCount} orphaned records!`);
        console.log('📊 Database cleanup complete.\n');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    }
};

// Run the cleanup
const main = async () => {
    const connected = await connectDB();
    if (!connected) {
        console.error('Failed to connect to database. Exiting...');
        process.exit(1);
    }

    try {
        await cleanupOrphanedRecords();
        console.log('✅ Cleanup completed successfully!');
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed.');
        process.exit(0);
    }
};

// Execute
main();
