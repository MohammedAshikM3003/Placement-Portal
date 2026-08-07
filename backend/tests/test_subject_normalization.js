// backend/tests/test_subject_normalization.js
const assert = require('assert');
const { normalizeSubjectName } = require('../services/subjectNormalizer');

console.log('🧪 Running OCR Subject Name Normalization Tests...');

const testCases = [
  {
    name: 'Test 1: Remove trailing punctuation (Tamils and Technology.)',
    input: 'Tamils and Technology.',
    expected: 'Tamils and Technology'
  },
  {
    name: 'Test 2: Remove trailing punctuation (Engineering Physics.)',
    input: 'Engineering Physics.',
    expected: 'Engineering Physics'
  },
  {
    name: 'Test 3: Roman numeral normalization (Technical English -Ii)',
    input: 'Technical English -Ii',
    expected: 'Technical English -II'
  },
  {
    name: 'Test 4: Smart title casing (POWER ELECTRONICS)',
    input: 'POWER ELECTRONICS',
    expected: 'Power Electronics'
  },
  {
    name: 'Test 5: Preserving academic punctuation (C# And .NET Framework)',
    input: 'C# And .NET Framework',
    expected: 'C# And .NET Framework'
  },
  {
    name: 'Test 6: Roman numeral normalization (Power Systems -Ii)',
    input: 'Power Systems -Ii',
    expected: 'Power Systems -II'
  },
  {
    name: 'Test 7: Noise character removal (Finite Element Analysis +V d)',
    input: 'Finite Element Analysis +V d',
    expected: 'Finite Element Analysis'
  },
  {
    name: 'Test 8: Noise character removal (Fibre Reinforced Plastics d)',
    input: 'Fibre Reinforced Plastics d',
    expected: 'Fibre Reinforced Plastics'
  },
  {
    name: 'Test 9: Noise character removal (Vehicle Components Design and Analysis Laboratory.)',
    input: 'Vehicle Components Design and Analysis Laboratory.',
    expected: 'Vehicle Components Design and Analysis Laboratory'
  }
];

let failed = 0;

testCases.forEach((tc, idx) => {
  try {
    const result = normalizeSubjectName(tc.input).normalized;
    assert.strictEqual(result, tc.expected);
    console.log(`✅ ${tc.name} PASSED`);
  } catch (error) {
    console.error(`❌ ${tc.name} FAILED`);
    console.error(`   Input:    '${tc.input}'`);
    console.error(`   Expected: '${tc.expected}'`);
    console.error(`   Actual:   '${error.actual}'`);
    failed++;
  }
});

if (failed > 0) {
  console.error(`\n❌ ${failed} test(s) failed!`);
  process.exit(1);
} else {
  console.log('\n🎉 All 6 Subject Normalization Tests PASSED successfully!');
  process.exit(0);
}
