const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

const key = process.env.BREVO_API_KEY || '';
console.log('BREVO_API_KEY Length:', key.length);
console.log('BREVO_API_KEY Last 10 Characters:', key ? `...${key.slice(-10)}` : 'MISSING');
