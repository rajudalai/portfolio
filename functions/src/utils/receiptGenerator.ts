/**
 * Receipt ID generation and validation utilities
 * Generates unique, human-readable receipt IDs for purchase tracking
 */

import * as admin from 'firebase-admin';

/**
 * Generates a unique receipt ID
 * Format: RCP-YYYYMMDD-XXXXX
 * Example: RCP-20260108-A3F9B
 * 
 * The format consists of:
 * - Prefix: RCP (Receipt)
 * - Date: YYYYMMDD (for easy chronological sorting)
 * - Random: 5 character alphanumeric string (for uniqueness)
 * 
 * @returns A unique receipt ID string
 */
export function generateReceiptId(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();

    return `RCP-${dateStr}-${randomStr}`;
}

/**
 * Validates the format of a receipt ID
 * @param receiptId - The receipt ID to validate
 * @returns true if the format is valid, false otherwise
 */
export function isValidReceiptFormat(receiptId: string): boolean {
    // Format: RCP-YYYYMMDD-XXXXX
    const pattern = /^RCP-\d{8}-[A-Z0-9]{5}$/;
    return pattern.test(receiptId);
}

/**
 * Checks if a receipt ID already exists in Firestore
 * @param receiptId - The receipt ID to check
 * @returns true if the receipt exists, false otherwise
 */
export async function receiptExists(receiptId: string): Promise<boolean> {
    const db = admin.firestore();
    const purchaseRef = db.collection('purchases').doc(receiptId);
    const doc = await purchaseRef.get();
    return doc.exists;
}

/**
 * Generates a unique receipt ID that doesn't exist in Firestore
 * Retries up to 5 times if collisions occur (highly unlikely)
 * 
 * @returns A guaranteed unique receipt ID
 */
export async function generateUniqueReceiptId(): Promise<string> {
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const receiptId = generateReceiptId();
        const exists = await receiptExists(receiptId);

        if (!exists) {
            return receiptId;
        }

        // If collision (very rare), log and retry
        console.warn(`Receipt ID collision detected: ${receiptId}. Retrying...`);
    }

    throw new Error('Failed to generate unique receipt ID after multiple attempts');
}

/**
 * Formats amount to display string
 * @param amountInPaise - Amount in paise (smallest currency unit)
 * @param currency - Currency code (default: INR)
 * @returns Formatted price string (e.g., "₹49.99")
 */
export function formatAmount(amountInPaise: number, currency: string = 'INR'): string {
    const amount = amountInPaise / 100;

    if (currency === 'INR') {
        return `₹${amount.toFixed(2)}`;
    }

    return `${currency} ${amount.toFixed(2)}`;
}
