import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Generates a unique receipt ID using timestamp and random characters
 * Format: RCP-YYYYMMDD-XXXX
 * Example: RCP-20260105-A3F9
 */
export const generateReceiptId = (): string => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RCP-${dateStr}-${randomStr}`;
};

/**
 * Creates a mock purchase record in Firestore
 * This simulates a completed payment transaction and stores the purchase details
 * 
 * @param assetId - The ID of the asset being purchased
 * @param assetName - The name of the asset
 * @param price - The price of the asset (e.g., "$49.99")
 * @param downloadLink - The download URL for the asset
 * @param buyerEmail - Optional buyer email for verification
 * @returns The generated receipt ID
 */
export const createMockPurchase = async (
    assetId: string,
    assetName: string,
    price: string,
    downloadLink: string,
    buyerEmail?: string
): Promise<string> => {
    // Generate unique receipt ID
    const receiptId = generateReceiptId();

    // Create purchase record
    const purchaseData = {
        receiptId,
        assetName,
        price,
        downloadLink,
        purchaseDate: new Date().toISOString(),
        ...(buyerEmail && { buyerEmail }), // Only include if provided
    };

    // Store in Firestore using receiptId as document ID for direct lookup
    const purchaseRef = doc(db, 'purchases', receiptId);
    await setDoc(purchaseRef, purchaseData);

    return receiptId;
};

/**
 * Returns the full URL to the receipt detail page
 * @param receiptId - The receipt ID
 * @returns The full hash URL (e.g., "#receipt/RCP-20260105-ABC1")
 */
export const formatReceiptUrl = (receiptId: string): string => {
    return `#receipt/${receiptId}`;
};

/**
 * Copies text to clipboard
 * @param text - The text to copy
 * @returns Promise that resolves when copy is successful
 */
export const copyToClipboard = async (text: string): Promise<void> => {
    try {
        await navigator.clipboard.writeText(text);
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
};
