# Cache Clear & Redeployment Guide

## Issues Fixed
1. ✅ Missing `favicon.png` file (was causing 404 errors)
2. ✅ Reduced image cache from 1 year to 7 days (allows updates after redeployment)

## To Deploy Changes

### Option 1: Rebuild and Redeploy Docker Container
```bash
# Navigate to frontend directory
cd frontend

# Rebuild the Docker image (no cache)
docker build --no-cache -t your-frontend-image .

# Or if using docker-compose
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Option 2: If using Coolify or similar
1. Push changes to your repository
2. Trigger a new deployment in Coolify
3. Make sure "Clear Build Cache" is enabled

## Force Browser Cache Clear

After redeployment, users might still see old images due to browser cache:

### For Your Browser (Testing)
- **Chrome/Edge**: Press `Ctrl + Shift + Delete` → Clear cache
- **Or**: Hard reload with `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

### For Users (Automatic)
The new nginx config will automatically serve fresh images after 7 days. For immediate effect, you can:

1. **Add version query strings** to images in your code:
   ```html
   <img src="/logo.png?v=2" alt="Logo" />
   ```

2. **Rename image files** when updating them:
   ```
   logo.png → logo-v2.png
   ```

## Verify Changes

After redeployment, check:
1. `https://rongdhunu.com/favicon.png` - Should return 200 (not 404)
2. Browser DevTools → Network tab → Check image response headers
3. Look for: `Cache-Control: public, max-age=604800` (7 days)

## SSL Certificate Status

✅ **SSL is working correctly** - Your logs show successful HTTPS connections from:
- Regular users (103.134.36.6)
- Google bots (66.249.66.x)
- Cloudflare (104.23.x.x)

No SSL issues detected!

