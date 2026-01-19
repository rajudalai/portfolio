/**
 * Razorpay Payment Integration
 * 
 * Uses Razorpay Standard Checkout with Firebase Cloud Functions backend.
 * Security: Prices are fetched from database by cloud functions based on assetId.
 */

// Base URL for Cloud Functions (HTTP endpoints)
// Using the production URL for the deployed functions
const FUNCTIONS_BASE_URL = 'https://asia-south1-rajudalai-portfolio.cloudfunctions.net';

/**
 * Helper to call HTTP Cloud Function
 */
async function callFunction<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `Function ${endpoint} failed with status ${response.status}`);
    }

    return data as T;
}

// Razorpay Checkout script loader
let razorpayScriptLoaded = false;

/**
 * Dynamically loads the Razorpay checkout script
 * Only loads once per session
 */
async function loadRazorpayScript(): Promise<boolean> {
    if (razorpayScriptLoaded) {
        return true;
    }

    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            razorpayScriptLoaded = true;
            resolve(true);
        };
        script.onerror = () => {
            console.error('Failed to load Razorpay SDK');
            resolve(false);
        };
        document.body.appendChild(script);
    });
}

/**
 * Order creation response from cloud function
 */
interface OrderResponse {
    orderId: string;
    amount: number;
    currency: string;
    assetId: string;
    assetTitle: string;
}

/**
 * Payment verification response from cloud function
 */
interface PaymentVerificationResponse {
    success: boolean;
    receiptId: string;
    purchaseId: string;
    downloadLink?: string;
}

/**
 * Razorpay payment response
 */
interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

/**
 * Initiates Razorpay payment for an asset
 * 
 * Flow:
 * 1. Load Razorpay SDK
 * 2. Call createOrder cloud function (fetches price from database)
 * 3. Open Razorpay checkout modal
 * 4. On payment success, call verifyPayment cloud function
 * 5. Return receipt ID on successful verification
 * 
 * @param assetId - The ID of the asset to purchase
 * @param buyerEmail - Buyer email for receipt and payment notification
 * @returns Receipt ID on successful payment
 */
export async function initiatePayment(
    assetId: string,
    buyerEmail: string
): Promise<string> {
    try {
        // Load Razorpay SDK
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            throw new Error('Failed to load payment gateway. Please refresh and try again.');
        }

        // Get Razorpay key from environment
        const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
        if (!razorpayKeyId) {
            throw new Error('Payment gateway is not configured. Please contact support.');
        }

        // Call createOrder cloud function with buyer email
        // Email is included so Razorpay can send payment notifications
        console.log('Creating order for asset:', assetId, 'buyer:', buyerEmail);
        const orderData = await callFunction<OrderResponse>('createOrder', {
            assetId,
            buyerEmail
        });


        console.log('Order created:', orderData.orderId);

        // Return promise to handle payment completion
        return new Promise((resolve, reject) => {
            const options = {
                key: razorpayKeyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Raju Dalai',
                description: orderData.assetTitle,
                order_id: orderData.orderId,
                prefill: {
                    email: buyerEmail,
                },
                theme: {
                    color: '#8A63F8', // Neon purple color
                },
                handler: async function (response: RazorpayResponse) {
                    try {
                        // Payment successful, verify on backend
                        console.log('Payment successful, verifying...');

                        const verificationData = await callFunction<PaymentVerificationResponse>('verifyPayment', {
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            assetId: orderData.assetId,
                            buyerEmail: buyerEmail,
                        });

                        if (verificationData.success) {
                            console.log('Payment verified, receipt:', verificationData.receiptId);
                            resolve(verificationData.receiptId);
                        } else {
                            reject(new Error('Payment verification failed. Please contact support.'));
                        }
                    } catch (error: any) {
                        console.error('Payment verification error:', error);
                        reject(new Error(error.message || 'Payment verification failed'));
                    }
                },
                modal: {
                    ondismiss: function () {
                        reject(new Error('Payment cancelled by user'));
                    },
                },
            };

            // Open Razorpay checkout
            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();
        });
    } catch (error: any) {
        console.error('Payment initiation error:', error);
        throw new Error(error.message || 'Failed to initiate payment');
    }
}

/**
 * Verifies a receipt ID with email and fetches purchase details.
 * Used by BoughtAccess and ReceiptDetail pages to validate receipts.
 * Requires both receipt ID and buyer email for security verification.
 * 
 * @param receiptId - The receipt ID to verify
 * @param buyerEmail - The email address used during purchase
 * @returns Purchase details if valid, error otherwise
 */
export async function verifyReceipt(receiptId: string, buyerEmail: string): Promise<{
    valid: boolean;
    purchase?: any;
    error?: string;
}> {
    try {
        const result = await callFunction<any>('verifyReceipt', {
            receiptId,
            buyerEmail
        });
        return result;
    } catch (error: any) {
        console.error('Receipt verification error:', error);
        return {
            valid: false,
            error: error.message || 'Failed to verify receipt',
        };
    }
}
