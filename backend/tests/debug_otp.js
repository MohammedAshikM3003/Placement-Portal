const axios = require('axios');
axios.post('http://localhost:5000/api/auth/otp/send', {
    email: 'mmohammedashik2006@gmail.com',
    purpose: 'ADMIN_ACTION',
    role: 'admin'
}).then(res => {
    console.log('SUCCESS:', res.data);
}).catch(err => {
    console.log('ERROR STATUS:', err.response?.status);
    console.log('ERROR DATA:', err.response?.data);
});
