import React, { useState } from 'react';
import { Download, Search, Package, Calendar, AlertCircle, CheckCircle, Sparkles, Key, IndianRupee, ArrowRight, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SEO } from '../components/SEO';

/**
 * Purchase interface defines the structure of a purchase/receipt record
 * stored in Firestore under the 'purchases' collection
 */
interface Purchase {
    id: string;
    receiptId: string;
    assetName: string;
    price: string;
    downloadLink: string;
    purchaseDate: string; // ISO timestamp or formatted date
    buyerEmail?: string; // Optional: for verification
}

/**
 * BoughtAccess component allows users to retrieve their purchased assets
 * by entering their receipt ID. The page fetches purchase details from
 * Firestore and displays download links and purchase information.
 * Redesigned with premium glassmorphism and modern aesthetics
 */
const BoughtAccess: React.FC = () => {
    const [receiptId, setReceiptId] = useState('');
    const [buyerEmail, setBuyerEmail] = useState('');
    const [purchase, setPurchase] = useState<Purchase | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isEmailFocused, setIsEmailFocused] = useState(false);

    // Backend API base URL for Firebase Functions
    const FUNCTIONS_BASE_URL = 'https://asia-south1-rajudalai-portfolio.cloudfunctions.net';

    /**
     * Handles the search operation when the user submits a receipt ID and email.
     * Calls the backend verifyReceipt endpoint for secure verification.
     */
    const handleSearch = async () => {
        // Reset previous state
        setError(null);
        setPurchase(null);
        setHasSearched(true);

        // Validate inputs
        if (!receiptId.trim()) {
            setError('Please enter a receipt ID');
            return;
        }

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
            // Call the backend verifyReceipt endpoint with both receipt ID and email
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
                // Purchase verified successfully
                setPurchase({
                    id: data.purchase.receiptId || receiptId,
                    receiptId: data.purchase.receiptId || receiptId,
                    assetName: data.purchase.assetName || 'Unknown Asset',
                    price: data.purchase.price || 'N/A',
                    downloadLink: data.purchase.downloadLink || '',
                    purchaseDate: data.purchase.purchaseDate || new Date().toISOString(),
                    buyerEmail: data.purchase.buyerEmail,
                });
            } else {
                // Verification failed - show the error message from backend
                setError(data.error || 'Receipt verification failed. Please check your details and try again.');
            }
        } catch (err) {
            console.error('Error verifying purchase:', err);
            setError('An error occurred while verifying your purchase. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handles the Enter key press to trigger search
     */
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    /**
     * Initiates the download process for the purchased asset
     * Handles both direct downloads and external links (e.g., Google Drive)
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

    return (
        <div className="pt-32 pb-24 min-h-screen bg-[#050505] relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Gradient orbs */}
                <div className="absolute top-40 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-neon/15 via-purple-600/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-40 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-cyan-500/10 via-blue-500/10 to-transparent rounded-full blur-3xl" />

                {/* Floating particles effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(138,99,248,0.02)_0%,transparent_50%)]" />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <SEO
                title="Access Your Purchase"
                description="Enter your receipt ID to access and download your purchased assets."
                url={window.location.href}
            />

            <div className="max-w-5xl mx-auto px-6 relative z-10">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-14 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-neon/10 border border-neon/30 rounded-full mb-6"
                    >
                        <Key size={16} className="text-neon" />
                        <span className="text-neon text-sm font-semibold tracking-wide">PURCHASED ASSETS</span>
                    </motion.div>

                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                        Access Your Purchase
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                        Enter your receipt ID and email address to verify and access your purchased asset.
                    </p>
                </motion.div>

                {/* Premium Search Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-12"
                >
                    <div className="relative group">
                        {/* Glow effect */}
                        <div className={`absolute -inset-1 bg-gradient-to-r from-neon/40 via-purple-600/40 to-cyan-500/40 rounded-3xl blur-xl transition-opacity duration-500 ${isInputFocused || isEmailFocused ? 'opacity-60' : 'opacity-0 group-hover:opacity-30'}`} />

                        <div className="relative backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 md:p-10">
                            {/* Receipt ID Input */}
                            <div className="mb-6">
                                <label htmlFor="receiptId" className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                    <Key size={16} className="text-neon" />
                                    Receipt ID
                                </label>
                                <div className="relative">
                                    <input
                                        id="receiptId"
                                        type="text"
                                        value={receiptId}
                                        onChange={(e) => setReceiptId(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        onFocus={() => setIsInputFocused(true)}
                                        onBlur={() => setIsInputFocused(false)}
                                        placeholder="Enter your receipt ID (e.g., rcpt_1704825600)"
                                        className="w-full px-6 py-4 bg-black/50 border border-white/10 rounded-xl text-white text-lg placeholder-gray-600 focus:outline-none focus:border-neon/50 focus:bg-black/70 transition-all"
                                        disabled={isLoading}
                                    />
                                    {/* Input focus indicator */}
                                    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-neon to-transparent transition-all duration-300 ${isInputFocused ? 'w-full opacity-100' : 'w-0 opacity-0'}`} />
                                </div>
                            </div>

                            {/* Email Input */}
                            <div className="mb-6">
                                <label htmlFor="buyerEmail" className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                    <Mail size={16} className="text-cyan-400" />
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        id="buyerEmail"
                                        type="email"
                                        value={buyerEmail}
                                        onChange={(e) => setBuyerEmail(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        onFocus={() => setIsEmailFocused(true)}
                                        onBlur={() => setIsEmailFocused(false)}
                                        placeholder="Enter the email used during purchase"
                                        className="w-full px-6 py-4 bg-black/50 border border-white/10 rounded-xl text-white text-lg placeholder-gray-600 focus:outline-none focus:border-cyan-400/50 focus:bg-black/70 transition-all"
                                        disabled={isLoading}
                                    />
                                    {/* Input focus indicator */}
                                    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-all duration-300 ${isEmailFocused ? 'w-full opacity-100' : 'w-0 opacity-0'}`} />
                                </div>
                            </div>

                            {/* Search Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSearch}
                                disabled={isLoading}
                                className="relative w-full group/btn overflow-hidden px-8 py-4 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {/* Button gradient background */}
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
                                            Verify & Access
                                            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </motion.button>

                            <p className="text-gray-600 text-sm mt-4 flex items-center gap-2">
                                <Sparkles size={14} className="text-gray-500" />
                                Use the same email you provided during checkout for verification
                            </p>

                        </div>
                    </div>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="mb-10 backdrop-blur-xl bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4"
                        >
                            <div className="p-2 bg-red-500/10 rounded-xl">
                                <AlertCircle className="text-red-400" size={22} />
                            </div>
                            <div>
                                <h3 className="text-red-300 font-semibold text-lg mb-1">Error</h3>
                                <p className="text-red-200/80">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Purchase Details Card */}
                <AnimatePresence>
                    {purchase && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.5 }}
                            className="relative group"
                        >
                            {/* Card glow effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 via-neon/30 to-purple-600/30 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

                            <div className="relative backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                {/* Success Header */}
                                <div className="relative bg-gradient-to-r from-emerald-500/10 via-neon/10 to-purple-600/10 border-b border-white/10 p-8">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(52,211,153,0.1)_0%,transparent_50%)]" />

                                    <div className="relative flex items-center gap-4">
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                            className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30"
                                        >
                                            <CheckCircle className="text-emerald-400" size={28} />
                                        </motion.div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-bold text-white">Purchase Found!</h2>
                                            <p className="text-gray-400">Your purchase details have been retrieved successfully</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Purchase Details */}
                                <div className="p-8 md:p-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                        {/* Asset Name */}
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 }}
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
                                            transition={{ delay: 0.2 }}
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

                                        {/* Purchase Date */}
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="group/item flex items-start gap-5"
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

                                        {/* Receipt ID */}
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="group/item flex items-start gap-5"
                                        >
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                <div className="relative p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl">
                                                    <Key className="text-purple-400" size={26} />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-sm uppercase tracking-wider mb-1.5">Receipt ID</p>
                                                <p className="text-white font-semibold font-mono text-lg">{purchase.receiptId}</p>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Download Button */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="pt-8 border-t border-white/10"
                                    >
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleDownload(purchase.downloadLink)}
                                            className="relative w-full group/btn overflow-hidden"
                                        >
                                            {/* Button animated gradient */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-neon via-purple-500 to-neon bg-[length:200%_100%] rounded-2xl opacity-90 group-hover/btn:opacity-100 transition-opacity animate-gradient-shift" />

                                            {/* Button content */}
                                            <div className="relative flex items-center justify-center gap-4 py-5 px-8 rounded-2xl text-white font-bold text-lg">
                                                <Download size={26} className="group-hover/btn:animate-bounce" />
                                                Download Asset
                                            </div>
                                        </motion.button>

                                        <p className="text-center text-gray-500 text-sm mt-4">
                                            This download link is valid for your purchase. Save it for future access.
                                        </p>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* No Results Message */}
                {hasSearched && !purchase && !error && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800/50 rounded-full mb-6">
                            <Package className="text-gray-600" size={40} />
                        </div>
                        <p className="text-gray-400 text-lg">No purchase found with that receipt ID.</p>
                        <p className="text-gray-600 text-sm mt-2">
                            Please verify your receipt ID and try again.
                        </p>
                    </motion.div>
                )}

                {/* Help Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-20 pt-12 border-t border-white/5"
                >
                    <h3 className="text-2xl font-bold mb-8 text-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Need Help?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: AlertCircle,
                                title: "Can't find your receipt?",
                                description: "Check your email inbox or spam folder for the purchase confirmation."
                            },
                            {
                                icon: Download,
                                title: "Download issues?",
                                description: "Make sure your browser allows downloads and try again."
                            },
                            {
                                icon: Package,
                                title: "Wrong asset?",
                                description: "Contact support with your receipt ID for assistance."
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 + index * 0.1 }}
                                whileHover={{ y: -5, borderColor: 'rgba(138, 99, 248, 0.3)' }}
                                className="backdrop-blur-sm bg-white/[0.02] border border-white/5 p-8 rounded-2xl text-center transition-all group"
                            >
                                <div className="bg-neon/10 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-neon/20 transition-colors">
                                    <item.icon className="text-neon" size={24} />
                                </div>
                                <h4 className="font-semibold text-white mb-2 text-lg">{item.title}</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
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

export default BoughtAccess;
