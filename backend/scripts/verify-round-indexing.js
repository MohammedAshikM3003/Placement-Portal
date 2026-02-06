/**
 * Verification Script: Check Round Indexing in Reports Collection
 * 
 * This script verifies that all rounds in the Reports collection use 1-indexed numbering.
 * Run this after the migration to confirm everything is correct.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-portal';

async function verifyRoundIndexing() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const Reports = mongoose.connection.collection('Reports');
        
        // Get all drives
        const drives = await Reports.find({}).toArray();
        console.log(`📊 Found ${drives.length} drive(s) in Reports collection\n`);

        if (drives.length === 0) {
            console.log('ℹ️  No drives found in Reports collection.');
            return;
        }

        let allCorrect = true;
        let totalRounds = 0;
        let correctRounds = 0;
        let incorrectRounds = 0;

        console.log('='.repeat(80));
        console.log('VERIFICATION RESULTS:');
        console.log('='.repeat(80));

        for (const drive of drives) {
            console.log(`\n📍 Drive: ${drive.companyName} - ${drive.jobRole}`);
            console.log(`   Drive ID: ${drive.driveId}`);
            
            if (!drive.rounds || drive.rounds.length === 0) {
                console.log('   ⚠️  No rounds found');
                continue;
            }

            console.log(`   Total Rounds: ${drive.rounds.length}`);
            console.log('   Round Details:');
            
            drive.rounds.forEach((round, index) => {
                totalRounds++;
                const expectedRoundNum = index + 1; // Expected: 1, 2, 3, 4, 5...
                const actualRoundNum = round.roundNumber;
                
                const isCorrect = actualRoundNum === expectedRoundNum;
                
                if (isCorrect) {
                    correctRounds++;
                    console.log(`   ✅ Round ${index + 1}: roundNumber = ${actualRoundNum} (${round.roundName || 'N/A'}) - CORRECT`);
                } else {
                    incorrectRounds++;
                    allCorrect = false;
                    console.log(`   ❌ Round ${index + 1}: roundNumber = ${actualRoundNum} (expected ${expectedRoundNum}) - INCORRECT`);
                }
                
                // Show student counts
                console.log(`      Students: ${round.passedCount || 0} passed, ${round.failedCount || 0} failed, ${round.absentCount || 0} absent`);
            });
        }

        console.log('\n' + '='.repeat(80));
        console.log('SUMMARY:');
        console.log('='.repeat(80));
        console.log(`   Total Drives: ${drives.length}`);
        console.log(`   Total Rounds: ${totalRounds}`);
        console.log(`   ✅ Correct Rounds (1-indexed): ${correctRounds}`);
        console.log(`   ❌ Incorrect Rounds (0-indexed or invalid): ${incorrectRounds}`);
        console.log('='.repeat(80));

        if (allCorrect) {
            console.log('\n🎉 SUCCESS! All rounds are correctly 1-indexed (starting from 1).');
            console.log('   Your Reports collection is ready to use.');
        } else {
            console.log('\n⚠️  WARNING! Some rounds are not correctly indexed.');
            console.log('   Please run the migration script: fix-round-indexing.js');
        }

    } catch (error) {
        console.error('\n❌ Verification failed:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the verification
if (require.main === module) {
    verifyRoundIndexing()
        .then(() => {
            console.log('\n✅ Verification completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Verification failed:', error);
            process.exit(1);
        });
}

module.exports = { verifyRoundIndexing };
