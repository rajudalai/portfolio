# Python Backend Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)

1. **Sign up at [Railway.app](https://railway.app)**

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub and select your portfolio repo

3. **Configure Root Directory**:
   - Settings → Service Settings
   - Root Directory: `backend`

4. **Add Environment Variables**:
   - Variables tab → Add:

     ```
     RAZORPAY_WEBHOOK_SECRET=your_secret_here
     ```

5. **Add Firebase Credentials**:
   - Download service account JSON from Firebase Console
   - In Railway: Variables → Add Variable from File
   - Upload `serviceAccountKey.json`
   - Railway will set `GOOGLE_APPLICATION_CREDENTIALS` automatically

6. **Deploy**: Railway auto-deploys on git push

7. **Get Webhook URL**:
   - Settings → Domains → Generate Domain
   - Your webhook: `https://your-app.railway.app/webhook/razorpay`

---

### Option 2: Render

1. **Sign up at [Render.com](https://render.com)**

2. **Create Web Service**:
   - New → Web Service
   - Connect your GitHub repo

3. **Configure**:
   - Name: `razorpay-webhook`
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`

4. **Environment Variables**:
   Add in Render dashboard:

   ```
   RAZORPAY_WEBHOOK_SECRET=your_secret_here
   GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/serviceAccountKey.json
   ```

5. **Add Service Account**:
   - Render → Environment → Secret Files
   - Add file: `serviceAccountKey.json`
   - Contents: Paste your Firebase service account JSON

6. **Deploy**: Auto-deploys on git push

---

### Option 3: Vercel (Serverless)

1. **Sign up at [Vercel.com](https://vercel.com)**

2. **Install Vercel CLI** (optional):

   ```bash
   npm i -g vercel
   ```

3. **Create `vercel.json` in backend/**:

   ```json
   {
     "builds": [
       {
         "src": "app.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "app.py"
       }
     ]
   }
   ```

4. **Deploy**:
   - Via Web: Import repo → Select backend folder
   - Via CLI: `cd backend && vercel`

5. **Environment Variables**:
   - Project Settings → Environment Variables
   - Add `RAZORPAY_WEBHOOK_SECRET`
   - Add Firebase credentials as base64 string

---

### Option 4: Local Testing

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env and add your secrets

# Download Firebase service account JSON
# Save as serviceAccountKey.json in backend/

# Run server
python app.py
```

Server runs at `http://localhost:5000`

Test webhook endpoint: `http://localhost:5000/webhook/razorpay`

---

## Environment Variables Needed

| Variable | Where to Get | Required |
|----------|--------------|----------|
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Dashboard → Settings → Webhooks → Secret | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Firebase Console → Service Accounts → Generate Key | Yes |

---

## Firebase Service Account Setup

1. **Go to Firebase Console** → Your Project

2. **Project Settings** (gear icon) → **Service Accounts**

3. **Generate New Private Key** button

4. **Save JSON file** as `serviceAccountKey.json`

5. **For Railway/Render**: Upload as environment variable

6. **For local**: Place in `backend/` folder

7. **NEVER commit to git!** (already in .gitignore)

---

## Testing the Webhook

### Test Locally with ngrok (before deploying)

1. **Install [ngrok](https://ngrok.com)**

2. **Run your backend**:

   ```bash
   python app.py
   ```

3. **Expose to internet**:

   ```bash
   ngrok http 5000
   ```

4. **Copy ngrok URL** (e.g., `https://abc123.ngrok.io`)

5. **Configure in Razorpay**:
   - Dashboard → Webhooks
   - URL: `https://abc123.ngrok.io/webhook/razorpay`
   - Events: `payment.captured`

6. **Test a payment** and check your console for webhook logs

---

## After Deployment

1. **Get your deployed URL**:
   - Railway: `https://your-app.railway.app`
   - Render: `https://your-app.onrender.com`
   - Vercel: `https://your-app.vercel.app`

2. **Update Razorpay Webhook**:
   - Dashboard → Settings → Webhooks
   - URL: `https://your-app.railway.app/webhook/razorpay`
   - Events: `payment.captured`
   - Save

3. **Test Payment Flow**:
   - Make test purchase on your site
   - Check deployment logs for webhook
   - Verify purchase created in Firestore

---

## Monitoring & Logs

### Railway

- Click on deployment → View Logs
- Real-time log streaming

### Render

- Logs tab in service dashboard
- Auto-refreshes

### Vercel

- Functions → View logs
- Per-invocation logging

---

## Troubleshooting

### "Firebase not initialized"

- Verify `GOOGLE_APPLICATION_CREDENTIALS` is set
- Check service account JSON is valid
- Ensure file path is correct

### "Invalid signature"

- Verify webhook secret matches Razorpay Dashboard
- Check environment variable is set correctly
- Ensure using raw request body for verification

### "Asset not found"

- Check `asset_id` in Payment Page custom field
- Verify asset exists in Firestore with that ID

### CORS Errors (from frontend)

- Already handled with `flask-cors`
- If issues persist, check hosting platform CORS settings

---

## Cost

All platforms have **free tiers**:

- **Railway**: Free tier available
- **Render**: 750 hours/month free
- **Vercel**: Generous free tier for hobby projects

This simple webhook backend will easily fit in free tiers!

---

## Next Steps

1. Choose hosting platform (Railway recommended)
2. Deploy backend
3. Get webhook URL
4. Configure in Razorpay Dashboard  
5. Test payment flow
6. Monitor logs to verify webhooks work

---

## Security Checklist

- [x] Webhook signature verification (HMAC SHA256)
- [x] Environment variables for secrets
- [x] Service account file not committed to git
- [x] CORS enabled for your frontend domain
- [ ] Firebase/Firestore rules configured (do separately)
- [ ] HTTPS enforced (automatic on all platforms)
