require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_portal';

async function run() {
    await mongoose.connect(MONGODB_URI);
    const coordinatorsColl = mongoose.connection.collection('coordinators');
    const coords = await coordinatorsColl.find({}).toArray();
    console.log('ALL COORDINATORS IN DB:', coords.map(c => ({
        id: c._id,
        coordinatorId: c.coordinatorId,
        staffId: c.staffId,
        username: c.username,
        email: c.email
    })));
    await mongoose.connection.close();
}

run();
