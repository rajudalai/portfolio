# Razorpay Payment Integration - Quick Start

## 🚀 Quick Setup (5 minutes)

### 1. Get Razorpay API Keys

1. Sign up at [razorpay.com](https://razorpay.com)
2. Enable **Test Mode** (toggle in dashboard)
3. Go to **Settings** → **API Keys**
4. Copy **Key ID** and **Key Secret**

### 2. Configure Environment

**Frontend `.env`:**

```bash
copy .env.example .env
# Edit .env and add:
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
```

**Backend `.env`:**

```bash
cd functions
copy .env.example .env
# Edit functions/.env and add:
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Install & Run

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd functions
npm install
cd ..

# Run dev server
npm run dev
```

### 4. Test Payment

1. Open browser to `http://localhost:5173`
2. Go to Assets page
3. Click "Buy Now" on a premium asset
4. Use test card: **4111 1111 1111 1111**
5. Enter any CVV and future expiry date
6. Complete payment
7. You'll receive a receipt ID!

## 📋 Test Cards

| Card Number | Result |
|-------------|--------|
| 4111 1111 1111 1111 | ✅ Success |
| 4000 0000 0000 0002 | ❌ Failure |

CVV: Any 3 digits | Expiry: Any future date

## 🏗️ Deployment

```bash
# Build
npm run build

# Deploy functions
firebase deploy --only functions

# Deploy hosting
firebase deploy --only hosting
```

After deploying functions, configure webhook:

1. Go to Razorpay Dashboard → Webhooks
2. Add webhook URL: `https://asia-south1-YOUR_PROJECT.cloudfunctions.net/razorpayWebhook`
3. Select events: `payment.captured`, `payment.failed`

## 📖 Full Documentation

- **Complete Setup Guide**: [`RAZORPAY_SETUP.md`](file:///c:/Users/ayush/Desktop/projects/raju%20portfolio/RAZORPAY_SETUP.md)
- **Implementation Walkthrough**: See artifacts folder

## 🧪 What to Test

- [x] Order creation (price from database)
- [x] Payment with test card
- [x] Receipt generation
- [x] BoughtAccess page (enter receipt ID)
- [x] Download link access

## 🔧 Troubleshooting

**"Payment gateway not configured"**

- Check `VITE_RAZORPAY_KEY_ID` in `.env`
- Restart dev server after changing `.env`

**"Failed to create order"**

- Ensure cloud functions are running
- Check asset has valid `price` field in Firestore

## 🎯 Next Steps

1. **Test locally** with test cards
2. **Deploy functions** to Firebase
3. **Configure webhook** in Razorpay
4. **Test in production** (still test mode)
5. **Switch to live** when ready (update API keys)

---

Need help? Check the detailed setup guide in `RAZORPAY_SETUP.md`
