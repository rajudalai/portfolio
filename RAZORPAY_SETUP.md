# Razorpay Payment Integration Setup Guide

Complete guide for setting up and deploying the Razorpay payment integration with Firebase Cloud Functions.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18 or higher
- Firebase CLI installed (`npm install -g firebase-tools`)
- Razorpay account (create at [razorpay.com](https://razorpay.com))
- Firebase project with Firestore enabled

## Initial Setup

### 1. Razorpay Account Setup

1. Create a Razorpay account at [https://razorpay.com](https://razorpay.com)
2. Enable **Test Mode** in the dashboard (top-left toggle)
3. Navigate to **Settings** → **API Keys**
4. Generate API Keys (you'll need both Key ID and Key Secret)
5. Navigate to **Settings** → **Webhooks** and note the webhook signature (will configure later)

### 2. Install Dependencies

**Frontend dependencies:**

```bash
npm install
```

**Backend dependencies (Cloud Functions):**

```bash
cd functions
npm install
cd ..
```

### 3. Environment Configuration

#### Frontend Environment Variables

1. Copy the example file:

   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and add your Razorpay **Test Key ID**:

   ```
   VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
   ```

#### Backend Environment Variables (Firebase Functions)

You have two options:

**Option A: Using .env file (for local testing)**

1. Navigate to functions directory:

   ```bash
   cd functions
   ```

2. Copy the example file:

   ```bash
   copy .env.example .env
   ```

3. Edit `functions/.env` with your Razorpay credentials:

   ```
   RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=your_key_secret_here
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
   ```

**Option B: Using Firebase Functions Config (for deployment)**

```bash
firebase functions:config:set razorpay.key_id="rzp_test_XXXXXXXXXXXX"
firebase functions:config:set razorpay.key_secret="your_key_secret_here"
firebase functions:config:set razorpay.webhook_secret="your_webhook_secret_here"
```

## Configuration

### Firestore Database Structure

Your Firestore should have the following collections:

#### Assets Collection

```
assets/
  └── {assetId}/
      ├── title: string
      ├── description: string
      ├── category: 'free' | 'featured' | 'premium'
      ├── price: string (e.g., "₹99" or "$49.99")
      ├── downloadLink: string
      └── order: number
```

#### Purchases Collection (auto-created by cloud functions)

```
purchases/
  └── {receiptId}/
      ├── receiptId: string
      ├── assetId: string
      ├── assetName: string
      ├── price: string
      ├── downloadLink: string
      ├── purchaseDate: string
      ├── buyerEmail: string (optional)
      ├── razorpayOrderId: string
      ├── razorpayPaymentId: string
      ├── razorpaySignature: string
      ├── verified: boolean
      └── status: 'pending' | 'completed' | 'failed'
```

### Firestore Security Rules

Ensure your `firestore.rules` allows:

- Anyone can read assets
- Only authenticated users (or cloud functions) can write to purchases
- Users can only read their own purchases

Example rule:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /assets/{assetId} {
      allow read: if true;
      allow write: if false; // Only admin can write
    }
    
    match /purchases/{receiptId} {
      allow read: if true; // Anyone with receipt ID can read
      allow write: if false; // Only cloud functions can write
    }
  }
}
```

## Development

### Running Locally

**Start frontend dev server:**

```bash
npm run dev
```

**Test cloud functions locally (in a separate terminal):**

```bash
cd functions
npm run serve
```

This will start the Firebase emulator for functions. Update your frontend to point to localhost for testing.

### Testing Payment Flow

1. Start both frontend and functions emulator
2. Navigate to the Assets page
3. Click "Buy Now" on a premium asset
4. Use Razorpay test card numbers:
   - **Success**: 4111 1111 1111 1111
   - **Failure**: 4000 0000 0000 0002
   - CVV: Any 3 digits
   - Expiry: Any future date

## Deployment

### 1. Build Frontend

```bash
npm run build
```

### 2. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

Wait for deployment to complete. Note the function URLs.

### 3. Configure Razorpay Webhook

1. Go to Razorpay Dashboard → **Settings** → **Webhooks**
2. Click **Create New Webhook**
3. Enter webhook URL:

   ```
   https://asia-south1-{your-project-id}.cloudfunctions.net/razorpayWebhook
   ```

4. Select events to listen to:
   - `payment.captured`
   - `payment.failed`
5. Set webhook secret and save

### 4. Deploy Frontend

```bash
firebase deploy --only hosting
```

### 5. Test Production Payment

Use test mode credentials first:

1. Try a test purchase
2. Verify receipt generation
3. Check Firestore for purchase record
4. Test download access via BoughtAccess page

### 6. Go Live (when ready)

1. Switch Razorpay to **Live Mode**
2. Generate new **Live API Keys**
3. Update environment variables:

   ```bash
   firebase functions:config:set razorpay.key_id="rzp_live_XXXXXXXXXXXX"
   firebase functions:config:set razorpay.key_secret="your_live_secret"
   ```

4. Update frontend `.env`:

   ```
   VITE_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
   ```

5. Rebuild and redeploy:

   ```bash
   npm run build
   firebase deploy
   ```

## Testing Checklist

- [ ] Order creation works (correct price from database)
- [ ] Razorpay checkout opens with correct details
- [ ] Test payment success (card: 4111 1111 1111 1111)
- [ ] Receipt ID generated and displayed
- [ ] Purchase record created in Firestore
- [ ] BoughtAccess page shows purchase with receipt ID
- [ ] Download link works correctly
- [ ] Test payment failure (card: 4000 0000 0000 0002)
- [ ] Test payment cancellation (close modal)
- [ ] Webhook receives events (check function logs)
- [ ] Error messages display correctly

## Troubleshooting

### "Payment gateway is not configured"

- Check that `VITE_RAZORPAY_KEY_ID` is set in `.env`
- Rebuild frontend after changing `.env`

### "Failed to create order"

- Verify cloud functions are deployed
- Check Firebase Functions logs: `firebase functions:log`
- Ensure Razorpay credentials are set correctly

### "Invalid payment signature"

- Razorpay Key Secret might be incorrect
- Check functions config: `firebase functions:config:get`

### Webhook not receiving events

- Verify webhook URL in Razorpay Dashboard
- Check function logs for webhook errors
- Ensure webhook secret matches in both places

### Price showing incorrectly

- Prices should be in format: "₹99" or "$49.99" in Firestore
- Functions parse numbers from price strings
- Check asset documents have valid `price` field

## Security Notes

- **Never expose** Razorpay Key Secret in frontend code
- **Never commit** `.env` files to git
- **Always verify** payments on the backend (handled by cloud functions)
- **Use HTTPS** for production (Firebase Hosting provides this)
- **Enable Firestore security rules** to prevent unauthorized access

## Support

For issues:

1. Check Firebase Functions logs: `firebase functions:log`
2. Check Razorpay Dashboard → Payments for payment status
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

## Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
