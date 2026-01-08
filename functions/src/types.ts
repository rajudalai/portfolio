/**
 * TypeScript type definitions for Firebase Cloud Functions
 * Used across all payment processing functions
 */

/**
 * Request payload for creating a Razorpay order
 */
export interface CreateOrderRequest {
    assetId: string;
}

/**
 * Response from createOrder function
 */
export interface CreateOrderResponse {
    orderId: string;
    amount: number;
    currency: string;
    assetId: string;
    assetTitle: string;
}

/**
 * Request payload for verifying payment
 */
export interface VerifyPaymentRequest {
    orderId: string;
    paymentId: string;
    signature: string;
    assetId: string;
    buyerEmail?: string;
}

/**
 * Response from verifyPayment function
 */
export interface VerifyPaymentResponse {
    success: boolean;
    receiptId: string;
    purchaseId: string;
    downloadLink?: string;
}

/**
 * Purchase record stored in Firestore
 */
export interface PurchaseRecord {
    receiptId: string;
    assetId: string;
    assetName: string;
    price: string;
    downloadLink: string;
    purchaseDate: string;
    buyerEmail?: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    verified: boolean;
    status: 'pending' | 'completed' | 'failed';
}

/**
 * Razorpay order object structure
 */
export interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    created_at: number;
}

/**
 * Asset document from Firestore
 */
export interface AssetDocument {
    id: string;
    title: string;
    description: string;
    category: 'free' | 'featured' | 'premium';
    price?: string;
    downloadLink?: string;
    order: number;
}

/**
 * Razorpay webhook event structure
 */
export interface WebhookEvent {
    event: string;
    payload: {
        payment: {
            entity: {
                id: string;
                entity: string;
                amount: number;
                currency: string;
                status: string;
                order_id: string;
                method: string;
                created_at: number;
                email?: string;
            };
        };
    };
}

/**
 * Receipt verification request
 */
export interface VerifyReceiptRequest {
    receiptId: string;
}

/**
 * Receipt verification response
 */
export interface VerifyReceiptResponse {
    valid: boolean;
    purchase?: PurchaseRecord;
    error?: string;
}
