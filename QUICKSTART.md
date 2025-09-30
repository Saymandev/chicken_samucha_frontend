# 🚀 Quick Start: Deploy Frontend to Coolify

## ✅ Pre-Deployment Checklist

### 1. Update API URLs in Your Code

You need to update hardcoded API URLs to use environment variables or your production backend URL:

**Files to update:**

- `src/utils/api.ts` - Change API_BASE_URL
- `src/components/common/ChatPanel.tsx` - Update Socket.IO URL (line 103)
- `src/pages/admin/AdminChat.tsx` - Update Socket.IO URL (line 90)
- `src/App.tsx` - Update Socket.IO URL (line 122)

**Replace this pattern:**
```typescript
const API_BASE_URL = 'https://rest.ourb.live/api';
```

**With this:**
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-backend-domain.com/api';
```

### 2. Update Backend CORS

In your backend `server.js`, update CORS to allow your frontend domain:

```javascript
// Update around line 117-122
app.use(cors({
  origin: 'https://your-frontend-domain.com',  // Your new frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Update Socket.IO CORS (around line 58-64)
const io = socketio(server, {
  cors: {
    origin: "https://your-frontend-domain.com",  // Your new frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

### 3. Commit Your Changes

```bash
git add .
git commit -m "Add Coolify deployment configuration"
git push origin main
```

---

## 🎯 Deploy in Coolify

### Step 1: Create New Application

1. Login to Coolify dashboard
2. Click "New Application"
3. Select "Git Repository"
4. Connect your repository

### Step 2: Configure Application

- **Name**: `pickplace-frontend` (or any name you prefer)
- **Repository**: Select your repo
- **Branch**: `main`
- **Build Pack**: Docker

### Step 3: Build Settings

- **Dockerfile Path**: `frontend/Dockerfile`
- **Docker Context**: `frontend/`
- **Port**: `80`

### Step 4: Environment Variables (Optional)

Add these in the "Environment" tab:

```env
REACT_APP_API_URL=https://your-backend-domain.com/api
NODE_ENV=production
```

### Step 5: Add Domain

- Go to "Domains" tab
- Add your domain (e.g., `app.yourdomain.com`)
- Coolify will auto-generate SSL certificate

### Step 6: Deploy!

- Click "Deploy"
- Wait 3-7 minutes for build to complete
- Visit your domain

---

## ✨ What Was Created

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build: React build + Nginx server |
| `nginx.conf` | Nginx configuration for serving React app |
| `.dockerignore` | Files to exclude from Docker build |
| `COOLIFY_DEPLOYMENT_GUIDE.md` | Comprehensive deployment guide |
| `QUICKSTART.md` | This quick reference |

---

## 🧪 Test After Deployment

- [ ] Frontend loads at your domain
- [ ] HTTPS/SSL works
- [ ] Login/Register works
- [ ] Products load from backend
- [ ] Chat shows "Online" status
- [ ] Can send chat messages
- [ ] Shopping cart works
- [ ] No CORS errors in console

---

## 🔧 Common Issues

### "Connecting..." in Chat
- Check backend CORS includes your frontend domain
- Verify Socket.IO URLs are updated in the code

### CORS Errors
- Update backend CORS origin to your frontend domain
- Redeploy backend after changes

### 404 on Page Refresh
- Already handled by `nginx.conf`
- Verify the config file is included in the build

### Build Fails
- Check Coolify build logs
- Ensure all dependencies are in `package.json`
- Try increasing memory limit if needed

---

## 📚 Full Documentation

For detailed information, troubleshooting, and advanced configuration, see:
- **`COOLIFY_DEPLOYMENT_GUIDE.md`** - Complete deployment guide

---

## 🎉 That's It!

Your frontend is now ready to deploy on Coolify!

**Next Steps:**
1. Update the API URLs in your code
2. Update backend CORS settings
3. Push to Git
4. Deploy in Coolify
5. Test everything works

Need help? Check the full deployment guide!
