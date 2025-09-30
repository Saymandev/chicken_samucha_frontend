# Coolify Deployment Guide for Pickplace Frontend

This guide will walk you through deploying your React frontend to Coolify.

## 📋 Prerequisites

1. **Coolify Server**: You need a Coolify instance running on your server
2. **Backend API Deployed**: Your backend should already be deployed and accessible
3. **Domain**: A domain or subdomain for your frontend (e.g., `app.yourdomain.com`)
4. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)

## 🚀 Deployment Steps

### Step 1: Update Backend API URL

Before deploying, you need to update the API URL in your frontend code:

1. **Update `frontend/src/utils/api.ts`:**
   ```typescript
   // Change the API_BASE_URL to your deployed backend URL
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.yourdomain.com/api';
   ```

2. **Create Environment Variable (Optional):**
   You can also set this as an environment variable in Coolify:
   ```env
   REACT_APP_API_URL=https://api.yourdomain.com/api
   ```

### Step 2: Update Socket.IO URLs

Update all Socket.IO connection URLs to point to your backend:

**In `frontend/src/components/common/ChatPanel.tsx`:**
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.yourdomain.com/api';
const socketURL = API_BASE_URL.replace('/api', '');
```

**In `frontend/src/pages/admin/AdminChat.tsx`:**
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.yourdomain.com/api';
const socketURL = API_BASE_URL.replace('/api', '');
```

**In `frontend/src/App.tsx`:**
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.yourdomain.com/api';
const socketURL = API_BASE_URL.replace('/api', '');
```

### Step 3: Update Backend CORS Settings

Make sure your backend allows requests from your frontend domain:

**In `backend/server.js`:**
```javascript
app.use(cors({
  origin: 'https://app.yourdomain.com', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Socket.IO CORS
const io = socketio(server, {
  cors: {
    origin: "https://app.yourdomain.com", // Your frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

### Step 4: Create a New Application in Coolify

1. **Login to your Coolify dashboard**

2. **Create a new application:**
   - Click on "New Application"
   - Choose "Git Repository" as the source
   - Connect your Git repository (GitHub/GitLab)

3. **Configure the application:**
   - **Name**: `pickplace-frontend`
   - **Repository**: Select your repository
   - **Branch**: `main` (or your production branch)
   - **Build Pack**: Docker (Coolify will auto-detect the Dockerfile)

### Step 5: Configure Build Settings

1. **Build Configuration:**
   - **Dockerfile Path**: `frontend/Dockerfile`
   - **Docker Context**: `frontend/`
   - **Port**: `80`

2. **Environment Variables (Optional):**
   ```env
   REACT_APP_API_URL=https://api.yourdomain.com/api
   REACT_APP_SOCKET_URL=https://api.yourdomain.com
   NODE_ENV=production
   ```

### Step 6: Configure Domain and SSL

1. **Domain Configuration:**
   - Go to the "Domains" tab
   - Add your domain: `app.yourdomain.com` (or your preferred domain)
   - Coolify will automatically generate SSL certificates via Let's Encrypt

2. **DNS Configuration:**
   - Point your domain's A record to your Coolify server's IP address
   - Wait for DNS propagation (can take up to 24 hours, usually much faster)

### Step 7: Deploy

1. **Initial Deployment:**
   - Click "Deploy" in your Coolify dashboard
   - Monitor the build logs for any errors
   - The build process includes:
     - Installing npm dependencies
     - Building the React application
     - Creating an optimized production build
     - Setting up Nginx to serve the static files
   - Deployment should complete in 3-7 minutes

2. **Verify Deployment:**
   - Visit `https://your-frontend-domain.com`
   - You should see your React application
   - Check the browser console for any API connection errors

### Step 8: Test Integration

1. **Test API Connection:**
   - Try logging in to verify backend connectivity
   - Check if products load correctly
   - Test the shopping cart functionality

2. **Test Socket.IO Connection:**
   - Open the chat feature
   - Verify it shows "Online" instead of "Connecting..."
   - Test sending messages

3. **Test Payment Flow:**
   - Try placing a test order
   - Verify payment gateway integration works

## 🔧 Advanced Configuration

### Custom Build Arguments

If you need to pass build-time variables, modify the Dockerfile:

```dockerfile
# In the builder stage, add:
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Then in Coolify, add build arguments
```

### Performance Optimization

The Dockerfile already includes:
- ✅ Multi-stage build (smaller image size)
- ✅ Nginx for fast static file serving
- ✅ Gzip compression enabled
- ✅ Caching headers for static assets
- ✅ Security headers

### Custom Nginx Configuration

If you need to customize Nginx, edit `frontend/nginx.conf`:

```nginx
# Example: Add custom proxy rules
location /api {
    proxy_pass https://api.yourdomain.com;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Build Fails with "Out of Memory"

**Solution:**
```dockerfile
# In Dockerfile, before npm run build, add:
ENV NODE_OPTIONS=--max_old_space_size=4096
```

#### 2. API Requests Fail (CORS Errors)

**Problem:** Browser console shows CORS errors

**Solution:**
- Verify backend CORS configuration includes your frontend domain
- Check that both HTTP and HTTPS protocols match
- Ensure `credentials: true` is set on both frontend and backend

#### 3. Socket.IO Connection Fails

**Problem:** Chat shows "Connecting..." forever

**Solution:**
- Verify Socket.IO URL is correct (should be backend URL without `/api`)
- Check backend Socket.IO CORS configuration
- Ensure WebSocket traffic is not blocked by firewall

#### 4. Routing Issues (404 on Refresh)

**Problem:** Refreshing any page except home shows 404

**Solution:**
- The `nginx.conf` already handles this with `try_files`
- Verify the nginx.conf file is copied correctly in the Dockerfile

#### 5. Environment Variables Not Working

**Problem:** `process.env.REACT_APP_*` variables are undefined

**Solution:**
- React requires environment variables to be prefixed with `REACT_APP_`
- Variables must be set at **build time**, not runtime
- Rebuild the application after adding new variables

#### 6. Images/Assets Not Loading

**Problem:** Images return 404 errors

**Solution:**
- Check that all assets are in the `public/` folder
- Verify the build process copies assets correctly
- Check nginx cache configuration

### Debugging Tips

1. **Check Build Logs:**
   ```bash
   # In Coolify, view the build logs for errors
   # Look for npm errors or missing dependencies
   ```

2. **Check Runtime Logs:**
   ```bash
   # View nginx access and error logs in Coolify
   # Look for 404s or 500 errors
   ```

3. **Test Health Check:**
   ```bash
   curl https://your-frontend-domain.com/health
   # Should return "OK"
   ```

4. **Inspect Container:**
   ```bash
   # In Coolify, open terminal in the running container
   ls -la /usr/share/nginx/html
   # Verify build files are present
   ```

## 🔄 Continuous Deployment

### Automatic Deployments

1. **Webhook Setup:**
   - Coolify provides a webhook URL
   - Add this to your Git repository (GitHub/GitLab)
   - Settings → Webhooks → Add webhook
   - Every push to main branch will trigger automatic deployment

2. **Manual Deployments:**
   - Use the "Redeploy" button in Coolify dashboard
   - Useful for testing without committing code

### Rollback Strategy

1. **Quick Rollback:**
   - Coolify keeps previous deployments
   - Use "Rollback" feature to revert to previous version
   - Usually takes 1-2 minutes

2. **Manual Rollback:**
   - Revert your Git commit
   - Trigger a new deployment

## 📊 Monitoring

### Performance Monitoring

1. **Built-in Metrics:**
   - Monitor CPU and memory usage in Coolify dashboard
   - Set up alerts for high resource usage

2. **Custom Monitoring:**
   - Consider adding Google Analytics
   - Set up error tracking (e.g., Sentry)
   - Monitor Core Web Vitals

### Health Checks

Coolify automatically monitors the health check endpoint:
- **Endpoint**: `/health`
- **Expected Response**: `200 OK`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds

## 📝 Post-Deployment Checklist

- [ ] Frontend loads correctly at your domain
- [ ] SSL certificate is active (https works)
- [ ] API requests are successful
- [ ] Authentication works (login/register)
- [ ] Socket.IO connection is "Online"
- [ ] Chat functionality works
- [ ] Shopping cart works
- [ ] Payment flow works (test mode first)
- [ ] All pages load correctly
- [ ] Routing works (refresh on any page)
- [ ] Images and assets load
- [ ] Mobile responsive design works
- [ ] Browser console has no errors
- [ ] CORS is properly configured

## 🔐 Security Best Practices

1. **Always use HTTPS** - Coolify provides free SSL certificates
2. **Keep dependencies updated** - Run `npm audit` regularly
3. **Use environment variables** - Never hardcode API keys
4. **Enable security headers** - Already configured in nginx.conf
5. **Regular backups** - Backup your Git repository
6. **Monitor logs** - Check for suspicious activity

## 🚀 Performance Tips

1. **Optimize Images:**
   - Use WebP format where possible
   - Compress images before uploading
   - Lazy load images below the fold

2. **Code Splitting:**
   - React already does this automatically
   - Use dynamic imports for large components

3. **CDN (Optional):**
   - Consider using Cloudflare CDN
   - Point your domain through Cloudflare
   - Enable caching and optimization

4. **Bundle Size:**
   - Check bundle size: `npm run build` shows the sizes
   - Remove unused dependencies
   - Use tree-shaking compatible libraries

## 🔗 Useful Links

- [Coolify Documentation](https://coolify.io/docs)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## 💡 Quick Tips

1. **Use staging environment**: Test changes in staging before production
2. **Monitor build times**: Optimize if builds take too long
3. **Cache Docker layers**: Coolify caches layers for faster rebuilds
4. **Review logs regularly**: Catch issues early
5. **Keep documentation updated**: Document any custom changes

---

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review Coolify logs and error messages
3. Check the Coolify community forums
4. Verify all configuration files are correct

---

**Congratulations!** 🎉 Your frontend is now deployed on Coolify!
