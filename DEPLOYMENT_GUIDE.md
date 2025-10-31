# Placement Portal Deployment Guide

## 🚀 Quick Fix for Refresh Issues

### For Localhost Development:
1. The `_redirects` and `.htaccess` files have been created in the `public` folder
2. These files ensure React Router works correctly on page refresh

### For Production Hosting:

## 📋 Deployment Options

### Option 1: Netlify (Recommended)
1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `build` folder
   - Or connect your GitHub repository for automatic deployments

3. **Environment Variables:**
   - Set `REACT_APP_API_URL` to your production backend URL
   - Example: `https://placement-portal-backend-eight.vercel.app/api`

### Option 2: Vercel
1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   npm run build
   vercel --prod
   ```

### Option 3: GitHub Pages
1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json:**
   ```json
   "homepage": "https://yourusername.github.io/placement-portal",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

## 🔧 Environment Configuration

### Development (.env):
```
REACT_APP_API_URL=http://localhost:5000/api
PUBLIC_URL=.
```

### Production (.env.production):
```
REACT_APP_API_URL=https://your-backend-url.com/api
PUBLIC_URL=.
GENERATE_SOURCEMAP=false
```

## 🛠️ Troubleshooting

### Refresh Issues:
- ✅ `_redirects` file created for Netlify/Vercel
- ✅ `.htaccess` file created for Apache servers
- ✅ Improved error handling in profile component

### API Connection Issues:
- Check environment variables
- Ensure backend is running and accessible
- Verify CORS settings on backend

### Build Issues:
- Run `npm run build` to check for build errors
- Check console for specific error messages
- Ensure all dependencies are installed

## 📱 Mobile Responsiveness
The application is already configured with responsive design. Test on different screen sizes before deployment.

## 🔒 Security Notes
- Never commit `.env` files with sensitive data
- Use environment variables for API URLs
- Ensure backend has proper CORS configuration
- Use HTTPS in production

## 📊 Performance Optimization
- Source maps disabled in production
- Code splitting enabled via React Router
- Images optimized for web delivery
