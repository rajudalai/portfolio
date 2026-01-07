/**
 * Razorpay Webhook Handler - Bun + Hono
 * 
 * Ultra-minimal webhook backend using Bun runtime and Hono framework.
 * Faster and simpler than Python - perfect for Railway deployment!
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { createHmac } from "crypto";
import admin from "firebase-admin";

const app = new Hono();

// Enable CORS for your frontend
app.use("/*", cors());

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(Bun.env.FIREBASE_SERVICE_ACCOUNT || "{}");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

// Webhook secret from environment
const WEBHOOK_SECRET = Bun.env.RAZORPAY_WEBHOOK_SECRET || "";

/**
 * Generate unique receipt ID
 */
function generateReceiptId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RCP-${timestamp}-${random}`;
}

/**
 * Verify webhook signature using HMAC SHA256
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
    return expectedSignature === signature;
}

// Health check endpoint
app.get("/", (c) => c.json({
    status: "ok",
    service: "Razorpay Webhook Handler",
    runtime: "Bun"
}));

// Razorpay webhook endpoint
app.post("/webhook/razorpay", async (c) => {
    try {
        // Get signature from header
        const signature = c.req.header("X-Razorpay-Signature");

        if (!signature) {
            console.log("❌ Signature missing");
            return c.json({ error: "Signature missing" }, 400);
        }

        // Get raw body for signature verification
        const rawBody = await c.req.text();

        // Verify signature
        if (!verifySignature(rawBody, signature, WEBHOOK_SECRET)) {
            console.log("❌ Invalid signature");
            return c.json({ error: "Invalid signature" }, 403);
        }

        // Parse webhook data
        const data = JSON.parse(rawBody);
        const event = data.event;
        const payload = data.payload;

        console.log(`✅ Webhook received: ${event}`);

        // Handle payment.captured event
        if (event === "payment.captured") {
            const payment = payload.payment.entity;

            const paymentId = payment.id;
            const amount = payment.amount;
            const currency = payment.currency;
            const customerEmail = payment.email;
            const notes = payment.notes || {};

            // Get asset ID from payment notes
            const assetId = notes.asset_id;

            if (!assetId) {
                console.log(`⚠️  Asset ID missing for payment ${paymentId}`);
                return c.json({ error: "Asset ID missing" }, 400);
            }

            // Fetch asset from Firestore
            const assetRef = db.collection("assets").doc(assetId);
            const assetDoc = await assetRef.get();

            if (!assetDoc.exists) {
                console.log(`❌ Asset not found: ${assetId}`);
                return c.json({ error: "Asset not found" }, 404);
            }

            const assetData = assetDoc.data();

            // Generate receipt ID
            const receiptId = generateReceiptId();
            const purchaseDate = new Date().toISOString();

            // Create purchase record
            const purchaseData = {
                receiptId,
                assetId,
                assetName: assetData?.title || "Unknown Asset",
                price: assetData?.price || "N/A",
                downloadLink: assetData?.downloadLink || "",
                purchaseDate,
                buyerEmail: customerEmail || null,
                razorpayPaymentId: paymentId,
                razorpayAmount: amount,
                razorpayCurrency: currency,
                verified: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            // Save to Firestore
            await db.collection("purchases").doc(receiptId).set(purchaseData);

            console.log(`✅ Purchase created: ${receiptId} for ${assetData?.title}`);

            return c.json({
                success: true,
                receiptId,
                message: "Purchase recorded successfully",
            });
        }

        // Other events
        console.log(`ℹ️  Unhandled event: ${event}`);
        return c.json({ message: "Event received" });

    } catch (error) {
        console.error("❌ Webhook error:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});

// Start server
const port = Bun.env.PORT || 3000;

Bun.serve({
    port,
    fetch: app.fetch,
});

console.log(`🚀 Razorpay Webhook Server running on port ${port}`);
console.log(`📍 Webhook endpoint: http://localhost:${port}/webhook/razorpay`);
