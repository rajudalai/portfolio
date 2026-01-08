/**
 * Configuration and environment variables for Firebase Cloud Functions
 * Manages Razorpay credentials and application settings
 */

import * as functions from 'firebase-functions';

/**
 * Razorpay configuration
 * In production, these should be set via Firebase Functions config:
 * firebase functions:config:set razorpay.key_id="rzp_live_xxx"
 * firebase functions:config:set razorpay.key_secret="xxx"
 * firebase functions:config:set razorpay.webhook_secret="xxx"
 */
export const razorpayConfig = {
    keyId: functions.config().razorpay?.key_id || process.env.RAZORPAY_KEY_ID || '',
    keySecret: functions.config().razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: functions.config().razorpay?.webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET || '',
};

/**
 * Application configuration
 */
export const appConfig = {
    currency: 'INR',
    region: 'asia-south1', // Mumbai region for lower latency
};

/**
 * Validates that all required environment variables are set
 * Throws an error if any required config is missing
 */
export function validateConfig(): void {
    if (!razorpayConfig.keyId) {
        throw new Error('Razorpay Key ID is not configured');
    }
    if (!razorpayConfig.keySecret) {
        throw new Error('Razorpay Key Secret is not configured');
    }
    if (!razorpayConfig.webhookSecret) {
        throw new Error('Razorpay Webhook Secret is not configured');
    }
}
