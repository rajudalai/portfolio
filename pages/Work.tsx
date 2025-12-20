import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query, doc, getDoc } from 'firebase/firestore';
import { Maximize2, X } from 'lucide-react';
import { getCachedData, setCachedData, isCacheValid, getCachedSettings, setCachedSettings } from '../utils/cacheService';

const isVideo = (project: Project) => {
    const type = project.type.toLowerCase();
    const link = project.link.toLowerCase();
    const videoTypes = ['video', 'motion', 'animation', 'reel', 'film'];
    const videoExtensions = ['.mp4', '.webm', '.mov', '.ogg'];

    return videoTypes.some(t => type.includes(t)) ||
        videoExtensions.some(ext => link.endsWith(ext));
};

// Hover-to-play video component with progressive thumbnail loading
const HoverVideo: React.FC<{ src: string; className?: string; loadDelay?: number }> = ({ src, className, loadDelay = 0 }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Load thumbnail (first frame) progressively with delay
    useEffect(() => {
        const timer = setTimeout(() => {
            const video = videoRef.current;
            if (video && !thumbnailLoaded) {
                video.src = src;
                video.load();
                // Load just enough to show first frame
                video.addEventListener('loadeddata', () => {
                    setThumbnailLoaded(true);
                    video.pause();
                }, { once: true });
            }
        }, loadDelay);

        return () => clearTimeout(timer);
    }, [src, loadDelay, thumbnailLoaded]);

    const handleMouseEnter = () => {
        setIsHovered(true);
        const video = videoRef.current;
        if (video && thumbnailLoaded) {
            setIsPlaying(true);
            video.play().catch(() => { });
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setIsPlaying(false);
        const video = videoRef.current;
        if (video) {
            video.pause();
            video.currentTime = 0;
        }
    };

    return (
        <div
            className={`${className} bg-[#1a1a1a] relative cursor-pointer`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Loading placeholder */}
            {!thumbnailLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-neon/30 border-t-neon rounded-full animate-spin" />
                </div>
            )}
            <video
                ref={videoRef}
                muted
                loop
                playsInline
                preload="metadata"
                className={`w-full h-full object-cover transition-opacity duration-300 ${thumbnailLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {/* Play icon overlay when not playing */}
            {!isPlaying && thumbnailLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                        <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};

const Work: React.FC = () => {
    const [filter, setFilter] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [typeOrders, setTypeOrders] = useState<{ typeName: string; order: number; visible: boolean }[]>([]);

    // Work Page Content State
    const [content, setContent] = useState({
        header: { title: 'Selected Works', subtitle: 'A curated collection of my best video edits, designs, and motion projects.' },
        filters: { allLabel: 'All', emptyMessage: 'No projects found' },
        loading: { message: 'Loading works...' },
        modal: { toolsLabel: 'Tools Used' }
    });

    // Work page settings
    const [showCardContent, setShowCardContent] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // OPTIMIZATION 1: Check cached settings first (avoids Firebase call)
                let cacheEnabled = false;
                let cacheDurationHours = 24;
                const cachedSettings = getCachedSettings();

                if (cachedSettings) {
                    // Use cached settings (valid for 5 minutes)
                    cacheEnabled = cachedSettings.enabled;
                    cacheDurationHours = cachedSettings.durationHours;
                } else {
                    // Fetch settings from Firebase only if not cached
                    const cacheSettingsRef = doc(db, 'settings', 'cache');
                    const cacheSettingsSnap = await getDoc(cacheSettingsRef);
                    cacheEnabled = cacheSettingsSnap.exists() ? cacheSettingsSnap.data().enabled : false;
                    cacheDurationHours = cacheSettingsSnap.exists() ? (cacheSettingsSnap.data().durationHours || 24) : 24;
                    // Cache the settings locally for 5 minutes
                    setCachedSettings(cacheEnabled, cacheDurationHours);
                }

                // OPTIMIZATION 2: Check local cache BEFORE hitting Firebase
                if (cacheEnabled && isCacheValid(cacheDurationHours)) {
                    const cached = getCachedData();
                    if (cached && cached.projects.length > 0) {
                        setProjects(cached.projects);
                        setTypeOrders(cached.typeOrders);
                        if (cached.typeOrders && cached.typeOrders.length > 0) {
                            const sortedTypes = cached.typeOrders.sort((a, b) => a.order - b.order);
                            const visibleTypes = sortedTypes.filter(t => t.visible !== false);
                            const defaultType = visibleTypes.find(t => t.order === 1) || visibleTypes[0];
                            if (defaultType) {
                                setFilter(defaultType.typeName.charAt(0).toUpperCase() + defaultType.typeName.slice(1));
                            }
                        } else if (cached.projects[0].type) {
                            setFilter(cached.projects[0].type.charAt(0).toUpperCase() + cached.projects[0].type.slice(1));
                        }
                        setLoading(false);
                        console.log('Using cached data (0 Firebase calls)');
                        return; // Early return - no Firebase data calls needed!
                    }
                }

                // OPTIMIZATION 3: Fetch all collections in parallel
                const [projectsSnapshot, typeOrdersSnapshot, contentSnap, workPageSettingsSnap] = await Promise.all([
                    getDocs(query(collection(db, 'projects'), orderBy('order', 'asc'))),
                    getDocs(query(collection(db, 'typeOrder'), orderBy('order', 'asc'))),
                    getDoc(doc(db, 'settings', 'content')),
                    getDoc(doc(db, 'settings', 'workPage'))
                ]);

                // Apply work page settings
                if (workPageSettingsSnap.exists()) {
                    setShowCardContent(workPageSettingsSnap.data().showCardContent !== false);
                }

                if (contentSnap.exists()) {
                    const data = contentSnap.data();
                    // Simple merge for Work content
                    if (data.work) {
                        setContent(prev => ({
                            ...prev,
                            header: { ...prev.header, ...data.work.header },
                            filters: { ...prev.filters, ...data.work.filters },
                            loading: { ...prev.loading, ...data.work.loading },
                            modal: { ...prev.modal, ...data.work.modal }
                        }));
                    }
                }

                const projectsData: Project[] = projectsSnapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                } as Project));

                const typeOrdersData = typeOrdersSnapshot.docs.map(d => ({
                    typeName: d.data().typeName as string,
                    order: d.data().order as number,
                    visible: d.data().visible !== false // default to true if not set
                }));

                setProjects(projectsData);
                setTypeOrders(typeOrdersData);

                // Set default filter based on typeOrders (order 1) or first sorted visible type
                if (typeOrdersData.length > 0) {
                    const sortedTypes = typeOrdersData.sort((a, b) => a.order - b.order);
                    const visibleTypes = sortedTypes.filter(t => t.visible !== false);
                    const defaultType = visibleTypes.find(t => t.order === 1) || visibleTypes[0];
                    if (defaultType) {
                        setFilter(defaultType.typeName.charAt(0).toUpperCase() + defaultType.typeName.slice(1));
                    }
                } else if (projectsData.length > 0 && projectsData[0].type) {
                    setFilter(projectsData[0].type.charAt(0).toUpperCase() + projectsData[0].type.slice(1));
                }

                // Cache data if caching is enabled
                if (cacheEnabled) {
                    setCachedData({
                        projects: projectsData,
                        featuredProjects: [],
                        typeOrders: typeOrdersData
                    });
                    console.log('Data cached for', cacheDurationHours, 'hours');
                }
            } catch (error) {
                console.error("Error loading data: ", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Close modal on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedProject(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Dynamically generate unique filters from project types, capitalized and sorted by typeOrder
    // Filter out types that are marked as hidden (visible === false)
    const uniqueTypes = Array.from(new Set(projects.map(p => p.type)));
    const visibleTypes = uniqueTypes.filter(type => {
        const typeOrder = typeOrders.find(t => t.typeName.toLowerCase() === (type as string).toLowerCase());
        // Show type if no typeOrder exists (default visible) or if visible is not false
        return !typeOrder || typeOrder.visible !== false;
    });
    const sortedTypes = visibleTypes.sort((a, b) => {
        const orderA = typeOrders.find(t => t.typeName.toLowerCase() === (a as string).toLowerCase())?.order ?? 999;
        const orderB = typeOrders.find(t => t.typeName.toLowerCase() === (b as string).toLowerCase())?.order ?? 999;
        return orderA - orderB;
    });
    const filters = sortedTypes.map(t => (t as string).charAt(0).toUpperCase() + (t as string).slice(1));

    // Helper to check if a project's type is visible
    const isTypeVisible = (projectType: string) => {
        const typeOrder = typeOrders.find(t => t.typeName.toLowerCase() === projectType.toLowerCase());
        return !typeOrder || typeOrder.visible !== false;
    };

    // Filter projects: only show visible types, then apply selected filter
    const filteredWork = (!filter
        ? projects
        : projects.filter(item => item.type.toLowerCase() === filter.toLowerCase())
    ).filter(item => isTypeVisible(item.type));

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070707] pt-32 flex justify-center">
                <div className="text-white text-xl">{content.loading.message}</div>
            </div>
        );
    }

    return (
        <div className="pt-32 pb-24 min-h-screen bg-[#070707]">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{content.header.title}</h1>
                    <p className="text-gray-400 max-w-xl text-lg">{content.header.subtitle}</p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="flex flex-wrap gap-3 mb-12"
                >
                    {/* "All" Filter Button */}


                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`relative px-6 py-2 rounded-full text-sm font-medium transition-colors z-10 ${filter === f
                                ? 'text-white font-bold'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {filter === f && (
                                <motion.div
                                    layoutId="activeFilter"
                                    className="absolute inset-0 bg-neon rounded-full -z-10"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            {filter !== f && <div className="absolute inset-0 border border-white/10 rounded-full -z-10 hover:border-white/30 transition-colors" />}
                            {f}
                        </button>
                    ))}
                </motion.div>

                {/* Projects Grid */}
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    <AnimatePresence>
                        {filteredWork.length > 0 ? (
                            filteredWork.map((work, index) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                    key={work.id}
                                    whileHover={{ y: -8, boxShadow: "0 15px 30px -10px rgba(138, 99, 248, 0.1)" }}
                                    className="group bg-dark-card border border-white/5 rounded-xl overflow-hidden hover:border-neon/30 transition-colors relative"
                                    onClick={() => setSelectedProject(work)}
                                >
                                    {/* Expand Button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedProject(work); }}
                                        className="absolute top-3 right-3 z-20 p-2 bg-black/50 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/70 hover:scale-110"
                                    >
                                        <Maximize2 size={18} className="text-white" />
                                    </button>

                                    <div className={`${work.aspect || 'aspect-[16/9]'} overflow-hidden bg-[#111]`}>
                                        {isVideo(work) ? (
                                            work.autoPlay === false ? (
                                                <HoverVideo
                                                    src={work.link}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    loadDelay={index < 3 ? index * 200 : 600 + (index - 3) * 400}
                                                />
                                            ) : (
                                                <video
                                                    src={work.link}
                                                    autoPlay
                                                    muted
                                                    loop
                                                    playsInline
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                            )
                                        ) : (
                                            <img src={work.link} alt={work.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        )}
                                    </div>
                                    {showCardContent && (
                                        <div className="p-6">
                                            <div className="text-[10px] uppercase font-bold text-neon mb-2 tracking-wider">{work.type}</div>
                                            <h3 className="text-xl font-bold text-white mb-2">{work.title}</h3>
                                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{work.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {work.tools.map(tag => (
                                                    <span key={tag} className="text-[10px] px-2 py-1 bg-white/5 rounded text-gray-500">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full text-center text-gray-400 py-20">
                                {content.filters.emptyMessage}
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>


            </div >

            {/* Fullscreen Modal */}
            <AnimatePresence>
                {
                    selectedProject && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
                            onClick={() => setSelectedProject(null)}
                        >
                            {/* Glassmorphic Backdrop */}
                            <motion.div
                                initial={{ backdropFilter: 'blur(0px)' }}
                                animate={{ backdropFilter: 'blur(20px)' }}
                                exit={{ backdropFilter: 'blur(0px)' }}
                                className="absolute inset-0 bg-black/70"
                            />

                            {/* Modal Content */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative max-w-6xl w-full max-h-[90vh] bg-[#111]/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Close Button */}
                                <button
                                    onClick={() => setSelectedProject(null)}
                                    className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all hover:scale-110"
                                >
                                    <X size={24} className="text-white" />
                                </button>

                                {/* Content */}
                                <div className="flex flex-col lg:flex-row max-h-[90vh]">
                                    {/* Media Section */}
                                    <div className="flex-1 flex items-center justify-center bg-black/50 p-4 min-h-[300px] lg:min-h-0">
                                        {isVideo(selectedProject) ? (
                                            <video
                                                src={selectedProject.link}
                                                controls
                                                autoPlay
                                                loop
                                                className="max-w-full max-h-[70vh] rounded-lg object-contain"
                                            />
                                        ) : (
                                            <img
                                                src={selectedProject.link}
                                                alt={selectedProject.title}
                                                className="max-w-full max-h-[70vh] rounded-lg object-contain"
                                            />
                                        )}
                                    </div>

                                    {/* Info Section */}
                                    <div className="lg:w-80 p-6 lg:p-8 bg-[#0a0a0a]/50 backdrop-blur-sm overflow-y-auto">
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <div className="text-xs uppercase font-bold text-neon mb-3 tracking-widest">
                                                {selectedProject.type}
                                            </div>
                                            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                                                {selectedProject.title}
                                            </h2>
                                            <p className="text-gray-400 mb-6 leading-relaxed">
                                                {selectedProject.description}
                                            </p>
                                            <div className="mb-6">
                                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{content.modal.toolsLabel}</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedProject.tools.map(tag => (
                                                        <span key={tag} className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
};

export default Work;
