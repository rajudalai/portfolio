import React, { useState } from 'react';
import { Download, Search, Package, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
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
 */
const BoughtAccess: React.FC = () => {
    const [receiptId, setReceiptId] = useState('');
    const [purchase, setPurchase] = useState<Purchase | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    /**
     * Handles the search operation when the user submits a receipt ID
     * Fetches purchase data from Firestore using the receipt ID as the document key
     */
    const handleSearch = async () => {
        // Reset previous state
        setError(null);
        setPurchase(null);
        setHasSearched(true);

        // Validate input
        if (!receiptId.trim()) {
            setError('Please enter a receipt ID');
            return;
        }

        setIsLoading(true);

        try {
            // Fetch purchase document from Firestore
            // Using receiptId as the document ID for direct lookup
            const purchaseRef = doc(db, 'purchases', receiptId.trim());
            const purchaseSnap = await getDoc(purchaseRef);

            if (purchaseSnap.exists()) {
                // Purchase found - populate the purchase data
                const data = purchaseSnap.data();
                setPurchase({
                    id: purchaseSnap.id||"1",
                    receiptId: data.receiptId || purchaseSnap.id,
                    assetName: data.assetName || 'Unknown Asset',
                    price: data.price || 'N/A',
                    downloadLink: data.downloadLink || '',
                    purchaseDate: data.purchaseDate || new Date().toISOString(),
                    buyerEmail: data.buyerEmail,
                });
            } else {
                // No purchase found with this receipt ID
                setError('Receipt ID not found. Please check your receipt and try again.');
            }
        } catch (err) {
            console.error('Error fetching purchase:', err);
            setError('An error occurred while fetching your purchase. Please try again later.');
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
            return date.toLocaleDateString('en-US', {
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
        <div className="pt-32 pb-24 min-h-screen bg-[#070707]">
            <SEO
                title="Access Your Purchase"
                description="Enter your receipt ID to access and download your purchased assets."
                url={window.location.href}
            />
            <div className="max-w-4xl mx-auto px-6">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-12 text-center"
                >
                    <span className="text-neon text-sm font-bold tracking-widest uppercase mb-4 block">
                        PURCHASED ASSETS
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        Access Your Purchase
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Enter your receipt ID below to retrieve your purchased asset and download link.
                    </p>
                </motion.div>

                {/* Search Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-12"
                >
                    <div className="bg-dark-card border border-white/10 rounded-2xl p-8">
                        <label htmlFor="receiptId" className="block text-sm font-medium text-gray-300 mb-3">
                            Receipt ID
                        </label>
                        <div className="flex gap-3">
                            <input
                                id="receiptId"
                                type="text"
                                value={receiptId}
                                onChange={(e) => setReceiptId(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter your receipt ID (e.g., RCP-123456)"
                                className="flex-1 px-4 py-3 bg-dark-surface border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon/50 transition-colors"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isLoading}
                                className="px-6 py-3 bg-neon hover:bg-neon/90 text-white rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search size={20} />
                                        Search
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-gray-500 text-xs mt-3">
                            Your receipt ID was sent to your email after purchase.
                        </p>
                    </div>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-8 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"
                        >
                            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="text-red-400 font-semibold mb-1">Error</h3>
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Purchase Details Card */}
                <AnimatePresence>
                    {purchase && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="bg-dark-card border border-white/10 rounded-2xl overflow-hidden"
                        >
                            {/* Success Header */}
                            <div className="bg-gradient-to-r from-neon/20 to-purple-600/20 border-b border-white/10 p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckCircle className="text-green-400" size={24} />
                                    <h2 className="text-2xl font-bold text-white">Purchase Found!</h2>
                                </div>
                                <p className="text-gray-300 text-sm">
                                    Your purchase details have been retrieved successfully.
                                </p>
                            </div>

                            {/* Purchase Details */}
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {/* Asset Name */}
                                    <div className="flex items-start gap-4">
                                        <div className="bg-neon/10 p-3 rounded-lg">
                                            <Package className="text-neon" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Asset Name</p>
                                            <p className="text-white font-semibold text-lg">{purchase.assetName}</p>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-start gap-4">
                                        <div className="bg-green-500/10 p-3 rounded-lg">
                                            <DollarSign className="text-green-400" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Price</p>
                                            <p className="text-white font-semibold text-lg">{purchase.price}</p>
                                        </div>
                                    </div>

                                    {/* Purchase Date */}
                                    <div className="flex items-start gap-4">
                                        <div className="bg-blue-500/10 p-3 rounded-lg">
                                            <Calendar className="text-blue-400" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Purchase Date</p>
                                            <p className="text-white font-semibold">
                                                {formatDate(purchase.purchaseDate)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Receipt ID */}
                                    <div className="flex items-start gap-4">
                                        <div className="bg-purple-500/10 p-3 rounded-lg">
                                            <Search className="text-purple-400" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Receipt ID</p>
                                            <p className="text-white font-semibold font-mono">{purchase.receiptId}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Download Button */}
                                <div className="border-t border-white/10 pt-6">
                                    <button
                                        onClick={() => handleDownload(purchase.downloadLink)}
                                        className="w-full py-4 bg-gradient-to-r from-neon to-purple-600 hover:from-neon/90 hover:to-purple-600/90 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-neon/20 hover:shadow-neon/40"
                                    >
                                        <Download size={24} />
                                        Download Asset
                                    </button>
                                    <p className="text-center text-gray-500 text-xs mt-3">
                                        This download link is valid for your purchase. Save it for future access.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* No Results Message */}
                {hasSearched && !purchase && !error && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <Package className="text-gray-600 mx-auto mb-4" size={48} />
                        <p className="text-gray-400">No purchase found with that receipt ID.</p>
                        <p className="text-gray-600 text-sm mt-2">
                            Please verify your receipt ID and try again.
                        </p>
                    </motion.div>
                )}

                {/* Help Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-16 border-t border-white/10 pt-12"
                >
                    <h3 className="text-xl font-bold mb-4 text-center">Need Help?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-dark-surface border border-white/5 p-6 rounded-xl text-center">
                            <div className="bg-neon/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                <AlertCircle className="text-neon" size={20} />
                            </div>
                            <h4 className="font-semibold text-white mb-2">Can't find your receipt?</h4>
                            <p className="text-gray-500 text-sm">
                                Check your email inbox or spam folder for the purchase confirmation.
                            </p>
                        </div>

                        <div className="bg-dark-surface border border-white/5 p-6 rounded-xl text-center">
                            <div className="bg-neon/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Download className="text-neon" size={20} />
                            </div>
                            <h4 className="font-semibold text-white mb-2">Download issues?</h4>
                            <p className="text-gray-500 text-sm">
                                Make sure your browser allows downloads and try again.
                            </p>
                        </div>

                        <div className="bg-dark-surface border border-white/5 p-6 rounded-xl text-center">
                            <div className="bg-neon/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Package className="text-neon" size={20} />
                            </div>
                            <h4 className="font-semibold text-white mb-2">Wrong asset?</h4>
                            <p className="text-gray-500 text-sm">
                                Contact support with your receipt ID for assistance.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default BoughtAccess;
