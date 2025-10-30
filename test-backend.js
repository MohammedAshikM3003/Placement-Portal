const http = require('http');

function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(body)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: body
                    });
                }
            });
        });
        
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function testBackend() {
    console.log('🔍 Testing backend connection...');
    
    // First, add a test student
    console.log('\n1. Adding test student...');
    try {
        const addStudentOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/add-test-student',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const addResult = await makeRequest(addStudentOptions, '{}');
        console.log('Add student status:', addResult.status);
        console.log('Add student response:', addResult.data);
        
        // Then test login
        console.log('\n2. Testing login...');
        const loginOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/students/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const loginData = JSON.stringify({
            regNo: '73152313074',
            dob: '30032006'
        });
        
        const loginResult = await makeRequest(loginOptions, loginData);
        console.log('Login status:', loginResult.status);
        console.log('Login response:', loginResult.data);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testBackend();
