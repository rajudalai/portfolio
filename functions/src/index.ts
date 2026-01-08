/**
 * Firebase Cloud Functions for Razorpay Payment Integration
 * 
 * This module contains all cloud functions for handling secure payment processing:
 * - createOrder: Creates Razorpay orders with prices from Firestore
 * - verifyPayment: Verifies payment signatures and creates purchase records
 * - razorpayWebhook: Handles Razorpay webhook events
 * - verifyReceipt: Validates receipt IDs and returns purchase details
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

import { razorpayConfig, appConfig, validateConfig } from './config';
import { generateUniqueReceiptId, formatAmount } from './utils/receiptGenerator';
import {
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
    VerifyReceiptRequest,
    VerifyReceiptResponse,
    PurchaseRecord,
    AssetDocument,
} from './types';

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Validate configuration on startup
try {
    validateConfig();
} catch (error) {
    console.error('Configuration validation failed:', error);
}

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: razorpayConfig.keyId,
    key_secret: razorpayConfig.keySecret,
});

/**
 * Creates a Razorpay order for an asset
 * 
 * This function:
 * 1. Fetches the asset from Firestore to get the actual price
 * 2. Validates the asset exists and has a price
 * 3. Creates a Razorpay order with the database price
 * 4. Returns order details to the frontend
 * 
 * Security: Price is fetched from database, not accepted from client
 */
export const createOrder = functions
    .region(appConfig.region)
    .https.onCall(async (data: CreateOrderRequest, context) => {
        try {
            const { assetId } = data;

            // Validate input
            if (!assetId) {
                throw new functions.https.HttpsError('invalid-argument', 'Asset ID is required');
            }

            // Fetch asset from Firestore to get the price
            const assetRef = db.collection('assets').doc(assetId);
            const assetDoc = await assetRef.get();

            if (!assetDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Asset not found');
            }

            const assetData = assetDoc.data() as AssetDocument;

            // Validate asset has a price
            if (!assetData.price) {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    'This asset is not available for purchase'
                );
            }

            // Parse price (expected format: "₹99" or "$99")
            const priceMatch = assetData.price.match(/[\d.]+/);
            if (!priceMatch) {
                throw new functions.https.HttpsError('internal', 'Invalid price format in database');
            }

            const priceInRupees = parseFloat(priceMatch[0]);
            const amountInPaise = Math.round(priceInRupees * 100); // Convert to paise

            // Generate unique receipt ID for tracking
            const receiptId = await generateUniqueReceiptId();

            // Create Razorpay order
            const orderOptions = {
                amount: amountInPaise,
                currency: appConfig.currency,
                receipt: receiptId,
                notes: {
                    assetId: assetId,
                    assetTitle: assetData.title,
                },
            };

            const order = await razorpayInstance.orders.create(orderOptions);

            // Return order details to frontend
            const response: CreateOrderResponse = {
                orderId: order.id,
                amount: Number(order.amount), // Razorpay returns string | number, ensure it's number
                currency: order.currency,
                assetId: assetId,
                assetTitle: assetData.title,
            };

            console.log(`Order created: ${order.id} for asset: ${assetId}`);
            return response;
        } catch (error: any) {
            console.error('Error creating order:', error);

            if (error instanceof functions.https.HttpsError) {
                throw error;
            }

            throw new functions.https.HttpsError('internal', error.message || 'Failed to create order');
        }
    });

/**
 * Verifies a Razorpay payment and creates purchase record
 * 
 * This function:
 * 1. Verifies the payment signature from Razorpay
 * 2. Fetches order details from Razorpay API
 * 3. Creates a verified purchase record in Firestore
 * 4. Returns receipt ID for download access
 * 
 * Security: Signature verification ensures payment authenticity
 */
export const verifyPayment = functions
    .region(appConfig.region)
    .https.onCall(async (data: VerifyPaymentRequest, context) => {
        try {
            const { orderId, paymentId, signature, assetId, buyerEmail } = data;

            // Validate input
            if (!orderId || !paymentId || !signature || !assetId) {
                throw new functions.https.HttpsError(
                    'invalid-argument',
                    'Missing required payment verification parameters'
                );
            }

            // Verify Razorpay signature
            const isSignatureValid = verifyRazorpaySignature(orderId, paymentId, signature);

            if (!isSignatureValid) {
                throw new functions.https.HttpsError(
                    'permission-denied',
                    'Invalid payment signature. Payment verification failed.'
                );
            }

            // Fetch order details from Razorpay to get receipt ID
            const order = await razorpayInstance.orders.fetch(orderId);
            const receiptId = order.receipt;

            if (!receiptId) {
                throw new functions.https.HttpsError('internal', 'Receipt ID not found in order');
            }

            // Fetch asset details
            const assetRef = db.collection('assets').doc(assetId);
            const assetDoc = await assetRef.get();

            if (!assetDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Asset not found');
            }

            const assetData = assetDoc.data() as AssetDocument;

            // Create purchase record in Firestore
            const purchaseData: PurchaseRecord = {
                receiptId: receiptId,
                assetId,
                assetName: assetData.title,
                price: formatAmount(Number(order.amount), order.currency), // Ensure amount is number
                downloadLink: assetData.downloadLink || '',
                purchaseDate: new Date().toISOString(),
                buyerEmail: buyerEmail || '',
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId,
                razorpaySignature: signature,
                verified: true,
                status: 'completed',
            };

            // Store purchase record using receiptId as document ID
            const purchaseRef = db.collection('purchases').doc(receiptId);
            await purchaseRef.set(purchaseData);

            console.log(`Payment verified and purchase created: ${receiptId} for asset: ${assetId}`);

            // Return success response with receipt ID
            const response: VerifyPaymentResponse = {
                success: true,
                receiptId: receiptId,
                purchaseId: receiptId,
                downloadLink: assetData.downloadLink,
            };

            return response;
        } catch (error: any) {
            console.error('Error verifying payment:', error);

            if (error instanceof functions.https.HttpsError) {
                throw error;
            }

            throw new functions.https.HttpsError('internal', error.message || 'Payment verification failed');
        }
    });

/**
 * Razorpay webhook handler
 * 
 * Receives webhook events from Razorpay for payment status updates
 * Currently handles: payment.captured, payment.failed
 * 
 * Security: Verifies webhook signature before processing
 */
export const razorpayWebhook = functions
    .region(appConfig.region)
    .https.onRequest(async (req, res) => {
        try {
            // Only accept POST requests
            if (req.method !== 'POST') {
                res.status(405).send('Method Not Allowed');
                return;
            }

            // Verify webhook signature
            const webhookSignature = req.headers['x-razorpay-signature'] as string;
            const webhookBody = JSON.stringify(req.body);

            const isValidWebhook = verifyWebhookSignature(webhookBody, webhookSignature);

            if (!isValidWebhook) {
                console.error('Invalid webhook signature');
                res.status(400).send('Invalid signature');
                return;
            }

            // Process webhook event
            const event = req.body.event;
            const payload = req.body.payload;

            console.log(`Webhook received: ${event}`);

            // Handle different event types
            switch (event) {
                case 'payment.captured':
                    await handlePaymentCaptured(payload);
                    break;

                case 'payment.failed':
                    await handlePaymentFailed(payload);
                    break;

                default:
                    console.log(`Unhandled webhook event: ${event}`);
            }

            res.status(200).send('OK');
        } catch (error: any) {
            console.error('Webhook processing error:', error);
            res.status(500).send('Internal Server Error');
        }
    });

/**
 * Verifies a receipt ID and returns purchase details
 * 
 * Used by the BoughtAccess page to validate receipts and show downloads
 */
export const verifyReceipt = functions
    .region(appConfig.region)
    .https.onCall(async (data: VerifyReceiptRequest, context) => {
        try {
            const { receiptId } = data;

            if (!receiptId) {
                throw new functions.https.HttpsError('invalid-argument', 'Receipt ID is required');
            }

            // Fetch purchase record
            const purchaseRef = db.collection('purchases').doc(receiptId);
            const purchaseDoc = await purchaseRef.get();

            if (!purchaseDoc.exists) {
                const response: VerifyReceiptResponse = {
                    valid: false,
                    error: 'Receipt not found. Please check your receipt ID.',
                };
                return response;
            }

            const purchaseData = purchaseDoc.data() as PurchaseRecord;

            // Check if purchase is verified and completed
            if (!purchaseData.verified || purchaseData.status !== 'completed') {
                const response: VerifyReceiptResponse = {
                    valid: false,
                    error: 'This receipt is not yet verified. Please try again in a few moments.',
                };
                return response;
            }

            // Return purchase details
            const response: VerifyReceiptResponse = {
                valid: true,
                purchase: purchaseData,
            };

            console.log(`Receipt verified: ${receiptId}`);
            return response;
        } catch (error: any) {
            console.error('Error verifying receipt:', error);

            if (error instanceof functions.https.HttpsError) {
                throw error;
            }

            throw new functions.https.HttpsError('internal', 'Receipt verification failed');
        }
    });

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Verifies Razorpay payment signature
 * Uses HMAC SHA256 algorithm as per Razorpay documentation
 */
function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
    const generatedSignature = crypto
        .createHmac('sha256', razorpayConfig.keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    return generatedSignature === signature;
}

/**
 * Verifies Razorpay webhook signature
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', razorpayConfig.webhookSecret)
        .update(body)
        .digest('hex');

    return expectedSignature === signature;
}

/**
 * Handles payment.captured webhook event
 * Updates purchase status if needed
 */
async function handlePaymentCaptured(payload: any): Promise<void> {
    const payment = payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;

    console.log(`Payment captured: ${paymentId} for order: ${orderId}`);

    // Fetch order to get receipt ID
    const order = await razorpayInstance.orders.fetch(orderId);
    const receiptId = order.receipt;

    if (!receiptId) {
        console.error('Receipt ID not found in order:', orderId);
        return;
    }

    // Update purchase record status if it exists
    const purchaseRef = db.collection('purchases').doc(receiptId);
    const purchaseDoc = await purchaseRef.get();

    if (purchaseDoc.exists) {
        await purchaseRef.update({
            status: 'completed',
            verified: true,
        });
        console.log(`Purchase updated: ${receiptId}`);
    } else {
        console.log(`Purchase record not found for receipt: ${receiptId}`);
    }
}

/**
 * Handles payment.failed webhook event
 * Marks purchase as failed
 */
async function handlePaymentFailed(payload: any): Promise<void> {
    const payment = payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;

    console.log(`Payment failed: ${paymentId} for order: ${orderId}`);

    // Fetch order to get receipt ID
    const order = await razorpayInstance.orders.fetch(orderId);
    const receiptId = order.receipt;

    if (!receiptId) {
        console.error('Receipt ID not found in order:', orderId);
        return;
    }

    // Update purchase record status
    const purchaseRef = db.collection('purchases').doc(receiptId);
    const purchaseDoc = await purchaseRef.get();

    if (purchaseDoc.exists) {
        await purchaseRef.update({
            status: 'failed',
            verified: false,
        });
        console.log(`Purchase marked as failed: ${receiptId}`);
    }
}
