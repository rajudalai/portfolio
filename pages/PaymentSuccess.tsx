import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader, AlertCircle, Download, Sparkles, Copy, ExternalLink, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import { handlePaymentRedirect, waitForPurchaseVerification } from '../utils/razorpayUtils';

/**
 * Payment Success Page
 * 
 * This page is shown after user completes payment on Razorpay Payment Page.
 * It waits for the webhook to process and create the purchase record,
 * then displays the receipt ID and download access.
 * Redesigned with premium glassmorphism and modern aesthetics
 */
const PaymentSuccess: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [receiptId, setReceiptId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

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

    const handleCopyReceiptId = async () => {
        if (receiptId) {
            try {
                await navigator.clipboard.writeText(receiptId);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };

    return (
        <div className="pt-32 pb-24 min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Gradient orbs */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-gradient-to-br from-neon/20 via-purple-600/15 to-transparent rounded-full blur-3xl"
                />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-gradient-to-tl from-emerald-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl"
                />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
            </div>

            <div className="max-w-2xl mx-auto px-6 w-full relative z-10">
                {/* Loading State */}
                {status === 'loading' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group"
                    >
                        {/* Card glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-neon/30 via-purple-600/30 to-cyan-500/30 rounded-3xl blur-xl opacity-50" />

                        <div className="relative backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl p-12 text-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="relative inline-block mb-8"
                            >
                                {/* Outer glow ring */}
                                <div className="absolute inset-0 bg-neon/30 blur-xl rounded-full" />
                                <div className="relative w-20 h-20 rounded-full border-4 border-transparent border-t-neon border-r-purple-500 border-b-cyan-500" />
                            </motion.div>

                            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                Verifying Your Payment...
                            </h2>
                            <p className="text-gray-400 text-lg">
                                Please wait while we confirm your purchase.
                                <br />
                                <span className="text-gray-500">This usually takes a few seconds.</span>
                            </p>

                            {/* Loading dots */}
                            <div className="flex justify-center gap-2 mt-8">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                        className="w-2 h-2 bg-neon rounded-full"
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Success State */}
                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group"
                    >
                        {/* Card glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/40 via-neon/30 to-purple-600/40 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />

                        <div className="relative backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                            {/* Success Header */}
                            <div className="relative bg-gradient-to-r from-emerald-600/20 via-neon/15 to-purple-600/20 border-b border-white/10 p-10 text-center">
                                {/* Celebration particles */}
                                <div className="absolute inset-0 overflow-hidden">
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ y: 100, opacity: 0 }}
                                            animate={{ y: -100, opacity: [0, 1, 0] }}
                                            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity, repeatDelay: 3 }}
                                            className="absolute"
                                            style={{ left: `${20 + i * 12}%` }}
                                        >
                                            <Sparkles size={16} className="text-neon/60" />
                                        </motion.div>
                                    ))}
                                </div>

                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                                    className="relative inline-block mb-6"
                                >
                                    {/* Icon glow */}
                                    <div className="absolute inset-0 bg-emerald-500/40 blur-2xl rounded-full scale-150" />
                                    <div className="relative p-4 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                                        <CheckCircle className="text-emerald-400" size={48} />
                                    </div>
                                </motion.div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                                >
                                    Payment Successful!
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-gray-300 text-lg"
                                >
                                    Thank you for your purchase
                                </motion.p>
                            </div>

                            {/* Receipt Details */}
                            <div className="p-8 md:p-10">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="backdrop-blur-sm bg-black/30 border border-white/10 rounded-2xl p-6 mb-6"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-gray-400 text-sm uppercase tracking-wider">Your Receipt ID</p>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleCopyReceiptId}
                                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                                        >
                                            <Copy size={16} className={copied ? 'text-emerald-400' : 'text-gray-400'} />
                                        </motion.button>
                                    </div>
                                    <code className="block bg-black/50 border border-neon/20 rounded-xl px-5 py-4 font-mono text-neon text-xl tracking-wider">
                                        {receiptId}
                                    </code>
                                    <p className="text-gray-500 text-xs mt-4 flex items-center gap-2">
                                        <Sparkles size={12} className="text-gray-600" />
                                        Save this receipt ID to access your download anytime
                                    </p>
                                </motion.div>

                                {paymentId && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.7 }}
                                        className="bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-6"
                                    >
                                        <p className="text-gray-600 text-xs mb-1">Payment ID</p>
                                        <code className="text-gray-400 text-sm font-mono">{paymentId}</code>
                                    </motion.div>
                                )}

                                {/* Action Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="space-y-4"
                                >
                                    <motion.a
                                        href="/bought-access"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.history.pushState({}, '', '/bought-access');
                                            window.dispatchEvent(new PopStateEvent('popstate'));
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="relative w-full block group/btn overflow-hidden rounded-2xl"
                                    >
                                        {/* Button animated gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-neon via-purple-500 to-neon bg-[length:200%_100%] opacity-90 group-hover/btn:opacity-100 transition-opacity animate-gradient-shift" />

                                        <div className="relative flex items-center justify-center gap-3 py-4 px-8 text-white font-bold text-lg">
                                            <Download size={22} className="group-hover/btn:animate-bounce" />
                                            Access Your Download
                                            <ExternalLink size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </div>
                                    </motion.a>

                                    <a
                                        href="/assets"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.history.pushState({}, '', '/assets');
                                            window.dispatchEvent(new PopStateEvent('popstate'));
                                        }}
                                        className="w-full block py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all text-center"
                                    >
                                        Back to Assets
                                    </a>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.9 }}
                                    className="mt-8 backdrop-blur-sm bg-blue-500/5 border border-blue-500/20 rounded-xl p-5"
                                >
                                    <div className="flex gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg h-fit">
                                            <AlertCircle className="text-blue-400" size={18} />
                                        </div>
                                        <p className="text-blue-200/70 text-sm leading-relaxed">
                                            <strong className="text-blue-300">Important:</strong> An email confirmation
                                            has been sent to your registered email address with your receipt ID.
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Error State */}
                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group"
                    >
                        {/* Card glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 via-orange-500/20 to-red-500/30 rounded-3xl blur-xl opacity-40" />

                        <div className="relative backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl p-12 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                className="relative inline-block mb-6"
                            >
                                <div className="absolute inset-0 bg-red-500/30 blur-xl rounded-full scale-150" />
                                <div className="relative p-4 bg-red-500/20 rounded-full border border-red-500/30">
                                    <AlertCircle className="text-red-400" size={48} />
                                </div>
                            </motion.div>

                            <h2 className="text-3xl font-bold mb-4 text-white">Verification Issue</h2>
                            <p className="text-gray-400 mb-8">{error}</p>

                            {paymentId && (
                                <div className="backdrop-blur-sm bg-black/30 border border-white/10 rounded-xl p-5 mb-8 text-left">
                                    <p className="text-gray-400 text-sm mb-2">
                                        Your payment was processed, but verification is taking longer than expected.
                                    </p>
                                    <p className="text-gray-500 text-xs mb-2">Payment ID:</p>
                                    <code className="text-neon text-sm font-mono">{paymentId}</code>
                                </div>
                            )}

                            <div className="space-y-3">
                                <a
                                    href="/bought-access"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.history.pushState({}, '', '/bought-access');
                                        window.dispatchEvent(new PopStateEvent('popstate'));
                                    }}
                                    className="w-full block py-4 bg-gradient-to-r from-neon to-purple-600 hover:from-neon/90 hover:to-purple-600/90 text-white rounded-xl font-bold transition-all text-center"
                                >
                                    Try Accessing Your Purchase
                                </a>
                                <a
                                    href="/assets"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.history.pushState({}, '', '/assets');
                                        window.dispatchEvent(new PopStateEvent('popstate'));
                                    }}
                                    className="w-full block py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all text-center"
                                >
                                    Back to Assets
                                </a>
                            </div>

                            <p className="text-gray-600 text-sm mt-8">
                                If you continue to experience issues, please contact support with your payment ID.
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* CSS for gradient animation */}
            <style>{`
                @keyframes gradient-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient-shift {
                    animation: gradient-shift 3s ease infinite;
                }
            `}</style>
        </div>
    );
};

export default PaymentSuccess;
