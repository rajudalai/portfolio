import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader, AlertCircle, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { handlePaymentRedirect, waitForPurchaseVerification } from '../utils/razorpayUtils';

/**
 * Payment Success Page
 * 
 * This page is shown after user completes payment on Razorpay Payment Page.
 * It waits for the webhook to process and create the purchase record,
 * then displays the receipt ID and download access.
 */
const PaymentSuccess: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [receiptId, setReceiptId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [paymentId, setPaymentId] = useState<string | null>(null);

    useEffect(() => {
        const processPaymentRedirect = async () => {
            try {
                // Extract payment details from URL
                const redirectData = handlePaymentRedirect();

                if (!redirectData.success || !redirectData.paymentId) {
                    setStatus('error');
                    setError(redirectData.error || 'Invalid payment redirect');
                    return;
                }

                setPaymentId(redirectData.paymentId);

                // Wait for webhook to process (polls Firestore)
                // Webhook typically takes 2-5 seconds to create purchase record
                const receipt = await waitForPurchaseVerification(redirectData.paymentId);

                setReceiptId(receipt);
                setStatus('success');
            } catch (err: any) {
                console.error('Error processing payment:', err);
                setStatus('error');
                setError(err.message || 'Failed to verify payment');
            }
        };

        processPaymentRedirect();
    }, []);

    return (
        <div className="pt-32 pb-24 min-h-screen bg-[#070707] flex items-center justify-center">
            <div className="max-w-2xl mx-auto px-6 w-full">
                {status === 'loading' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-dark-card border border-white/10 rounded-2xl p-12 text-center"
                    >
                        <Loader className="animate-spin text-neon mx-auto mb-6" size={64} />
                        <h2 className="text-2xl font-bold mb-3">Verifying Your Payment...</h2>
                        <p className="text-gray-400">
                            Please wait while we confirm your purchase.
                            <br />
                            This usually takes a few seconds.
                        </p>
                    </motion.div>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-dark-card border border-white/10 rounded-2xl overflow-hidden"
                    >
                        {/* Success Header */}
                        <div className="bg-gradient-to-r from-green-600/20 to-neon/20 border-b border-white/10 p-8 text-center">
                            <CheckCircle className="text-green-400 mx-auto mb-4" size={64} />
                            <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
                            <p className="text-gray-300">Thank you for your purchase</p>
                        </div>

                        {/* Receipt Details */}
                        <div className="p-8">
                            <div className="bg-dark-surface border border-white/5 rounded-xl p-6 mb-6">
                                <p className="text-gray-400 text-sm mb-2">Your Receipt ID:</p>
                                <code className="block bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 font-mono text-neon text-lg">
                                    {receiptId}
                                </code>
                                <p className="text-gray-500 text-xs mt-3">
                                    Save this receipt ID to access your download anytime
                                </p>
                            </div>

                            {paymentId && (
                                <div className="bg-dark-surface border border-white/5 rounded-xl p-4 mb-6">
                                    <p className="text-gray-500 text-xs mb-1">Payment ID:</p>
                                    <code className="text-gray-400 text-sm font-mono">{paymentId}</code>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <a
                                    href={`#bought-access`}
                                    className="w-full py-3 bg-gradient-to-r from-neon to-purple-600 hover:from-neon/90 hover:to-purple-600/90 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    <Download size={20} />
                                    Access Your Download
                                </a>
                                <a
                                    href="#assets"
                                    className="w-full py-3 bg-dark-surface hover:bg-white/10 text-white rounded-lg font-medium transition-colors text-center block"
                                >
                                    Back to Assets
                                </a>
                            </div>

                            <div className="mt-6 bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
                                <p className="text-blue-200/80 text-sm">
                                    <strong className="text-blue-300">Important:</strong> An email confirmation
                                    has been sent to your registered email address with your receipt ID.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-dark-card border border-white/10 rounded-2xl p-12 text-center"
                    >
                        <AlertCircle className="text-red-500 mx-auto mb-6" size={64} />
                        <h2 className="text-2xl font-bold mb-3">Verification Issue</h2>
                        <p className="text-gray-400 mb-6">{error}</p>

                        {paymentId && (
                            <div className="bg-dark-surface border border-white/5 rounded-xl p-4 mb-6">
                                <p className="text-gray-400 text-sm mb-2">
                                    Your payment was processed, but verification is taking longer than expected.
                                </p>
                                <p className="text-gray-500 text-xs mb-3">Payment ID:</p>
                                <code className="text-neon text-sm font-mono">{paymentId}</code>
                            </div>
                        )}

                        <div className="space-y-3">
                            <a
                                href="#bought-access"
                                className="w-full py-3 bg-neon hover:bg-neon/90 text-white rounded-lg font-bold transition-colors text-center block"
                            >
                                Try Accessing Your Purchase
                            </a>
                            <a
                                href="#assets"
                                className="w-full py-3 bg-dark-surface hover:bg-white/10 text-white rounded-lg font-medium transition-colors text-center block"
                            >
                                Back to Assets
                            </a>
                        </div>

                        <p className="text-gray-600 text-sm mt-6">
                            If you continue to experience issues, please contact support with your payment ID.
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
