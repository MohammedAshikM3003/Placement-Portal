// Simple test endpoint to check if backend is working
export default function handler(req, res) {
    res.status(200).json({ 
        message: 'Backend is working!', 
        mongoUri: process.env.MONGODB_URI ? 'Connected' : 'Missing',
        timestamp: new Date().toISOString()
    });
}
