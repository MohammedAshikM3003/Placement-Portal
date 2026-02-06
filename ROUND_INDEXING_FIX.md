# Round Indexing Fix

## Problem
The Reports collection was storing rounds with 0-indexed numbering (Round 0, Round 1, Round 2), but the UI displays and filters using 1-indexed numbering (Round 1, Round 2, Round 3). This caused a mismatch where:
- UI "Round 1" would fetch DB "Round 0" 
- UI "Round 2" would fetch DB "Round 1"
- UI "Round 3" would fetch DB "Round 2"

## Solution
1. **Migration Script**: Updates existing data in the Reports collection to use 1-indexed rounds
2. **Backend Validation**: Added validation to ensure new data uses 1-indexed rounds (rejects roundNumber < 1)
3. **Frontend**: Already correctly uses 1-indexed rounds (no changes needed)

## How to Apply the Fix

### Step 1: Run the Migration (One-Time)
This updates all existing data in your MongoDB database:

**Option A - Using the Batch File (Windows)**
```bash
# From project root directory
fix-round-indexing.bat
```

**Option B - Using Node Directly**
```bash
cd backend
node scripts/fix-round-indexing.js
```

### Step 2: Restart Your Backend Server
After running the migration, restart your backend server to apply the validation:

```bash
cd backend
node server-mongodb.js
```

## What the Migration Does
- Finds all drives in the Reports collection
- For each drive's rounds, converts: `0 → 1`, `1 → 2`, `2 → 3`, etc.
- Preserves all other data (students, dates, statuses, etc.)
- Adds a `_migrated_round_indexing` flag to track migrated drives
- Safe to run multiple times (skips already-corrected drives)

## Verification
After running the migration:

1. Check your MongoDB data:
   - Rounds should now start from `roundNumber: 1` (not 0)
   
2. Test the UI:
   - Go to Report Analysis → Round wise Analysis
   - Select a company drive and round buttons
   - Verify that Round 1 shows the correct first round data
   - Round 2 shows second round data, etc.

3. Check console logs:
   - Backend logs will show: `📊 Saving Round X (Round Name) - Passed: Y, Failed: Z, Absent: W`
   - roundNumber should always be ≥ 1

## New Data
All new round results saved after applying this fix will automatically use 1-indexed rounds thanks to the backend validation. The system will reject any attempts to save rounds with roundNumber < 1.

## Files Changed
- `backend/server-mongodb.js` - Added validation for 1-indexed rounds
- `backend/scripts/fix-round-indexing.js` - Migration script (new file)
- `fix-round-indexing.bat` - Batch file to run migration (new file)
