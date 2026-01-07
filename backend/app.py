"""
Razorpay Webhook Handler - Python Flask Backend

A minimal backend to handle Razorpay Payment Pages webhooks.
Can be deployed to Railway, Render, Vercel, Heroku, or any Python hosting.

Security:
- Verifies webhook signatures using HMAC SHA256
- Only creates purchase records for verified payments
- Integrates with Firestore for data storage
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import hmac
import hashlib
import os
import time
import random
import string
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow requests from your frontend

# Initialize Firebase Admin SDK
# You'll need to set GOOGLE_APPLICATION_CREDENTIALS env variable
# or provide the path to your service account JSON file
try:
    if not firebase_admin._apps:
        # Option 1: Use GOOGLE_APPLICATION_CREDENTIALS env variable
        firebase_admin.initialize_app()
        
        # Option 2: Or explicitly provide credentials
        # cred = credentials.Certificate('path/to/serviceAccountKey.json')
        # firebase_admin.initialize_app(cred)
        
    db = firestore.client()
    print("✅ Firebase initialized successfully")
except Exception as e:
    print(f"⚠️  Firebase initialization error: {e}")
    db = None

# Get webhook secret from environment variable
RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')

if not RAZORPAY_WEBHOOK_SECRET:
    print("⚠️  WARNING: RAZORPAY_WEBHOOK_SECRET not set!")


def generate_receipt_id():
    """Generate a unique receipt ID"""
    timestamp = hex(int(time.time()))[2:].upper()
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"RCP-{timestamp}-{random_part}"


def verify_webhook_signature(payload, signature, secret):
    """
    Verify Razorpay webhook signature using HMAC SHA256
    
    Args:
        payload: Raw request body as bytes
        signature: Signature from X-Razorpay-Signature header
        secret: Webhook secret from Razorpay Dashboard
    
    Returns:
        bool: True if signature is valid, False otherwise
    """
    if not secret:
        return False
    
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)


@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'Razorpay Webhook Handler',
        'firebase': 'connected' if db else 'not connected'
    })


@app.route('/webhook/razorpay', methods=['POST'])
def razorpay_webhook():
    """
    Handle Razorpay Payment Pages webhooks
    
    This endpoint receives webhook events from Razorpay when payments occur.
    It verifies the signature, extracts payment details, and creates purchase
    records in Firestore.
    """
    try:
        # Get webhook signature from header
        signature = request.headers.get('X-Razorpay-Signature', '')
        
        if not signature:
            print("❌ Webhook signature missing")
            return jsonify({'error': 'Signature missing'}), 400
        
        # Get raw request body for signature verification
        payload = request.get_data()
        
        # Verify signature
        if not verify_webhook_signature(payload, signature, RAZORPAY_WEBHOOK_SECRET):
            print(f"❌ Invalid webhook signature: {signature[:10]}...")
            return jsonify({'error': 'Invalid signature'}), 403
        
        # Parse JSON body
        data = request.get_json()
        event = data.get('event')
        payload_data = data.get('payload', {})
        
        print(f"✅ Webhook received: {event}")
        
        # Handle payment.captured event (successful payment)
        if event == 'payment.captured':
            payment = payload_data.get('payment', {}).get('entity', {})
            
            payment_id = payment.get('id')
            amount = payment.get('amount')  # Amount in paise
            currency = payment.get('currency', 'INR')
            customer_email = payment.get('email')
            notes = payment.get('notes', {})
            
            # Extract asset ID from payment notes
            asset_id = notes.get('asset_id')
            
            if not asset_id:
                print(f"⚠️  Asset ID missing in payment notes for {payment_id}")
                return jsonify({'error': 'Asset ID missing'}), 400
            
            if not db:
                print("❌ Firestore not initialized")
                return jsonify({'error': 'Database not available'}), 500
            
            # Fetch asset details from Firestore
            asset_ref = db.collection('assets').document(asset_id)
            asset_doc = asset_ref.get()
            
            if not asset_doc.exists:
                print(f"❌ Asset not found: {asset_id}")
                return jsonify({'error': 'Asset not found'}), 404
            
            asset_data = asset_doc.to_dict()
            
            # Generate receipt ID
            receipt_id = generate_receipt_id()
            purchase_date = datetime.utcnow().isoformat() + 'Z'
            
            # Create purchase record
            purchase_data = {
                'receiptId': receipt_id,
                'assetId': asset_id,
                'assetName': asset_data.get('title', 'Unknown Asset'),
                'price': asset_data.get('price', 'N/A'),
                'downloadLink': asset_data.get('downloadLink', ''),
                'purchaseDate': purchase_date,
                'buyerEmail': customer_email,
                'razorpayPaymentId': payment_id,
                'razorpayAmount': amount,
                'razorpayCurrency': currency,
                'verified': True,
                'createdAt': firestore.SERVER_TIMESTAMP,
            }
            
            # Store purchase in Firestore (using receiptId as document ID)
            db.collection('purchases').document(receipt_id).set(purchase_data)
            
            print(f"✅ Purchase created: {receipt_id} for {asset_data.get('title')}")
            
            return jsonify({
                'success': True,
                'receiptId': receipt_id,
                'message': 'Purchase recorded successfully'
            }), 200
        
        else:
            # Other events we don't process
            print(f"ℹ️  Unhandled event type: {event}")
            return jsonify({'message': 'Event received'}), 200
    
    except Exception as e:
        print(f"❌ Webhook error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500


# For local development
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    print(f"🚀 Starting Razorpay Webhook Server on port {port}")
    print(f"📍 Webhook endpoint: http://localhost:{port}/webhook/razorpay")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
