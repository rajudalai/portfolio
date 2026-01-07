import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp, setDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Save, X, Download, Calendar, DollarSign, Package, Search, AlertCircle } from 'lucide-react';

/**
 * Purchase interface matching the structure in BoughtAccess page
 * This represents a purchase/receipt record stored in Firestore
 */
interface Purchase {
    id: string;
    receiptId: string;
    assetName: string;
    price: string;
    downloadLink: string;
    purchaseDate: string; // ISO timestamp
    buyerEmail?: string; // Optional buyer email for verification
}

/**
 * PurchasesTab component provides CRUD operations for managing purchase records
 * This allows admins to create, update, and delete purchase entries that users
 * can access via the Bought Access page using their receipt IDs
 */
const PurchasesTab: React.FC = () => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state for purchase data
    const [formData, setFormData] = useState<Omit<Purchase, 'id'>>({
        receiptId: '',
        assetName: '',
        price: '',
        downloadLink: '',
        purchaseDate: new Date().toISOString(),
        buyerEmail: '',
    });

    useEffect(() => {
        fetchPurchases();
    }, []);

    /**
     * Fetches all purchase records from Firestore
     * Ordered by purchase date in descending order (newest first)
     */
    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'purchases'), orderBy('purchaseDate', 'desc'));
            const querySnapshot = await getDocs(q);
            const data: Purchase[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Purchase));
            setPurchases(data);
        } catch (error) {
            console.error('Error fetching purchases:', error);
            // If orderBy fails (missing index), try without ordering
            try {
                const fallbackQuery = collection(db, 'purchases');
                const querySnapshot = await getDocs(fallbackQuery);
                const data: Purchase[] = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as Purchase));
                setPurchases(data);
            } catch (fallbackError) {
                console.error('Error fetching purchases (fallback):', fallbackError);
                alert('Failed to fetch purchases. Check console for details.');
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * Resets the form to initial empty state
     */
    const resetForm = () => {
        setFormData({
            receiptId: '',
            assetName: '',
            price: '',
            downloadLink: '',
            purchaseDate: new Date().toISOString(),
            buyerEmail: '',
        });
        setEditingId(null);
        setShowForm(false);
    };

    /**
     * Generates a unique receipt ID using timestamp and random characters
     * Format: RCP-YYYYMMDD-XXXX
     */
    const generateReceiptId = () => {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `RCP-${dateStr}-${randomStr}`;
    };

    /**
     * Handles form submission for creating or updating a purchase
     * If editing, updates existing document; otherwise creates new one
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validate required fields
        if (!formData.receiptId || !formData.assetName || !formData.price || !formData.downloadLink) {
            alert('Please fill in all required fields');
            setLoading(false);
            return;
        }

        try {
            if (editingId) {
                // Update existing purchase
                const purchaseRef = doc(db, 'purchases', editingId);
                await updateDoc(purchaseRef, formData);
            } else {
                // Create new purchase using receiptId as document ID
                // This allows direct lookup when users enter receipt ID
                const purchaseRef = doc(db, 'purchases', formData.receiptId);
                await setDoc(purchaseRef, formData);
            }
            await fetchPurchases();
            resetForm();
        } catch (error) {
            console.error('Error saving purchase:', error);
            alert('Error saving purchase. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Loads a purchase into the form for editing
     */
    const handleEdit = (purchase: Purchase) => {
        setEditingId(purchase.id);
        setFormData({
            receiptId: purchase.receiptId,
            assetName: purchase.assetName,
            price: purchase.price,
            downloadLink: purchase.downloadLink,
            purchaseDate: purchase.purchaseDate,
            buyerEmail: purchase.buyerEmail || '',
        });
        setShowForm(true);
        window.scrollTo(0, 0);
    };

    /**
     * Deletes a purchase record with confirmation
     */
    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this purchase record?')) {
            if (confirm('Users will no longer be able to access this purchase. Click OK to confirm deletion.')) {
                setLoading(true);
                try {
                    await deleteDoc(doc(db, 'purchases', id));
                    await fetchPurchases();
                } catch (error) {
                    console.error('Error deleting purchase:', error);
                    alert('Error deleting purchase');
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    /**
     * Formats ISO date string to readable format
     */
    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    /**
     * Filters purchases based on search term
     * Searches in receipt ID, asset name, and buyer email
     */
    const filteredPurchases = purchases.filter(
        (purchase) =>
            purchase.receiptId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchase.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (purchase.buyerEmail && purchase.buyerEmail.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Purchase Management
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Manage purchase records for the Bought Access page
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                    className="flex items-center gap-2 bg-[#9B5CFF] hover:bg-[#8a4ae6] text-white px-4 py-2 rounded-lg transition-colors"
                >
                    {showForm ? <X size={18} /> : <Plus size={18} />}
                    {showForm ? 'Cancel' : 'Add New Purchase'}
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-[#111] p-6 rounded-xl border border-[#222] mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
                        {editingId ? 'Edit Purchase' : 'Add New Purchase'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Receipt ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Receipt ID <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.receiptId}
                                        onChange={(e) => setFormData({ ...formData, receiptId: e.target.value })}
                                        placeholder="RCP-20260105-ABCD"
                                        className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#9B5CFF]"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, receiptId: generateReceiptId() })}
                                        className="px-4 py-2 bg-[#222] hover:bg-[#333] text-white rounded-lg transition-colors whitespace-nowrap"
                                    >
                                        Generate
                                    </button>
                                </div>
                                <p className="text-gray-500 text-xs mt-1">
                                    Users will use this ID to access their purchase
                                </p>
                            </div>

                            {/* Asset Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Asset Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.assetName}
                                    onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                                    placeholder="Premium VFX Pack Vol. 1"
                                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#9B5CFF]"
                                    required
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Price <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="$49.99"
                                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#9B5CFF]"
                                    required
                                />
                            </div>

                            {/* Buyer Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Buyer Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={formData.buyerEmail}
                                    onChange={(e) => setFormData({ ...formData, buyerEmail: e.target.value })}
                                    placeholder="customer@example.com"
                                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#9B5CFF]"
                                />
                            </div>

                            {/* Purchase Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Purchase Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.purchaseDate.slice(0, 16)}
                                    onChange={(e) =>
                                        setFormData({ ...formData, purchaseDate: new Date(e.target.value).toISOString() })
                                    }
                                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9B5CFF]"
                                    required
                                />
                            </div>

                            {/* Download Link */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Download Link <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.downloadLink}
                                    onChange={(e) => setFormData({ ...formData, downloadLink: e.target.value })}
                                    placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view"
                                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#9B5CFF]"
                                    required
                                />
                                <p className="text-gray-500 text-xs mt-1">
                                    Google Drive, Dropbox, or direct download link
                                </p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 bg-[#9B5CFF] hover:bg-[#8a4ae6] text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        {editingId ? 'Update Purchase' : 'Create Purchase'}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2 bg-[#222] hover:bg-[#333] text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search Bar */}
            <div className="bg-[#111] p-4 rounded-xl border border-[#222]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by receipt ID, asset name, or email..."
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#9B5CFF]"
                    />
                </div>
            </div>

            {/* Purchases List */}
            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                <div className="p-4 border-b border-[#222] flex items-center justify-between">
                    <h2 className="text-lg font-semibold">All Purchases ({filteredPurchases.length})</h2>
                    {loading && (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#9B5CFF]" />
                    )}
                </div>

                {filteredPurchases.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package className="mx-auto text-gray-600 mb-4" size={48} />
                        <p className="text-gray-400">
                            {searchTerm ? 'No purchases found matching your search' : 'No purchases yet'}
                        </p>
                        <p className="text-gray-600 text-sm mt-2">
                            {!searchTerm && 'Click "Add New Purchase" to create your first purchase record'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#0a0a0a] text-left text-sm text-gray-400">
                                <tr>
                                    <th className="p-4">Receipt ID</th>
                                    <th className="p-4">Asset Name</th>
                                    <th className="p-4">Price</th>
                                    <th className="p-4">Buyer Email</th>
                                    <th className="p-4">Purchase Date</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222]">
                                {filteredPurchases.map((purchase) => (
                                    <tr key={purchase.id} className="hover:bg-[#0a0a0a] transition-colors">
                                        <td className="p-4">
                                            <code className="bg-[#222] px-2 py-1 rounded text-sm font-mono text-[#9B5CFF]">
                                                {purchase.receiptId}
                                            </code>
                                        </td>
                                        <td className="p-4 font-medium">{purchase.assetName}</td>
                                        <td className="p-4">{purchase.price}</td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {purchase.buyerEmail || <span className="text-gray-600">N/A</span>}
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">{formatDate(purchase.purchaseDate)}</td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(purchase)}
                                                    className="p-2 bg-[#222] hover:bg-[#333] text-white rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => window.open(purchase.downloadLink, '_blank')}
                                                    className="p-2 bg-[#222] hover:bg-[#333] text-white rounded transition-colors"
                                                    title="Test Download Link"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(purchase.id)}
                                                    className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Help Section */}
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex gap-3">
                    <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h3 className="text-blue-300 font-semibold mb-1">How It Works</h3>
                        <ul className="text-blue-200/80 text-sm space-y-1">
                            <li>• Users access their purchases at <code className="bg-blue-900/30 px-1 rounded">#bought-access</code></li>
                            <li>• They enter their Receipt ID to view and download their purchased asset</li>
                            <li>• Make sure download links are publicly accessible (Google Drive sharing enabled, etc.)</li>
                            <li>• Receipt IDs must be unique - use the "Generate" button for automatic IDs</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchasesTab;
