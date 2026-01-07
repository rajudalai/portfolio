import React, { useState, useEffect } from 'react';
import { Download, Calendar, DollarSign, Package, AlertCircle, CheckCircle, Printer, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SEO } from '../components/SEO';
import { Purchase } from '../types';

interface ReceiptDetailProps {
    receiptId: string;
}

/**
 * ReceiptDetail component displays a specific purchase receipt
 * Accessed via URL route: #receipt/:receiptId
 * Automatically fetches and displays purchase details from Firestore
 */
const ReceiptDetail: React.FC<ReceiptDetailProps> = ({ receiptId }) => {
    const [purchase, setPurchase] = useState<Purchase | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch purchase details on component mount
    useEffect(() => {
        const fetchPurchase = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const purchaseRef = doc(db, 'purchases', receiptId);
                const purchaseSnap = await getDoc(purchaseRef);

                if (purchaseSnap.exists()) {
                    const data = purchaseSnap.data();
                    setPurchase({
                        id: purchaseSnap.id,
                        receiptId: data.receiptId || purchaseSnap.id,
                        assetName: data.assetName || 'Unknown Asset',
                        price: data.price || 'N/A',
                        downloadLink: data.downloadLink || '',
                        purchaseDate: data.purchaseDate || new Date().toISOString(),
                        buyerEmail: data.buyerEmail,
                    });
                } else {
                    setError('Receipt not found. Please check your receipt ID and try again.');
                }
            } catch (err) {
                console.error('Error fetching receipt:', err);
                setError('An error occurred while loading your receipt. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        if (receiptId) {
            fetchPurchase();
        } else {
            setError('No receipt ID provided');
            setIsLoading(false);
        }
    }, [receiptId]);

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
        <div className="pt-32 pb-24 min-h-screen bg-[#070707]">
            <SEO
                title={`Receipt - ${receiptId}`}
                description="View your purchase receipt and download your asset."
                url={window.location.href}
            />
            <div className="max-w-4xl mx-auto px-6">
                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon mb-4"></div>
                        <p className="text-gray-400">Loading receipt...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start gap-3"
                    >
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
                        <div>
                            <h3 className="text-red-400 font-semibold mb-1">Error</h3>
                            <p className="text-red-300">{error}</p>
                            <button
                                onClick={() => window.location.hash = 'bought-access'}
                                className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                            >
                                Search by Receipt ID
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Receipt Details */}
                {purchase && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Header */}
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4"
                            >
                                <CheckCircle className="text-green-400" size={32} />
                            </motion.div>
                            <h1 className="text-4xl font-bold mb-2">Purchase Receipt</h1>
                            <p className="text-gray-400">Thank you for your purchase!</p>
                        </div>

                        {/* Receipt Card */}
                        <div className="bg-dark-card border border-white/10 rounded-2xl overflow-hidden mb-6">
                            {/* Receipt Header */}
                            <div className="bg-gradient-to-r from-neon/10 to-purple-600/10 border-b border-white/10 p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Receipt ID</p>
                                        <p className="text-2xl font-bold font-mono text-neon">{purchase.receiptId}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handlePrint}
                                            className="p-2 bg-dark-surface hover:bg-white/10 rounded-lg transition-colors"
                                            title="Print Receipt"
                                        >
                                            <Printer size={20} />
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            className="p-2 bg-dark-surface hover:bg-white/10 rounded-lg transition-colors"
                                            title="Share Receipt"
                                        >
                                            <Share2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Receipt Details */}
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
                                    <div className="flex items-start gap-4 md:col-span-2">
                                        <div className="bg-blue-500/10 p-3 rounded-lg">
                                            <Calendar className="text-blue-400" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Purchase Date</p>
                                            <p className="text-white font-semibold">{formatDate(purchase.purchaseDate)}</p>
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
                                        Save this receipt URL for future access to your download.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <h3 className="text-blue-300 font-semibold mb-1">Keep This Receipt</h3>
                                    <p className="text-blue-200/80 text-sm">
                                        Bookmark this page or save the URL for future access to your download.
                                        You can also access your purchase anytime by entering your receipt ID on the{' '}
                                        <a href="#bought-access" className="underline hover:text-blue-100">
                                            Bought Access page
                                        </a>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ReceiptDetail;
