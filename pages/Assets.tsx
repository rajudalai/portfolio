import React, { useEffect, useState } from 'react';
import { Download, ExternalLink, ShoppingBag, Package } from 'lucide-react';
import { AssetItem } from '../types';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ASSETS: Record<string, AssetItem[]> = {
    featured: [
        { id: '1', title: 'Ultimate Thumbnail Pack', description: '20+ PSD Templates for high CTR.', type: 'premium', price: '$29', imageUrl: 'https://picsum.photos/id/101/400/300' },
        { id: '2', title: 'Motion Graphics Intro Kit', description: 'Drag & drop Premiere Pro MOGRTS.', type: 'premium', price: '$39', imageUrl: 'https://picsum.photos/id/102/400/300' },
        { id: '3', title: 'YouTube Overlay Suite', description: 'Lower thirds, subscribe buttons, and transitions.', type: 'premium', price: '$19', imageUrl: 'https://picsum.photos/id/103/400/300' },
    ],
    free: [
        { id: 'f1', title: 'Cinematic LUTs Starter', description: '5 basic LUTs for Sony & Canon log footage.', type: 'free' },
        { id: 'f2', title: 'SFX Bundle Mini', description: 'Essential whooshes and hits for editing.', type: 'free' },
        { id: 'f3', title: 'Grid Overlays', description: 'Transparent PNG grids for backgrounds.', type: 'free' },
        { id: 'f4', title: 'Social Media Icons', description: 'Vector animated icons for AE.', type: 'free' },
    ],
    premium: [
        { id: 'p1', title: 'The Creator Master Bundle', description: 'Everything I use: Presets, SFX, Graphics.', type: 'premium', price: '$99' },
        { id: 'p2', title: 'Advanced Text Animations', description: '50+ kinetic typography presets.', type: 'premium', price: '$49' },
    ]
};



const Assets: React.FC = () => {
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
        fetchContent();
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

    return (
        <div className="pt-32 pb-24 min-h-screen bg-[#070707]">
            <div className="max-w-7xl mx-auto px-6">

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
                        whileInView="show"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {ASSETS.featured.map(asset => (
                            <motion.div
                                key={asset.id}
                                variants={itemAnim}
                                whileHover={{ y: -8, boxShadow: "0 20px 40px -20px rgba(138, 99, 248, 0.1)" }}
                                className="group bg-dark-card border border-white/10 rounded-xl overflow-hidden hover:border-neon/50 transition-all shadow-lg"
                            >
                                <div className="aspect-video bg-gray-900 relative">
                                    <img src={asset.imageUrl} alt={asset.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                                        {asset.price}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-lg text-white mb-2">{asset.title}</h3>
                                    <p className="text-gray-400 text-sm mb-6">{asset.description}</p>
                                    <button className="w-full py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-gray-200 flex items-center justify-center gap-2">
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
                        {ASSETS.free.map(asset => (
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
                                <button className="text-sm text-neon hover:text-white font-medium flex items-center gap-1 transition-colors">
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
                        {ASSETS.premium.map(asset => (
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
                                    <span className="text-xl font-bold text-white">{asset.price}</span>
                                    <button className="px-6 py-2 border border-white/20 hover:bg-white hover:text-black rounded-lg text-sm font-bold transition-colors">
                                        {content.sections.viewMore}
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

            </div>
        </div>
    );
};

export default Assets;
