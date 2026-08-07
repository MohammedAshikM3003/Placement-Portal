#!/usr/bin/env node

// JWT Test Script - Verify authentication is working
const fetch = require('node-fetch').default || require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testJWT() {
    console.log('🧪 Testing JWT Authentication...\n');
    
    try {
        // Test 1: Access protected route without token
        console.log('1️⃣ Testing protected route WITHOUT token:');
        const response1 = await fetch(`${BASE_URL}/api/admin/companies`);
        console.log(`   Status: ${response1.status} ${response1.statusText}`);
        console.log(`   Expected: 401 Unauthorized\n`);
        
        // Test 2: Login to get token
        console.log('2️⃣ Testing student login to get JWT token:');
        const loginResponse = await fetch(`${BASE_URL}/api/students/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                regNo: '731523130075',
                dob: '2001-10-15'
            })
        });
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('   ✅ Login successful!');
            console.log(`   Token received: ${loginData.token.substring(0, 20)}...`);
            
            const token = loginData.token;
            
            // Test 3: Access protected route with valid token
            console.log('\n3️⃣ Testing protected route WITH valid token:');
            const response3 = await fetch(`${BASE_URL}/api/students/${loginData.student._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log(`   Status: ${response3.status} ${response3.statusText}`);
            console.log(`   Expected: 200 OK\n`);
            
            // Test 4: Access admin-only route with student token (should fail)
            console.log('4️⃣ Testing admin-only route with student token:');
            const response4 = await fetch(`${BASE_URL}/api/admin/branches-summary`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log(`   Status: ${response4.status} ${response4.statusText}`);
            console.log(`   Expected: 403 Forbidden\n`);
            
        } else {
            console.log(`   ❌ Login failed: ${loginResponse.status}`);
        }
        
        // Test 5: Access with invalid token
        console.log('5️⃣ Testing with invalid token:');
        const response5 = await fetch(`${BASE_URL}/api/admin/companies`, {
            headers: {
                'Authorization': 'Bearer invalid-token'
            }
        });
        console.log(`   Status: ${response5.status} ${response5.statusText}`);
        console.log(`   Expected: 403 Forbidden\n`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    console.log('🏁 JWT Test Complete!');
    console.log('Check the server console for JWT middleware logs.');
}

// Run the test
testJWT();