# Deployment Guide

This guide covers deploying the AI Support Assistant to free hosting platforms.

## Option 1: Render (Backend) + Vercel (Frontend)

### Backend Deployment (Render)

1. **Create Render Account**
   - Go to https://render.com and sign up

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Service**
   - Name: `support-assistant-backend`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Add Environment Variables**
   - `PORT` = `3001`
   - `LLM_PROVIDER` = `mock` (or `gemini`/`openai`)
   - `LLM_API_KEY` = your API key (if using real LLM)

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Copy your backend URL (e.g., `https://support-assistant-backend.onrender.com`)

### Frontend Deployment (Vercel)

1. **Update API URL**
   - Edit `frontend/src/services/api.js`
   - Change `API_BASE` to your Render backend URL:
   ```javascript
   const API_BASE = 'https://your-backend-url.onrender.com/api';
   ```

2. **Create Vercel Account**
   - Go to https://vercel.com and sign up

3. **Import Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository

4. **Configure Project**
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment (2-3 minutes)
   - Your app will be live at `https://your-app.vercel.app`

## Option 2: Railway (Full Stack)

1. **Create Railway Account**
   - Go to https://railway.app and sign up

2. **Deploy Backend**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Add service → Select `backend` folder
   - Add environment variables (same as Render)
   - Railway will auto-deploy

3. **Deploy Frontend**
   - Add another service → Select `frontend` folder
   - Set build command: `npm run build`
   - Set start command: `npm run preview`
   - Update API_BASE in `frontend/src/services/api.js` with backend URL

## Option 3: Local Network Deployment

If you just want to demo on your local network:

1. **Find your local IP**
   ```bash
   # Windows
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   ```

2. **Update frontend API URL**
   - Edit `frontend/src/services/api.js`
   - Change to: `const API_BASE = 'http://192.168.1.100:3001/api';`

3. **Start both servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm run dev -- --host
   ```

4. **Access from any device on your network**
   - Frontend: `http://192.168.1.100:3000`
   - Backend: `http://192.168.1.100:3001`

## Important Notes

- **Free Tier Limitations**: Render free tier spins down after 15 minutes of inactivity (first request may be slow)
- **Database**: SQLite file will reset on Render free tier restarts. For production, use PostgreSQL
- **CORS**: Backend already configured to accept requests from any origin
- **Environment Variables**: Never commit `.env` file to GitHub

## Troubleshooting

### Backend not responding
- Check Render logs for errors
- Verify environment variables are set
- Ensure PORT is set to what Render expects

### Frontend can't connect to backend
- Verify API_BASE URL is correct
- Check CORS settings
- Ensure backend is running

### Database resets on Render
- This is expected on free tier
- Upgrade to paid tier or use external database for persistence
