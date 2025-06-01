# MyDrive Frontend Deployment Guide

## 1. Frontend Deployment (Vercel)

1. Go to https://vercel.com and sign up with GitHub
2. Create a new project:
   - Import your GitHub repository
   - Framework Preset: `Create React App`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

3. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://your-render-backend-url.onrender.com
   ```

4. Click "Deploy"

## 2. Testing the Deployment

1. Test the frontend:
   - Visit your Vercel URL
   - Test user registration/login
   - Test file operations
   - Verify S3 integration
   - Test file sharing

## 3. Free Tier Limitations

### Vercel
- Unlimited static sites
- 100GB bandwidth/month
- Automatic HTTPS
- Global CDN

## 4. Monitoring

1. Vercel Dashboard:
   - View deployment status
   - Monitor performance
   - Check analytics
   - View build logs

## 5. Troubleshooting

1. Build Issues:
   - Check build logs
   - Verify environment variables
   - Check for dependency issues

2. Runtime Issues:
   - Check browser console for errors
   - Verify API URL configuration
   - Test in different browsers

3. API Connection Issues:
   - Verify backend URL
   - Check CORS configuration
   - Verify API endpoints

## 6. Custom Domain (Optional)

1. Add your domain in Vercel:
   - Go to Project Settings > Domains
   - Add your domain
   - Follow DNS configuration instructions

2. Update Environment Variables:
   - Update `REACT_APP_API_URL` if needed
   - Update backend CORS settings 