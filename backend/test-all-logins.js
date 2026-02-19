// Comprehensive login performance test for both Admin and Coordinator
const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m'
};

async function testLogin(type, endpoint, credentials) {
    console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}  Testing ${type} Login Performance${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════${colors.reset}\n`);
    
    const times = [];
    
    try {
        // Test 3 consecutive logins
        for (let i = 1; i <= 3; i++) {
            const label = i === 1 ? 'cold start' : 'cached';
            console.log(`Test ${i}: Login attempt (${label})...`);
            const start = Date.now();
            
            const response = await axios.post(`${API_URL}${endpoint}`, credentials);
            const time = Date.now() - start;
            times.push(time);
            
            const userName = type === 'Admin' 
                ? response.data.admin?.fullName 
                : response.data.coordinator?.fullName || response.data.coordinator?.username;
            
            console.log(`${colors.green}✅ Login ${i}: ${time}ms${colors.reset}`);
            if (i === 1) {
                console.log(`   Token: ${response.data.token?.substring(0, 25)}...`);
                console.log(`   User: ${userName}`);
            }
            console.log('');
        }

        // Calculate statistics
        const coldStart = times[0];
        const cachedAvg = (times[1] + times[2]) / 2;
        const speedup = (coldStart / Math.min(times[1], times[2])).toFixed(1);
        
        console.log(`${colors.bright}📊 Performance Summary:${colors.reset}`);
        console.log(`   First login (cold):  ${coldStart}ms`);
        console.log(`   Cached logins:       ${Math.min(times[1], times[2])}ms - ${Math.max(times[1], times[2])}ms`);
        console.log(`   Average cached:      ${Math.round(cachedAvg)}ms`);
        console.log(`   ${colors.bright}Performance gain:    ${speedup}x faster${colors.reset}`);
        
        // Grade the performance
        if (cachedAvg < 50) {
            console.log(`\n${colors.green}${colors.bright}✅ EXCELLENT: Lightning fast! (<50ms)${colors.reset}`);
        } else if (cachedAvg < 100) {
            console.log(`\n${colors.green}✅ VERY GOOD: Blazing fast (<100ms)${colors.reset}`);
        } else if (cachedAvg < 500) {
            console.log(`\n${colors.yellow}✅ GOOD: Fast enough (<500ms)${colors.reset}`);
        } else {
            console.log(`\n${colors.yellow}⚠️  WARNING: Slower than expected${colors.reset}`);
        }
        
        return { success: true, times, coldStart, cachedAvg };
        
    } catch (error) {
        console.error(`${colors.red}❌ Test failed:${colors.reset}`, error.response?.data?.error || error.message);
        
        if (error.response?.status === 404) {
            console.log(`\n${colors.yellow}💡 TIP: Account does not exist.${colors.reset}`);
        } else if (error.response?.status === 401) {
            console.log(`\n${colors.yellow}💡 TIP: Invalid credentials.${colors.reset}`);
        } else if (error.code === 'ECONNREFUSED') {
            console.log(`\n${colors.red}💡 TIP: Backend server is not running. Start it with:${colors.reset}`);
            console.log('   node server-mongodb.js');
        }
        
        return { success: false, error: error.message };
    }
}

async function runAllTests() {
    console.log(`\n${colors.bright}${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}║   PLACEMENT PORTAL LOGIN PERFORMANCE TEST  ║${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}╚════════════════════════════════════════════╝${colors.reset}`);
    
    const results = {};
    
    // Test Admin Login
    results.admin = await testLogin(
        'Admin',
        '/api/auth/admin-login',
        { adminLoginID: 'admin1000', adminPassword: 'admin1000' }
    );
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test Coordinator Login (update with your coordinator credentials)
    results.coordinator = await testLogin(
        'Coordinator',
        '/api/auth/coordinator-login',
        { coordinatorId: 'coord_cse', password: 'coord123' }
    );
    
    // Final summary
    console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}  Overall Performance Summary${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════${colors.reset}\n`);
    
    if (results.admin.success) {
        console.log(`${colors.green}✅ Admin Login:${colors.reset}`);
        console.log(`   Cold start: ${results.admin.coldStart}ms`);
        console.log(`   Cached avg: ${Math.round(results.admin.cachedAvg)}ms`);
    } else {
        console.log(`${colors.red}❌ Admin Login: FAILED${colors.reset}`);
    }
    
    console.log('');
    
    if (results.coordinator.success) {
        console.log(`${colors.green}✅ Coordinator Login:${colors.reset}`);
        console.log(`   Cold start: ${results.coordinator.coldStart}ms`);
        console.log(`   Cached avg: ${Math.round(results.coordinator.cachedAvg)}ms`);
    } else {
        console.log(`${colors.yellow}⚠️  Coordinator Login: SKIPPED (update credentials)${colors.reset}`);
    }
    
    console.log('');
    
    const successCount = [results.admin, results.coordinator].filter(r => r.success).length;
    const totalTests = 2;
    
    console.log(`${colors.bright}Tests passed: ${successCount}/${totalTests}${colors.reset}`);
    
    if (successCount === totalTests) {
        console.log(`\n${colors.green}${colors.bright}🎉 All login optimizations are working perfectly!${colors.reset}\n`);
    } else if (successCount > 0) {
        console.log(`\n${colors.yellow}⚠️  Some tests failed. Check credentials and server status.${colors.reset}\n`);
    } else {
        console.log(`\n${colors.red}❌ All tests failed. Check if server is running.${colors.reset}\n`);
    }
}

runAllTests();
