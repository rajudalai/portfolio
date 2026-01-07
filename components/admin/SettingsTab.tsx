
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { NavSettings } from '../../types';
import { clearDataCache, getCacheAgeHours } from '../../utils/cacheService';
import { ArrowUp, Briefcase, Database, Trash2, Mail, Layout, ToggleLeft, ToggleRight, Save, Loader2 } from 'lucide-react';

interface TypeOrder {
    id?: string;
    typeName: string;
    order: number;
    visible: boolean;
}

interface SettingsTabProps {
    allProjectTypes: string[];
}

const SettingsTab: React.FC<SettingsTabProps> = ({ allProjectTypes }) => {
    // Type ordering state
    const [typeOrders, setTypeOrders] = useState<TypeOrder[]>([]);
    const [typeOrderLoading, setTypeOrderLoading] = useState(false);

    // Work page settings
    const [showCardContent, setShowCardContent] = useState(true);

    // Cache settings state
    const [cacheEnabled, setCacheEnabled] = useState(false);
    const [cacheDurationHours, setCacheDurationHours] = useState(24);
    const [cacheAge, setCacheAge] = useState<number | null>(null);

    // Email settings state
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [emailApiUrl, setEmailApiUrl] = useState('');

    // Navigation settings state
    const [navSettings, setNavSettings] = useState<NavSettings>({
        showPricing: true,
        showAssets: true,
        showWork: true,
        showAbout: true,
        showContact: true
    });
    const [navLoading, setNavLoading] = useState(false);

    useEffect(() => {
        fetchAllSettings();
    }, []);

    const fetchAllSettings = async () => {
        await Promise.all([
            fetchTypeOrders(),
            fetchWorkSettings(),
            fetchCacheSettings(),
            fetchEmailSettings(),
            fetchNavSettings()
        ]);
    };

    // ============ TYPE ORDER FUNCTIONS ============
    const fetchTypeOrders = async () => {
        setTypeOrderLoading(true);
        try {
            const q = query(collection(db, 'typeOrder'), orderBy('order', 'asc'));
            const querySnapshot = await getDocs(q);
            const data: TypeOrder[] = querySnapshot.docs.map(doc => {
                const docData = doc.data();
                return {
                    id: doc.id,
                    typeName: docData.typeName as string,
                    order: docData.order as number,
                    visible: docData.visible !== false
                };
            });
            setTypeOrders(data);
        } catch (error) {
            console.error("Error fetching type orders: ", error);
        } finally {
            setTypeOrderLoading(false);
        }
    };

    const saveTypeOrder = async (typeName: string, order: number, visible: boolean = true, id?: string) => {
        try {
            if (id) {
                await updateDoc(doc(db, 'typeOrder', id), { order, visible });
            } else {
                await addDoc(collection(db, 'typeOrder'), { typeName, order, visible });
            }
            await fetchTypeOrders();
        } catch (error) {
            console.error("Error saving type order: ", error);
        }
    };

    const toggleTypeVisibility = async (typeName: string, currentVisible: boolean, id?: string) => {
        try {
            if (id) {
                await updateDoc(doc(db, 'typeOrder', id), { visible: !currentVisible });
            } else {
                await addDoc(collection(db, 'typeOrder'), { typeName, order: 999, visible: !currentVisible });
            }
            await fetchTypeOrders();
        } catch (error) {
            console.error("Error toggling type visibility: ", error);
        }
    };

    const deleteTypeOrder = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'typeOrder', id));
            await fetchTypeOrders();
        } catch (error) {
            console.error("Error deleting type order: ", error);
        }
    };

    // ============ WORK PAGE FUNCTIONS ============
    const fetchWorkSettings = async () => {
        try {
            const docRef = doc(db, 'settings', 'workPage');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setShowCardContent(docSnap.data().showCardContent !== false);
            }
        } catch (error) {
            console.error("Error fetching work settings: ", error);
        }
    };

    const toggleShowCardContent = async () => {
        try {
            const newValue = !showCardContent;
            const docRef = doc(db, 'settings', 'workPage');
            await setDoc(docRef, { showCardContent: newValue }, { merge: true });
            setShowCardContent(newValue);
        } catch (error) {
            console.error("Error toggling card content: ", error);
        }
    };

    // ============ CACHE FUNCTIONS ============
    const fetchCacheSettings = async () => {
        try {
            const docRef = doc(db, 'settings', 'cache');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCacheEnabled(docSnap.data().enabled || false);
                setCacheDurationHours(docSnap.data().durationHours || 24);
            }
            const age = getCacheAgeHours();
            setCacheAge(age);
        } catch (error) {
            console.error("Error fetching cache settings: ", error);
        }
    };

    const toggleCacheEnabled = async () => {
        try {
            const newValue = !cacheEnabled;
            const docRef = doc(db, 'settings', 'cache');
            await setDoc(docRef, { enabled: newValue }, { merge: true });
            setCacheEnabled(newValue);
        } catch (error) {
            console.error("Error toggling cache: ", error);
        }
    };

    const saveCacheDuration = async (hours: number) => {
        try {
            const docRef = doc(db, 'settings', 'cache');
            await setDoc(docRef, { durationHours: hours }, { merge: true });
            setCacheDurationHours(hours);
        } catch (error) {
            console.error("Error saving cache duration: ", error);
        }
    };

    const handleClearCache = () => {
        if (confirm('Clear all cached data for visitors?')) {
            clearDataCache();
            setCacheAge(null);
            alert('Local cache cleared!');
        }
    };

    // ============ EMAIL FUNCTIONS ============
    const fetchEmailSettings = async () => {
        try {
            const docRef = doc(db, 'settings', 'email');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setEmailEnabled(docSnap.data().enabled !== false);
                setEmailApiUrl(docSnap.data().apiUrl || '');
            }
        } catch (error) {
            console.error("Error fetching email settings: ", error);
        }
    };

    const toggleEmailEnabled = async () => {
        try {
            const newValue = !emailEnabled;
            const docRef = doc(db, 'settings', 'email');
            await setDoc(docRef, { enabled: newValue }, { merge: true });
            setEmailEnabled(newValue);
        } catch (error) {
            console.error("Error toggling email: ", error);
        }
    };

    const saveEmailApiUrl = async (url: string) => {
        try {
            const docRef = doc(db, 'settings', 'email');
            await setDoc(docRef, { apiUrl: url }, { merge: true });
            setEmailApiUrl(url);
        } catch (error) {
            console.error("Error saving email API URL: ", error);
        }
    };

    // ============ NAVIGATION FUNCTIONS ============
    const fetchNavSettings = async () => {
        setNavLoading(true);
        try {
            const docRef = doc(db, 'settings', 'nav');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setNavSettings(docSnap.data() as NavSettings);
            }
        } catch (error) {
            console.error("Error fetching nav settings: ", error);
        } finally {
            setNavLoading(false);
        }
    };

    const toggleNavSetting = async (key: keyof NavSettings) => {
        try {
            const newSettings = { ...navSettings, [key]: !navSettings[key] };
            const docRef = doc(db, 'settings', 'nav');
            await setDoc(docRef, newSettings, { merge: true });
            setNavSettings(newSettings);
        } catch (error) {
            console.error("Error toggling nav setting: ", error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Settings
                </h1>
            </div>

            {/* Navigation Settings Section */}
            <div className="bg-[#111] p-6 rounded-xl border border-[#222]">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Layout size={20} />
                    Navigation Visibility
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                    Toggle visibility of pages in the main navigation.
                </p>

                {navLoading ? (
                    <div className="py-4 text-center text-gray-500">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { key: 'showWork', label: 'Work Page' },
                            { key: 'showAbout', label: 'About Page' },
                            { key: 'showPricing', label: 'Pricing Page' },
                            { key: 'showAssets', label: 'Assets Page' },
                            { key: 'showContact', label: 'Contact Page' },
                        ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between bg-[#0a0a0a] p-4 rounded-lg">
                                <span className="font-medium text-gray-300">{item.label}</span>
                                <button
                                    onClick={() => toggleNavSetting(item.key as keyof NavSettings)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${navSettings[item.key as keyof NavSettings] ? 'bg-[#9B5CFF]' : 'bg-[#333]'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${navSettings[item.key as keyof NavSettings] ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Type Ordering Section */}
            <div className="bg-[#111] p-6 rounded-xl border border-[#222]">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <ArrowUp size={20} />
                    Type Display Order
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                    Set the display order of project types in the Work page. Lower numbers appear first.
                </p>

                <div className="space-y-3">
                    {allProjectTypes.map(typeName => {
                        const existing = typeOrders.find(t => t.typeName === typeName);
                        const isVisible = existing?.visible !== false;
                        return (
                            <div key={typeName} className={`flex items-center gap-4 bg-[#0a0a0a] p-3 rounded-lg ${!isVisible ? 'opacity-50' : ''}`}>
                                {/* Visibility Toggle */}
                                <button
                                    onClick={() => toggleTypeVisibility(typeName, isVisible, existing?.id)}
                                    className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${isVisible ? 'bg-[#9B5CFF]' : 'bg-[#333]'}`}
                                    title={isVisible ? 'Visible on Work page' : 'Hidden from Work page'}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isVisible ? 'translate-x-7' : 'translate-x-1'}`} />
                                </button>
                                <span className="flex-1 font-medium">{typeName}</span>
                                <input
                                    type="number"
                                    placeholder="Order"
                                    defaultValue={existing?.order || 0}
                                    className="w-20 bg-[#070707] border border-[#333] rounded p-2 text-center"
                                    onBlur={(e) => {
                                        const order = parseInt(e.target.value) || 0;
                                        saveTypeOrder(typeName, order, isVisible, existing?.id);
                                    }}
                                />
                                {existing && (
                                    <button
                                        onClick={() => deleteTypeOrder(existing.id!)}
                                        className="p-2 bg-red-900/20 text-red-500 rounded hover:bg-red-900/40"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
                {typeOrderLoading && <p className="text-gray-500 mt-2">Loading...</p>}
            </div>

            {/* Work Page Settings Section */}
            <div className="bg-[#111] p-6 rounded-xl border border-[#222]">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Briefcase size={20} />
                    Work Page Settings
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-[#0a0a0a] p-4 rounded-lg">
                        <div>
                            <span className="font-medium">Show Card Content</span>
                            <p className="text-gray-500 text-sm">Display title, description, and tools below the video/image</p>
                        </div>
                        <button
                            onClick={toggleShowCardContent}
                            className={`w-14 h-7 rounded-full transition-colors ${showCardContent ? 'bg-[#9B5CFF]' : 'bg-[#333]'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${showCardContent ? 'translate-x-8' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Cache Settings Section */}
            <div className="bg-[#111] p-6 rounded-xl border border-[#222]">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Database size={20} />
                    Cache Settings
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-[#0a0a0a] p-4 rounded-lg">
                        <div>
                            <span className="font-medium">Enable Caching</span>
                            <p className="text-gray-500 text-sm">Store files locally for faster access</p>
                        </div>
                        <button
                            onClick={toggleCacheEnabled}
                            className={`w-14 h-7 rounded-full transition-colors ${cacheEnabled ? 'bg-[#9B5CFF]' : 'bg-[#333]'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${cacheEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between bg-[#0a0a0a] p-4 rounded-lg">
                        <div>
                            <span className="font-medium">Cache Duration</span>
                            <p className="text-gray-500 text-sm">How long to keep cached data (in hours)</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={cacheDurationHours}
                                onChange={(e) => setCacheDurationHours(parseInt(e.target.value) || 24)}
                                onBlur={(e) => saveCacheDuration(parseInt(e.target.value) || 24)}
                                className="w-20 bg-[#070707] border border-[#333] rounded p-2 text-center"
                                min="1"
                            />
                            <span className="text-gray-500">hours</span>
                        </div>
                    </div>

                    <div className="bg-[#0a0a0a] p-4 rounded-lg">
                        <span className="text-gray-400">Local Cache Status:</span>
                        <div className="mt-2">
                            {cacheAge !== null ? (
                                <p className="text-sm">
                                    Cache age: <span className="font-bold text-white">{cacheAge} hours</span>
                                    {cacheAge > cacheDurationHours && (
                                        <span className="text-yellow-500 ml-2">(expired - will refresh on next visit)</span>
                                    )}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500">No cache exists yet</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleClearCache}
                            className="flex items-center gap-2 bg-red-900/20 text-red-500 px-4 py-2 rounded hover:bg-red-900/40"
                        >
                            <Trash2 size={16} />
                            Clear Local Cache
                        </button>
                    </div>
                </div>
            </div>

            {/* Email Settings Section */}
            <div className="bg-[#111] p-6 rounded-xl border border-[#222]">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Mail size={20} />
                    Email Settings
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-[#0a0a0a] p-4 rounded-lg">
                        <div>
                            <span className="font-medium">Enable Email Notifications</span>
                            <p className="text-gray-500 text-sm">Send emails when contact form is submitted</p>
                        </div>
                        <button
                            onClick={toggleEmailEnabled}
                            className={`w-14 h-7 rounded-full transition-colors ${emailEnabled ? 'bg-[#9B5CFF]' : 'bg-[#333]'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${emailEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="bg-[#0a0a0a] p-4 rounded-lg">
                        <div className="mb-2">
                            <span className="font-medium">API Endpoint URL</span>
                            <p className="text-gray-500 text-sm">Leave blank to use default backend</p>
                        </div>
                        <input
                            type="url"
                            value={emailApiUrl}
                            onChange={(e) => setEmailApiUrl(e.target.value)}
                            onBlur={(e) => saveEmailApiUrl(e.target.value)}
                            placeholder="https://your-backend.com/api/contact"
                            className="w-full bg-[#070707] border border-[#333] rounded p-2 text-sm"
                        />
                    </div>

                    <div className="bg-[#0a0a0a] p-4 rounded-lg">
                        <span className="text-gray-400">Current Status:</span>
                        <div className="mt-2 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${emailEnabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className={`text-sm ${emailEnabled ? 'text-green-400' : 'text-red-400'}`}>
                                {emailEnabled ? 'Emails are enabled' : 'Emails are disabled'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsTab;
