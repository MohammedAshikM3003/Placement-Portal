// Simple test endpoint for Vercel
module.exports = (req, res) => {
  res.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method
  });
};
