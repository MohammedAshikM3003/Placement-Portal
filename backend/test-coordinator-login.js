// Test coordinator login performance
const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testCoordinatorLogin() {
    console.log('🧪 Testing Coordinator Login Performance\n');
    
    // You'll need to replace these with actual coordinator credentials
    const coordinatorId = 'coord_cse'; // Replace with your coordinator ID
    const password = 'coord123'; // Replace with your coordinator password
    
    try {
        // Test 1: First login (no cache)
        console.log('Test 1: First login (cold start)...');
        const start1 = Date.now();
        const response1 = await axios.post(`${API_URL}/api/auth/coordinator-login`, {
            coordinatorId,
            password
        });
        const time1 = Date.now() - start1;
        console.log(`✅ First login: ${time1}ms`);
        console.log(`   Token: ${response1.data.token?.substring(0, 20)}...`);
        console.log(`   Coordinator: ${response1.data.coordinator?.fullName || response1.data.coordinator?.username}\n`);

        // Test 2: Second login (should be cached)
        console.log('Test 2: Second login (cached)...');
        const start2 = Date.now();
        const response2 = await axios.post(`${API_URL}/api/auth/coordinator-login`, {
            coordinatorId,
            password
        });
        const time2 = Date.now() - start2;
        console.log(`✅ Second login: ${time2}ms`);
        console.log(`   Speedup: ${(time1 / time2).toFixed(1)}x faster\n`);

        // Test 3: Third login (still cached)
        console.log('Test 3: Third login (cached)...');
        const start3 = Date.now();
        await axios.post(`${API_URL}/api/auth/coordinator-login`, {
            coordinatorId,
            password
        });
        const time3 = Date.now() - start3;
        console.log(`✅ Third login: ${time3}ms\n`);

        // Summary
        console.log('📊 Performance Summary:');
        console.log(`   First login (cold):  ${time1}ms`);
        console.log(`   Cached logins:       ${Math.min(time2, time3)}ms - ${Math.max(time2, time3)}ms`);
        console.log(`   Average cached:      ${Math.round((time2 + time3) / 2)}ms`);
        console.log(`   Performance gain:    ${(time1 / Math.min(time2, time3)).toFixed(1)}x faster`);
        
        if (Math.min(time2, time3) < 100) {
            console.log('\n✅ EXCELLENT: Cached login is blazing fast (<100ms)');
        } else if (Math.min(time2, time3) < 500) {
            console.log('\n✅ GOOD: Cached login is fast (<500ms)');
        } else {
            console.log('\n⚠️  WARNING: Cached login is slower than expected');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status === 404) {
            console.log('\n💡 TIP: Coordinator account does not exist or credentials are wrong.');
            console.log('   Update the script with valid coordinator credentials.');
        } else if (error.response?.status === 401) {
            console.log('\n💡 TIP: Invalid credentials. Check coordinatorId and password.');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 TIP: Backend server is not running. Start it with:');
            console.log('   node server-mongodb.js');
        }
    }
}

testCoordinatorLogin();
