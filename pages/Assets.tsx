import React, { useEffect, useState } from 'react';
import { Download, ExternalLink, ShoppingBag, Package, X, CheckCircle, Copy, Receipt, Mail } from 'lucide-react';
import { AssetItem, Asset } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { SEO } from '../components/SEO';
import { initiatePayment } from '../utils/razorpayUtils';
import { copyToClipboard, formatReceiptUrl } from '../utils/purchaseUtils';

// Assets will be fetched from Firebase



const Assets: React.FC = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [assetsLoading, setAssetsLoading] = useState(true);

    // Purchase modal state
    const [purchaseModal, setPurchaseModal] = useState<{
        isOpen: boolean;
        asset: Asset | null;
        isProcessing: boolean;
        isComplete: boolean;
        receiptId: string | null;
        error: string | null;
        buyerEmail: string;
        emailError: string | null;
    }>({
        isOpen: false,
        asset: null,
        isProcessing: false,
        isComplete: false,
        receiptId: null,
        error: null,
        buyerEmail: '',
        emailError: null,
    });

    const [content, setContent] = useState({
        header: {
            title: 'Editing Assets & Resources',
            subtitle: 'A curated collection of free and premium assets I use and recommend for video editing, design, and motion graphics.'
        },
        sections: {
            featuredTitle: 'Featured Assets',
            freeTitle: 'Free Assets',
            premiumTitle: 'Premium Assets',
            viewMore: 'View More'
        },
        badge: 'ASSETS',
        buttons: {
            buyNow: 'Buy Now',
            download: 'Download'
        },
        freeBadge: 'Free',
        toolsTitle: 'Tools I Recommend'
    });

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const contentRef = doc(db, 'settings', 'content');
                const contentSnap = await getDoc(contentRef);
                if (contentSnap.exists()) {
                    const data = contentSnap.data();
                    if (data.assets) {
                        setContent(prev => ({
                            header: { ...prev.header, ...data.assets.header },
                            sections: { ...prev.sections, ...data.assets.sections },
                            badge: data.assets.badge || prev.badge,
                            buttons: { ...prev.buttons, ...data.assets.buttons },
                            freeBadge: data.assets.freeBadge || prev.freeBadge,
                            toolsTitle: data.assets.toolsTitle || prev.toolsTitle
                        }));
                    }
                }
            } catch (error) {
                console.error("Error fetching content:", error);
            }
        };

        const fetchAssets = async () => {
            setAssetsLoading(true);
            try {
                const q = query(collection(db, 'assets'), orderBy('order', 'asc'));
                const querySnapshot = await getDocs(q);
                const data: Asset[] = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Asset));
                setAssets(data);
            } catch (error) {
                console.error("Error fetching assets:", error);
            } finally {
                setAssetsLoading(false);
            }
        };

        fetchContent();
        fetchAssets();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemAnim = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    /**
     * Opens the purchase modal for a premium/featured asset
     */
    const handleBuyNow = (asset: Asset) => {
        setPurchaseModal({
            isOpen: true,
            asset,
            isProcessing: false,
            isComplete: false,
            receiptId: null,
            error: null,
            buyerEmail: '',
            emailError: null,
        });
    };

    /**
     * Closes the purchase modal and resets state
     */
    const closePurchaseModal = () => {
        setPurchaseModal({
            isOpen: false,
            asset: null,
            isProcessing: false,
            isComplete: false,
            receiptId: null,
            error: null,
            buyerEmail: '',
            emailError: null,
        });
    };

    /**
     * Initiates Razorpay payment using cloud functions
     * Opens Razorpay checkout modal, creates order on backend, verifies payment
     */
    /**
     * Validates email format
     */
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleCompletePurchase = async () => {
        if (!purchaseModal.asset) return;

        // Validate email before proceeding
        const trimmedEmail = purchaseModal.buyerEmail.trim();
        if (!trimmedEmail) {
            setPurchaseModal(prev => ({ ...prev, emailError: 'Email is required to receive your receipt' }));
            return;
        }
        if (!isValidEmail(trimmedEmail)) {
            setPurchaseModal(prev => ({ ...prev, emailError: 'Please enter a valid email address' }));
            return;
        }

        setPurchaseModal(prev => ({ ...prev, isProcessing: true, error: null, emailError: null }));

        try {
            // Initiate payment - this will:
            // 1. Call createOrder cloud function (fetches price from database)
            // 2. Open Razorpay checkout modal with email prefilled
            // 3. Verify payment on backend after user completes payment
            // 4. Return receipt ID
            // Razorpay will send payment confirmation email to the buyer
            const receiptId = await initiatePayment(purchaseModal.asset.id, trimmedEmail);

            // Payment successful and verified!
            setPurchaseModal(prev => ({
                ...prev,
                isProcessing: false,
                isComplete: true,
                receiptId,
            }));
        } catch (error: any) {
            console.error('Error processing payment:', error);

            // Check if user cancelled payment
            const isCancelled = error.message.includes('cancelled');

            setPurchaseModal(prev => ({
                ...prev,
                isProcessing: false,
                error: isCancelled
                    ? 'Payment was cancelled. You can try again when ready.'
                    : error.message || 'Failed to process payment. Please try again.',
            }));
        }
    };

    /**
     * Copies receipt ID to clipboard
     */
    const handleCopyReceiptId = async () => {
        if (purchaseModal.receiptId) {
            await copyToClipboard(purchaseModal.receiptId);
            alert('Receipt ID copied to clipboard!');
        }
    };

    /**
     * Navigates to the receipt detail page
     */
    const handleViewReceipt = () => {
        if (purchaseModal.receiptId) {
            window.history.pushState({}, '', formatReceiptUrl(purchaseModal.receiptId));
            // Trigger popstate event so App.tsx can pick up the route change
            window.dispatchEvent(new PopStateEvent('popstate'));
            closePurchaseModal();
        }
    };

    const handleDownload = (url: string) => {
        if (!url) return;

        let finalUrl = url;
        let isDirectDownload = false;

        // Check if it's a Google Drive link
        if (url.includes('drive.google.com')) {
            // Try to extract the ID
            const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (idMatch && idMatch[1]) {
                finalUrl = `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
                isDirectDownload = true;
            }
        } else if (url.endsWith('.zip') || url.endsWith('.rar') || url.endsWith('.7z')) {
            isDirectDownload = true;
        }

        if (isDirectDownload) {
            // Create a temporary anchor element to trigger download
            const link = document.createElement('a');
            link.href = finalUrl;
            link.setAttribute('download', '');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // For other links (e.g. gumroad product page), open in new tab
            window.open(finalUrl, '_blank');
        }
    };

    return (
        <div className="pt-32 pb-24 min-h-screen bg-[#070707]">
            <SEO
                title="Assets"
                description="A curated collection of free and premium assets for video editing and motion graphics."
                url={window.location.href}
            />
            <div className="max-w-7xl mx-auto px-6">

                {/* Loading State */}
                {assetsLoading ? (
                    <div className="flex justify-center items-center py-32">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon"></div>
                    </div>
                ) : (
                    <>
                        {assets.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <p className="text-gray-400 text-lg mb-4">No assets found.</p>
                                <p className="text-gray-600 text-sm">Please check back later.</p>
                            </div>
                        )}

                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="mb-20"
                        >
                            <span className="text-neon text-sm font-bold tracking-widest uppercase mb-4 block">{content.badge}</span>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6">{content.header.title}</h1>
                            <p className="text-gray-400 max-w-2xl text-lg">
                                {content.header.subtitle}
                            </p>

                            {/* Bought Access Link Banner */}
                            <motion.a
                                href="/bought-access"
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.history.pushState({}, '', '/bought-access');
                                    window.dispatchEvent(new PopStateEvent('popstate'));
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-neon/10 to-purple-600/10 border border-neon/30 rounded-xl text-neon hover:border-neon/50 hover:bg-neon/5 transition-all group"
                            >
                                <Receipt size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="font-semibold">Already purchased? Access your downloads here</span>
                                <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
                            </motion.a>
                        </motion.div>

                        {/* Section 1: Featured Packs */}
                        <div className="mb-24">
                            <motion.h2
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="text-2xl font-bold mb-8 flex items-center gap-2"
                            >
                                <Package className="text-neon" size={24} /> {content.sections.featuredTitle}
                            </motion.h2>
                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 md:grid-cols-3 gap-8"
                            >
                                {assets.filter(a => a.category === 'featured').map(asset => (
                                    <motion.div
                                        key={asset.id}
                                        variants={itemAnim}
                                        whileHover={{ y: -8, boxShadow: "0 20px 40px -20px rgba(138, 99, 248, 0.1)" }}
                                        className="group bg-dark-card border border-white/10 rounded-xl overflow-hidden hover:border-neon/50 transition-all shadow-lg"
                                    >
                                        <div className="aspect-video bg-gray-900 relative">
                                            {asset.imageUrl ? (
                                                <img src={asset.imageUrl} alt={asset.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                    <Package size={64} />
                                                </div>
                                            )}
                                            {asset.price && (
                                                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                                                    {asset.price}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <h3 className="font-bold text-lg text-white mb-2">{asset.title}</h3>
                                            <p className="text-gray-400 text-sm mb-6">{asset.description}</p>
                                            <button
                                                onClick={() => handleBuyNow(asset)}
                                                className="w-full py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <ShoppingBag size={16} /> {content.buttons.buyNow}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Section 2: Free Assets */}
                        <div className="mb-24">
                            <motion.h2
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="text-2xl font-bold mb-8 flex items-center gap-2"
                            >
                                <Download className="text-neon" size={24} /> {content.sections.freeTitle}
                            </motion.h2>
                            <motion.div
                                variants={container}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                            >
                                {assets.filter(a => a.category === 'free').map(asset => (
                                    <motion.div
                                        key={asset.id}
                                        variants={itemAnim}
                                        whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.03)" }}
                                        className="bg-dark-surface border border-white/5 p-6 rounded-xl transition-colors group"
                                    >
                                        <div className="mb-4">
                                            <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-1 rounded uppercase tracking-wider">{content.freeBadge}</span>
                                        </div>
                                        <h3 className="font-bold text-white mb-2 group-hover:text-neon transition-colors">{asset.title}</h3>
                                        <p className="text-gray-500 text-sm mb-6 h-10">{asset.description}</p>
                                        <button
                                            onClick={() => asset.downloadLink && handleDownload(asset.downloadLink)}
                                            className="text-sm text-neon hover:text-white font-medium flex items-center gap-1 transition-colors"
                                        >
                                            {content.buttons.download} <ExternalLink size={12} />
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Section 3: Premium List */}
                        <div className="mb-24">
                            <motion.h2
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="text-2xl font-bold mb-8"
                            >
                                {content.sections.premiumTitle}
                            </motion.h2>
                            <motion.div
                                variants={container}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {assets.filter(a => a.category === 'premium').map(asset => (
                                    <motion.div
                                        key={asset.id}
                                        variants={itemAnim}
                                        whileHover={{ x: 5, borderColor: "rgba(255,255,255,0.2)" }}
                                        className="bg-dark-card border border-white/10 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                                    >
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{asset.title}</h3>
                                            <p className="text-gray-400 text-sm">{asset.description}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {asset.price && <span className="text-xl font-bold text-white">{asset.price}</span>}
                                            <button
                                                onClick={() => handleBuyNow(asset)}
                                                className="px-6 py-2 border border-white/20 hover:bg-white hover:text-black rounded-lg text-sm font-bold transition-colors"
                                            >
                                                {content.buttons.buyNow}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Section 4: Tools */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="border-t border-white/10 pt-16"
                        >
                            <h2 className="text-xl font-bold mb-6 text-gray-300">{content.toolsTitle}</h2>
                            <div className="flex flex-wrap gap-4">
                                {['Envato Elements', 'Motion Array', 'Epidemic Sound', 'Artlist.io', 'Midjourney', 'Aescripts'].map((tool, i) => (
                                    <motion.span
                                        key={tool}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ scale: 1.1, borderColor: "rgba(138, 99, 248, 0.4)", color: "#fff" }}
                                        className="px-4 py-2 bg-black border border-white/10 rounded-lg text-gray-400 text-sm cursor-default transition-colors"
                                    >
                                        {tool}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.div>

                    </>
                )}

                {/* Purchase Modal */}
                <AnimatePresence>
                    {purchaseModal.isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={closePurchaseModal}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[#111] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden"
                            >
                                {/* Modal Header */}
                                <div className="flex justify-between items-center p-6 border-b border-white/10">
                                    <h2 className="text-2xl font-bold">
                                        {purchaseModal.isComplete ? 'Purchase Complete!' : 'Complete Purchase'}
                                    </h2>
                                    <button
                                        onClick={closePurchaseModal}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Modal Content */}
                                <div className="p-6">
                                    {!purchaseModal.isComplete ? (
                                        <>
                                            {/* Purchase Confirmation */}
                                            <div className="mb-6">
                                                <p className="text-gray-400 mb-4">You are about to purchase:</p>
                                                <div className="bg-dark-surface border border-white/5 rounded-xl p-4">
                                                    <h3 className="font-bold text-lg mb-2">{purchaseModal.asset?.title}</h3>
                                                    <p className="text-gray-400 text-sm mb-3">{purchaseModal.asset?.description}</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400">Price:</span>
                                                        <span className="text-2xl font-bold text-neon">{purchaseModal.asset?.price}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Email Input Field */}
                                            <div className="mb-6">
                                                <label className="block text-gray-400 text-sm mb-2">Your Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                                    <input
                                                        type="email"
                                                        value={purchaseModal.buyerEmail}
                                                        onChange={(e) => setPurchaseModal(prev => ({
                                                            ...prev,
                                                            buyerEmail: e.target.value,
                                                            emailError: null
                                                        }))}
                                                        placeholder="Enter your email for receipt"
                                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-500 focus:border-neon/50 focus:outline-none transition-colors"
                                                        disabled={purchaseModal.isProcessing}
                                                    />
                                                </div>
                                                {purchaseModal.emailError && (
                                                    <p className="mt-2 text-red-400 text-sm">{purchaseModal.emailError}</p>
                                                )}
                                                <p className="mt-2 text-gray-500 text-xs">Payment confirmation and receipt will be sent to this email.</p>
                                            </div>

                                            {purchaseModal.error && (
                                                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                                                    {purchaseModal.error}
                                                </div>
                                            )}

                                            <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                                                <p className="text-blue-200/80 text-sm">
                                                    <strong className="text-blue-300">Secure Payment:</strong> Your payment will be processed securely through Razorpay.
                                                    You'll receive a payment confirmation email with your receipt ID.
                                                </p>
                                            </div>

                                            <button
                                                onClick={handleCompletePurchase}
                                                disabled={purchaseModal.isProcessing}
                                                className="w-full py-3 bg-gradient-to-r from-neon to-purple-600 hover:from-neon/90 hover:to-purple-600/90 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {purchaseModal.isProcessing ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShoppingBag size={20} />
                                                        Complete Purchase
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {/* Purchase Success */}
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="text-center mb-6"
                                            >
                                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                                                    <CheckCircle className="text-green-400" size={32} />
                                                </div>
                                                <h3 className="text-xl font-bold mb-2">Thank you for your purchase!</h3>
                                                <p className="text-gray-400">Your receipt has been generated.</p>
                                            </motion.div>

                                            <div className="bg-dark-surface border border-white/5 rounded-xl p-4 mb-6">
                                                <p className="text-gray-400 text-sm mb-2">Receipt ID:</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 font-mono text-neon">
                                                        {purchaseModal.receiptId}
                                                    </code>
                                                    <button
                                                        onClick={handleCopyReceiptId}
                                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                                        title="Copy Receipt ID"
                                                    >
                                                        <Copy size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <button
                                                    onClick={handleViewReceipt}
                                                    className="w-full py-3 bg-gradient-to-r from-neon to-purple-600 hover:from-neon/90 hover:to-purple-600/90 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                                                >
                                                    <Receipt size={20} />
                                                    View Receipt & Download
                                                </button>
                                                <button
                                                    onClick={closePurchaseModal}
                                                    className="w-full py-3 bg-dark-surface hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div >
    );
};

export default Assets;
