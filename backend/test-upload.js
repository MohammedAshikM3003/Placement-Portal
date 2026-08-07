const http = require('http');
const path = require('path');

// Build multipart form data manually
const boundary = '----TestBoundary123';
const fileContent = Buffer.from('fake-jpeg-data-FFD8FFE0', 'utf-8');

let body = '';
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="profileImage"; filename="test.jpg"\r\n`;
body += `Content-Type: image/jpeg\r\n\r\n`;
body += fileContent.toString() + '\r\n';
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="userId"\r\n\r\n`;
body += `test123\r\n`;
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="userType"\r\n\r\n`;
body += `student\r\n`;
body += `--${boundary}--\r\n`;

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/upload/profile-image',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(body)
  }
};

console.log('Sending POST to', options.path);

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});

req.on('error', (e) => console.log('Connection Error:', e.message));
req.write(body);
req.end();
