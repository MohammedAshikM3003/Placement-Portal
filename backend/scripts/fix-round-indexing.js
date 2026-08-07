/**
 * Migration Script: Fix Round Indexing in Reports Collection
 * 
 * This script updates the Reports collection to use 1-indexed rounds (starting from 1)
 * instead of 0-indexed rounds (starting from 0).
 * 
 * What it does:
 * - Finds all drives in the Reports collection
 * - For each drive, updates roundNumber in each round: 0 → 1, 1 → 2, 2 → 3, etc.
 * - Preserves all other data intact
 * 
 * Run this once to fix existing data.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-portal';

async function fixRoundIndexing() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const Reports = mongoose.connection.collection('Reports');
        
        // Get all drives
        const drives = await Reports.find({}).toArray();
        console.log(`📊 Found ${drives.length} drive(s) in Reports collection\n`);

        if (drives.length === 0) {
            console.log('ℹ️  No drives found. Nothing to update.');
            return;
        }

        let updatedCount = 0;
        let alreadyCorrectCount = 0;

        for (const drive of drives) {
            console.log(`\n🔍 Processing: ${drive.companyName} - ${drive.jobRole}`);
            console.log(`   Drive ID: ${drive.driveId}`);
            
            if (!drive.rounds || drive.rounds.length === 0) {
                console.log('   ⚠️  No rounds found for this drive');
                continue;
            }

            console.log(`   Found ${drive.rounds.length} round(s):`);
            
            // Check if any round is 0-indexed
            const hasZeroIndexedRounds = drive.rounds.some(r => r.roundNumber === 0);
            
            if (!hasZeroIndexedRounds) {
                console.log('   ✓ Rounds already correctly 1-indexed');
                alreadyCorrectCount++;
                drive.rounds.forEach((r, idx) => {
                    console.log(`     Round ${idx + 1}: roundNumber = ${r.roundNumber} (${r.roundName || 'N/A'})`);
                });
                continue;
            }

            // Update rounds to be 1-indexed
            const updatedRounds = drive.rounds.map(round => {
                const oldRoundNumber = round.roundNumber;
                const newRoundNumber = oldRoundNumber + 1; // Convert 0→1, 1→2, 2→3, etc.
                
                console.log(`     Updating: roundNumber ${oldRoundNumber} → ${newRoundNumber} (${round.roundName || 'N/A'})`);
                
                return {
                    ...round,
                    roundNumber: newRoundNumber
                };
            });

            // Update the drive in database
            const result = await Reports.updateOne(
                { _id: drive._id },
                { 
                    $set: { 
                        rounds: updatedRounds,
                        updatedAt: new Date(),
                        _migrated_round_indexing: true // Flag to track migration
                    } 
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`   ✅ Updated successfully`);
                updatedCount++;
            } else {
                console.log(`   ⚠️  Update returned 0 modified count`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📈 Migration Summary:');
        console.log('='.repeat(60));
        console.log(`   Total drives processed: ${drives.length}`);
        console.log(`   Drives updated: ${updatedCount}`);
        console.log(`   Drives already correct: ${alreadyCorrectCount}`);
        console.log('='.repeat(60));
        
        if (updatedCount > 0) {
            console.log('\n✅ Migration completed successfully!');
            console.log('   All rounds now use 1-indexed numbering (starting from 1).');
        } else {
            console.log('\n✅ No updates needed - all rounds already use 1-indexed numbering.');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the migration
if (require.main === module) {
    fixRoundIndexing()
        .then(() => {
            console.log('\n✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { fixRoundIndexing };
