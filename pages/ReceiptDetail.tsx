import React, { useState } from 'react';
import { Download, Calendar, Package, AlertCircle, CheckCircle, Printer, Share2, Sparkles, IndianRupee, Mail, Key, ArrowRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../components/SEO';
import { Purchase } from '../types';

interface ReceiptDetailProps {
    receiptId: string;
}

// Backend API base URL for Firebase Functions
const FUNCTIONS_BASE_URL = 'https://asia-south1-rajudalai-portfolio.cloudfunctions.net';

/**
 * ReceiptDetail component displays a specific purchase receipt.
 * Accessed via URL route: #receipt/:receiptId
 * Requires email verification before showing purchase details.
 * Redesigned with premium glassmorphism and modern aesthetics.
 */
const ReceiptDetail: React.FC<ReceiptDetailProps> = ({ receiptId }) => {
    const [purchase, setPurchase] = useState<Purchase | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Email verification state
    const [buyerEmail, setBuyerEmail] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isEmailFocused, setIsEmailFocused] = useState(false);

    /**
     * Verifies the receipt with the provided email address.
     * Calls the backend endpoint to validate both receipt ID and email match.
     */
    const handleVerify = async () => {
        setError(null);

        if (!buyerEmail.trim()) {
            setError('Please enter your email address');
            return;
        }

        // Basic email format validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(buyerEmail.trim())) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${FUNCTIONS_BASE_URL}/verifyReceipt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    receiptId: receiptId.trim(),
                    buyerEmail: buyerEmail.trim(),
                }),
            });

            const data = await response.json();

            if (data.valid && data.purchase) {
                // Successfully verified
                setPurchase({
                    id: data.purchase.receiptId || receiptId,
                    receiptId: data.purchase.receiptId || receiptId,
                    assetName: data.purchase.assetName || 'Unknown Asset',
                    price: data.purchase.price || 'N/A',
                    downloadLink: data.purchase.downloadLink || '',
                    purchaseDate: data.purchase.purchaseDate || new Date().toISOString(),
                    buyerEmail: data.purchase.buyerEmail,
                });
                setIsVerified(true);
            } else {
                setError(data.error || 'Verification failed. Please check your email and try again.');
            }
        } catch (err) {
            console.error('Error verifying receipt:', err);
            setError('An error occurred while verifying your receipt. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handles Enter key press to trigger verification
     */
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleVerify();
        }
    };

    /**
     * Handles the download process for the purchased asset
     */
    const handleDownload = (url: string) => {
        if (!url) {
            setError('Download link is not available for this purchase.');
            return;
        }

        let finalUrl = url;
        let isDirectDownload = false;

        // Check if it's a Google Drive link and convert to direct download
        if (url.includes('drive.google.com')) {
            const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (idMatch && idMatch[1]) {
                finalUrl = `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
                isDirectDownload = true;
            }
        } else if (url.endsWith('.zip') || url.endsWith('.rar') || url.endsWith('.7z')) {
            isDirectDownload = true;
        }

        if (isDirectDownload) {
            // Trigger direct download
            const link = document.createElement('a');
            link.href = finalUrl;
            link.setAttribute('download', '');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // Open in new tab for external links
            window.open(finalUrl, '_blank');
        }
    };

    /**
     * Formats the purchase date for display
     */
    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    /**
     * Handles print functionality for the receipt
     */
    const handlePrint = () => {
        window.print();
    };

    /**
     * Handles sharing the receipt URL
     */
    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Purchase Receipt',
                    text: `Receipt for ${purchase?.assetName}`,
                    url: url,
                });
            } catch (err) {
                console.log('Share cancelled or failed:', err);
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(url);
                alert('Receipt URL copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy URL:', err);
            }
        }
    };

    return (
        <div className="pt-32 pb-24 min-h-screen bg-[#050505] relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Gradient orbs */}
                <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-neon/20 via-purple-600/10 to-transparent rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-emerald-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

                {/* Floating particles effect using CSS */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(138,99,248,0.03)_0%,transparent_50%)]" />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
            </div>

            <SEO
                title={`Receipt - ${receiptId}`}
                description="Verify your email to view your purchase receipt and download your asset."
                url={window.location.href}
            />

            <div className="max-w-4xl mx-auto px-6 relative z-10">
                {/* Email Verification Form - Show if not verified */}
                <AnimatePresence>
                    {!isVerified && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.6 }}
                        >
                            {/* Header */}
                            <div className="text-center mb-10">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                    className="inline-flex items-center gap-2 px-5 py-2 bg-neon/10 border border-neon/30 rounded-full mb-6"
                                >
                                    <Key size={16} className="text-neon" />
                                    <span className="text-neon text-sm font-semibold tracking-wide">VERIFY PURCHASE</span>
                                </motion.div>

                                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                                    Verify Your Receipt
                                </h1>
                                <p className="text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
                                    For security, please enter the email address you used during purchase to access your receipt.
                                </p>
                            </div>

                            {/* Receipt ID Display */}
                            <div className="text-center mb-8">
                                <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Receipt ID</p>
                                <p className="text-2xl font-mono font-bold bg-gradient-to-r from-neon to-purple-400 bg-clip-text text-transparent">
                                    {receiptId}
                                </p>
                            </div>

                            {/* Verification Form */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="relative group max-w-lg mx-auto"
                            >
                                {/* Glow effect */}
                                <div className={`absolute -inset-1 bg-gradient-to-r from-neon/40 via-purple-600/40 to-cyan-500/40 rounded-3xl blur-xl transition-opacity duration-500 ${isEmailFocused ? 'opacity-60' : 'opacity-0 group-hover:opacity-30'}`} />

                                <div className="relative backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8">
                                    {/* Error Message */}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mb-6 bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                                        >
                                            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                                            <p className="text-red-200/80 text-sm">{error}</p>
                                        </motion.div>
                                    )}

                                    {/* Email Input */}
                                    <div className="mb-6">
                                        <label htmlFor="verifyEmail" className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                            <Mail size={16} className="text-cyan-400" />
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="verifyEmail"
                                                type="email"
                                                value={buyerEmail}
                                                onChange={(e) => setBuyerEmail(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                onFocus={() => setIsEmailFocused(true)}
                                                onBlur={() => setIsEmailFocused(false)}
                                                placeholder="Enter the email used during purchase"
                                                className="w-full px-6 py-4 bg-black/50 border border-white/10 rounded-xl text-white text-lg placeholder-gray-600 focus:outline-none focus:border-cyan-400/50 focus:bg-black/70 transition-all"
                                                disabled={isLoading}
                                                autoFocus
                                            />
                                            {/* Input focus indicator */}
                                            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-all duration-300 ${isEmailFocused ? 'w-full opacity-100' : 'w-0 opacity-0'}`} />
                                        </div>
                                    </div>

                                    {/* Verify Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleVerify}
                                        disabled={isLoading}
                                        className="relative w-full group/btn overflow-hidden px-8 py-4 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-neon to-purple-600 group-hover/btn:from-neon/90 group-hover/btn:to-purple-600/90 transition-all" />

                                        <span className="relative flex items-center justify-center gap-3">
                                            {isLoading ? (
                                                <>
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                                    />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <Search size={20} />
                                                    Verify & View Receipt
                                                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                    </motion.button>

                                    <p className="text-gray-600 text-sm mt-4 text-center flex items-center justify-center gap-2">
                                        <Sparkles size={14} className="text-gray-500" />
                                        This protects your purchase from unauthorized access
                                    </p>
                                </div>
                            </motion.div>

                            {/* Alternative access link */}
                            <div className="text-center mt-8">
                                <p className="text-gray-500 text-sm">
                                    Don't remember your email?{' '}
                                    <a
                                        href="/bought-access"
                                        className="text-neon hover:underline"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.history.pushState({}, '', '/bought-access');
                                            window.dispatchEvent(new PopStateEvent('popstate'));
                                        }}
                                    >
                                        Try the Bought Access page
                                    </a>
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Receipt Details - Show only after verification */}
                <AnimatePresence>
                    {isVerified && purchase && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            {/* Success Header with Celebration */}
                            <div className="text-center mb-10">
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                                    className="relative inline-block"
                                >
                                    {/* Glow effect behind icon */}
                                    <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full scale-150" />
                                    <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 backdrop-blur-sm rounded-full border border-emerald-500/30">
                                        <CheckCircle className="text-emerald-400" size={40} />
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <h1 className="text-4xl md:text-5xl font-bold mt-6 mb-3 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                                        Purchase Complete
                                    </h1>
                                    <p className="text-gray-400 text-lg flex items-center justify-center gap-2">
                                        <Sparkles size={18} className="text-neon" />
                                        Thank you for your purchase!
                                        <Sparkles size={18} className="text-neon" />
                                    </p>
                                </motion.div>
                            </div>

                            {/* Premium Receipt Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="relative group"
                            >
                                {/* Card glow effect */}
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-neon/50 via-purple-600/50 to-emerald-500/50 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />

                                <div className="relative backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                    {/* Receipt Header with Gradient */}
                                    <div className="relative bg-gradient-to-r from-neon/10 via-purple-600/10 to-emerald-500/10 border-b border-white/10 p-8">
                                        {/* Decorative pattern */}
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(138,99,248,0.1)_0%,transparent_50%)]" />

                                        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div>
                                                <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Receipt ID</p>
                                                <p className="text-2xl md:text-3xl font-bold font-mono bg-gradient-to-r from-neon to-purple-400 bg-clip-text text-transparent">
                                                    {purchase.receiptId}
                                                </p>
                                            </div>
                                            <div className="flex gap-3">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={handlePrint}
                                                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all backdrop-blur-sm"
                                                    title="Print Receipt"
                                                >
                                                    <Printer size={22} className="text-gray-300" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={handleShare}
                                                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all backdrop-blur-sm"
                                                    title="Share Receipt"
                                                >
                                                    <Share2 size={22} className="text-gray-300" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Receipt Body */}
                                    <div className="p-8 md:p-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                            {/* Asset Name */}
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 }}
                                                className="group/item flex items-start gap-5"
                                            >
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-neon/20 blur-xl rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                    <div className="relative p-4 bg-gradient-to-br from-neon/10 to-neon/5 border border-neon/20 rounded-xl">
                                                        <Package className="text-neon" size={26} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-sm uppercase tracking-wider mb-1.5">Asset Name</p>
                                                    <p className="text-white font-semibold text-xl">{purchase.assetName}</p>
                                                </div>
                                            </motion.div>

                                            {/* Price */}
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 }}
                                                className="group/item flex items-start gap-5"
                                            >
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                    <div className="relative p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                                        <IndianRupee className="text-emerald-400" size={26} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-sm uppercase tracking-wider mb-1.5">Amount Paid</p>
                                                    <p className="text-white font-semibold text-xl">{purchase.price}</p>
                                                </div>
                                            </motion.div>

                                            {/* Purchase Date - Full Width */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.6 }}
                                                className="group/item flex items-start gap-5 md:col-span-2"
                                            >
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                    <div className="relative p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl">
                                                        <Calendar className="text-blue-400" size={26} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-sm uppercase tracking-wider mb-1.5">Purchase Date</p>
                                                    <p className="text-white font-semibold text-lg">{formatDate(purchase.purchaseDate)}</p>
                                                </div>
                                            </motion.div>
                                        </div>

                                        {/* Download Button Section */}
                                        <div className="relative pt-8 border-t border-white/10">
                                            <motion.button
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.7 }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleDownload(purchase.downloadLink)}
                                                className="relative w-full group/btn overflow-hidden"
                                            >
                                                {/* Button glow */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-neon via-purple-500 to-neon bg-[length:200%_100%] rounded-2xl opacity-80 group-hover/btn:opacity-100 transition-opacity animate-gradient-shift" />

                                                {/* Button content */}
                                                <div className="relative flex items-center justify-center gap-4 py-5 px-8 rounded-2xl text-white font-bold text-lg">
                                                    <Download size={26} className="group-hover/btn:animate-bounce" />
                                                    Download Your Asset
                                                </div>
                                            </motion.button>

                                            <p className="text-center text-gray-500 text-sm mt-4">
                                                Bookmark this page for future access to your download
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Info Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="mt-8 backdrop-blur-xl bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6"
                            >
                                <div className="flex gap-4">
                                    <div className="p-2 bg-blue-500/10 rounded-xl h-fit">
                                        <AlertCircle className="text-blue-400" size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-blue-300 font-semibold text-lg mb-2">Keep This Receipt Safe</h3>
                                        <p className="text-blue-200/70 text-sm leading-relaxed">
                                            Bookmark this page or save the URL for future access to your download.
                                            You can also access your purchase anytime by entering your receipt ID on the{' '}
                                            <a
                                                href="/bought-access"
                                                className="underline hover:text-blue-200 transition-colors"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    window.history.pushState({}, '', '/bought-access');
                                                    window.dispatchEvent(new PopStateEvent('popstate'));
                                                }}
                                            >
                                                Bought Access page
                                            </a>.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
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

export default ReceiptDetail;
