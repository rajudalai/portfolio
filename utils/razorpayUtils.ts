/**
 * Razorpay Payment Pages Integration
 * 
 * Uses Razorpay Payment Pages (reusable, customizable payment pages) instead
 * of dynamic order creation. This approach is simpler - no complex backend needed,
 * just one webhook function to handle payment verification.
 * 
 * Security: Payment Pages are created in Razorpay Dashboard with fixed prices,
 * so users cannot manipulate prices. Webhooks verify payment authenticity.
 */

import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Payment Page configuration stored in Firestore
 */
export interface PaymentPageConfig {
    pageId: string;
    pageUrl: string;
    assetId: string;
    assetTitle: string;
    price: string;
}

/**
 * Generates a unique receipt ID for purchase tracking
 */
function generateReceiptId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RCP-${timestamp}-${randomPart}`;
}

/**
 * Redirects user to Razorpay Payment Page for an asset
 * 
 * This approach is simpler than creating orders programmatically:
 * 1. Payment Page is pre-created in Razorpay Dashboard
 * 2. User clicks "Buy Now" → Redirects to Payment Page URL
 * 3. User completes payment on Razorpay's hosted page
 * 4. Razorpay sends webhook to our backend
 * 5. Backend creates purchase record in Firestore
 * 6. User is redirected back to success page with receipt ID
 * 
 * @param assetId - The ID of the asset being purchased
 * @param buyerEmail - Optional email to pre-fill
 * @returns Promise that resolves when redirect is initiated
 */
export async function redirectToPaymentPage(
    assetId: string,
    buyerEmail?: string
): Promise<void> {
    try {
        // Fetch asset from Firestore to get its Payment Page URL
        const assetRef = doc(db, 'assets', assetId);
        const assetDoc = await (await import('firebase/firestore')).getDoc(assetRef);

        if (!assetDoc.exists()) {
            throw new Error('Asset not found');
        }

        const assetData = assetDoc.data();
        const paymentPageUrl = assetData.paymentPageUrl;

        if (!paymentPageUrl) {
            throw new Error('Payment Page URL not configured for this asset');
        }

        // Build the redirect URL with pre-filled data
        const url = new URL(paymentPageUrl);

        // Add query parameters to pre-fill customer information
        if (buyerEmail) {
            url.searchParams.append('email', buyerEmail);
        }

        // Add custom data that will be sent back via webhook
        url.searchParams.append('asset_id', assetId);

        // Redirect to Razorpay Payment Page
        window.location.href = url.toString();
    } catch (error: any) {
        console.error('Error redirecting to payment page:', error);
        throw new Error(error.message || 'Failed to initiate payment');
    }
}

/**
 * Handles successful payment redirect from Razorpay
 * 
 * After payment, Razorpay redirects user back to your success URL.
 * Extract payment details from URL parameters and show success message.
 * 
 * Note: Always verify payment on backend via webhook before granting access.
 * This function just handles the UI redirect.
 * 
 * @returns Payment details from URL parameters
 */
export function handlePaymentRedirect(): {
    success: boolean;
    paymentId?: string;
    assetId?: string;
    error?: string;
} {
    const urlParams = new URLSearchParams(window.location.search);

    const paymentId = urlParams.get('razorpay_payment_id');
    const assetId = urlParams.get('asset_id');

    if (paymentId && assetId) {
        return {
            success: true,
            paymentId,
            assetId,
        };
    }

    return {
        success: false,
        error: 'Invalid redirect parameters',
    };
}

/**
 * Checks if a purchase exists for a given payment ID
 * Used to verify if webhook has processed the payment yet
 * 
 * @param paymentId - Razorpay payment ID
 * @returns Purchase data if exists, null otherwise
 */
export async function checkPurchaseStatus(
    paymentId: string
): Promise<{ receiptId: string; verified: boolean } | null> {
    try {
        // Query purchases collection for this payment ID
        const { collection, query, where, getDocs } = await import('firebase/firestore');

        const purchasesRef = collection(db, 'purchases');
        const q = query(purchasesRef, where('razorpayPaymentId', '==', paymentId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const purchaseData = snapshot.docs[0].data();
            return {
                receiptId: purchaseData.receiptId,
                verified: purchaseData.verified || false,
            };
        }

        return null;
    } catch (error) {
        console.error('Error checking purchase status:', error);
        return null;
    }
}

/**
 * Polls for purchase verification after payment redirect
 * 
 * After payment, webhook takes a few seconds to process.
 * This function polls Firestore to check when purchase record is created.
 * 
 * @param paymentId - Razorpay payment ID
 * @param maxAttempts - Maximum number of polling attempts (default: 10)
 * @param intervalMs - Interval between attempts in ms (default: 2000)
 * @returns Receipt ID when purchase is verified
 */
export async function waitForPurchaseVerification(
    paymentId: string,
    maxAttempts: number = 10,
    intervalMs: number = 2000
): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const purchase = await checkPurchaseStatus(paymentId);

        if (purchase && purchase.verified) {
            return purchase.receiptId;
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Payment verification timeout. Please contact support with your payment ID.');
}

/**
 * Gets the success redirect URL for Razorpay Payment Pages
 * This is where users will be redirected after successful payment
 */
export function getSuccessRedirectUrl(): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/#payment-success`;
}

/**
 * Gets the cancel redirect URL for Razorpay Payment Pages
 * This is where users will be redirected if they cancel payment
 */
export function getCancelRedirectUrl(): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/#assets`;
}
