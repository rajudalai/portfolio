import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Project, FeaturedProject, Asset } from '../types';
import { Trash2, Plus, Edit2, Loader2, Save, X, LogOut, Briefcase, Star, Menu, Upload, FileSpreadsheet, AlertTriangle, Settings, Database, ArrowUp, ArrowDown, FileText, ChevronDown, ChevronRight, Mail, Eye, EyeOff, Package, MessageSquare, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { clearDataCache, getCacheAgeHours } from '../utils/cacheService';

import SettingsTab from '../components/admin/SettingsTab';
import PurchasesTab from '../components/admin/PurchasesTab';

type AdminTab = 'projects' | 'featured' | 'settings' | 'content' | 'messages' | 'assets' | 'purchases';

const Admin: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // Sidebar state
    const [activeTab, setActiveTab] = useState<AdminTab>('projects');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Projects state
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Featured Projects state
    const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
    const [featuredLoading, setFeaturedLoading] = useState(false);
    const [featuredEditingId, setFeaturedEditingId] = useState<string | null>(null);

    // Form State for Projects
    const [formData, setFormData] = useState<Omit<Project, 'id'>>({
        type: 'video',
        link: '',
        title: '',
        description: '',
        tools: [],
        order: 0,
        aspect: 'aspect-[16/9]',
        autoPlay: true
    });
    const [toolsInput, setToolsInput] = useState('');
    const [customTypeMode, setCustomTypeMode] = useState(false);
    const [customTypeInput, setCustomTypeInput] = useState('');

    // Form State for Featured Projects
    const [featuredFormData, setFeaturedFormData] = useState<Omit<FeaturedProject, 'id'>>({
        type: 'video',
        src: '',
        category: '',
        title: '',
        aspect: 'aspect-[16/9]',
        order: 0
    });
    const [featuredCustomTypeMode, setFeaturedCustomTypeMode] = useState(false);
    const [featuredCustomTypeInput, setFeaturedCustomTypeInput] = useState('');

    // Compute unique types from existing projects
    const existingProjectTypes = [...new Set(projects.map(p => p.type).filter(Boolean))] as string[];
    const defaultProjectTypes = ['video', 'image', 'thumbnail'];
    const allProjectTypes = [...new Set([...defaultProjectTypes, ...existingProjectTypes])] as string[];

    const existingFeaturedTypes = [...new Set(featuredProjects.map(p => p.type).filter(Boolean))] as string[];
    const defaultFeaturedTypes = ['video', 'image'];
    const allFeaturedTypes = [...new Set([...defaultFeaturedTypes, ...existingFeaturedTypes])] as string[];

    // Filter state for existing projects list
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

    // State moved to SettingsTab component


    // Contact submissions state
    interface ContactSubmission {
        id: string;
        name: string;
        email: string;
        channel?: string;
        vision?: string;
        selectedServices: string[];
        message: string;
        submittedAt: Timestamp;
        apiResponse: { success: boolean; message?: string; error?: string };
        status: 'sent' | 'failed' | 'skipped' | 'pending';
    }
    const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [submissionsError, setSubmissionsError] = useState<string | null>(null);
    const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

    // Assets state
    const [assets, setAssets] = useState<Asset[]>([]);
    const [assetsLoading, setAssetsLoading] = useState(false);
    const [assetEditingId, setAssetEditingId] = useState<string | null>(null);
    const [assetFormData, setAssetFormData] = useState<Omit<Asset, 'id'>>({
        title: '',
        description: '',
        category: 'free',
        type: '',
        price: '',
        imageUrl: '',
        downloadLink: '',
        order: 0
    });
    const [assetsError, setAssetsError] = useState<string | null>(null);

    // Content state - Hierarchical structure
    interface SiteContent {
        home: {
            hero: {
                badge: string;
                title: string;
                subtitle: string;
                image: string;
                buttonPrimary: string;
                buttonSecondary: string;
                card1: { label: string; value: string; };
                card2: { label: string; value: string; };
            };
            stats: {
                stat1Value: string;
                stat1Label: string;
                stat2Value: string;
                stat2Label: string;
                stat3Value: string;
                stat3Label: string;
            };
            about: {
                title: string;
                subtitle: string;
                paragraph1: string;
                paragraph2: string;
                skills: string;
                image: string;
                yearsExperience: string;
            };
            portfolio: {
                tag: string;
                heading: string;
                impactTitle: string;
                impactDesc: string;
                buttonText: string;
                timeline: {
                    item1Title: string; item1Desc: string;
                    item2Title: string; item2Desc: string;
                    item3Title: string; item3Desc: string;
                };
            };
            testimonials: {
                title: string;
                subtitle: string;
                items: Array<{
                    id: string;
                    name: string;
                    role: string;
                    quote: string;
                    image: string;
                }>;
            };
            brands: {
                heading: string;
                items: Array<{
                    name: string;
                    imageUrl?: string;
                    fontClass?: string;
                }>;
            };
            workflow: {
                title: string;
                subtitle: string;
                items: Array<{
                    id: string;
                    name: string;
                    image: string;
                }>;
            };
        };
        work: {
            header: {
                title: string;
                subtitle: string;
            };
            filters: {
                allLabel: string;
                emptyMessage: string;
            };
            loading: {
                message: string;
            };
            modal: {
                toolsLabel: string;
            };
        };
        contact: {
            header: {
                title: string;
                subtitle: string;
            };
            form: {
                nameLabel: string;
                namePlaceholder: string;
                emailLabel: string;
                emailPlaceholder: string;
                channelLabel: string;
                channelPlaceholder: string;
                visionLabel: string;
                visionOptions: string;
                servicesLabel: string;
                services: string;
                messageLabel: string;
                messagePlaceholder: string;
                submitButton: string;
                responseTime: string;
            };
            success: {
                title: string;
                message: string;
                backButton: string;
            };
        };
        pricing: {
            badge: string;
            title: string;
            subtitle: string;
            footer: string;
            card1: {
                name: string;
                description: string;
                price: string;
                period: string;
                features: string;
                button: string;
            };
            card2: {
                badge: string;
                name: string;
                description: string;
                price: string;
                period: string;
                features: string;
                button: string;
            };
            card3: {
                name: string;
                description: string;
                price: string;
                period: string;
                features: string;
                button: string;
            };
        };
        assets: {
            header: {
                title: string;
                subtitle: string;
            };
            sections: {
                featuredTitle: string;
                freeTitle: string;
                premiumTitle: string;
                viewMore: string;
            };
            badge: string;
            buttons: {
                buyNow: string;
                download: string;
            };
            freeBadge: string;
            toolsTitle: string;
        };
        footer: {
            copyright: string;
            links: Array<{
                id: string;
                label: string;
                url: string;
            }>;
            socials: Array<{
                id: string;
                platform: string;
                url: string;
            }>;
        };
    }
    const defaultContent: SiteContent = {
        home: {
            hero: {
                badge: 'Graphic Design · Video Editing · Motion Graphics',
                title: 'Transforming Brands With Visual Storytelling',
                subtitle: 'Strategic visual content crafted for brands and creators to attract audiences, build trust, and grow with a strong and consistent visual identity.',
                image: 'https://github.com/ayushkanha/task3/blob/main/portfolio%20image%202.png?raw=true',
                buttonPrimary: 'My Work',
                buttonSecondary: "Let's Talk",
                card1: { label: 'Retention Rate', value: '+45% Boost' },
                card2: { label: 'Total Views', value: '2.5M+' }
            },
            stats: {
                stat1Value: '150+', stat1Label: 'Completed Projects',
                stat2Value: '50+', stat2Label: 'Happy Clients',
                stat3Value: '4+ Yrs', stat3Label: 'Experience'
            },
            about: {
                title: 'About Me',
                subtitle: 'Video Editor | Graphic Designer | Motion Artist',
                paragraph1: "I don't just edit videos or design graphics; I engineer visual experiences. In a world saturated with content, clarity is the only currency that matters.",
                paragraph2: "For over four years, I've partnered with ambitious creators and brands to translate their raw ideas into polished, high-performing assets.",
                skills: 'Video Editing,Graphic Design,Motion Graphics,YouTube Content,Reels & Shorts,Visual Branding,Color Grading,After Effects,Premiere Pro,Photoshop',
                image: 'https://github.com/ayushkanha/task3/blob/main/my%20photo.png?raw=true',
                yearsExperience: '4+'
            },
            portfolio: {
                tag: 'Portfolio showcase',
                heading: 'Projects that define categories and drive growth.',
                impactTitle: 'Impactful results',
                impactDesc: 'From startup MVPs to enterprise transformations, our projects consistently deliver measurable outcomes and user engagement that drives business growth.',
                buttonText: 'Explore features',
                timeline: {
                    item1Title: 'Brand Identity', item1Desc: 'Strategic visual systems that stand out.',
                    item2Title: 'Product Design', item2Desc: 'User-centric interfaces for modern apps.',
                    item3Title: 'Web Development', item3Desc: 'High-performance implementations.'
                }
            },
            testimonials: {
                title: 'Trusted By Leading Teams',
                subtitle: "At Nexus Design, we're committed to delivering powerful tools that help product teams ship faster and build better. Here's what our community has to say.",
                items: [
                    {
                        id: '1',
                        name: 'Sarah Chen',
                        role: 'Lead Designer @ TechFlow',
                        quote: "Nexus Design has transformed how our team approaches UI development. The components are beautifully crafted and incredibly flexible. We've cut our design-to-production time by 60%.",
                        image: 'https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/8e170226-595e-423d-bef3-9845ff2a7a36_3840w.jpg'
                    },
                    {
                        id: '2',
                        name: 'Marcus Rodriguez',
                        role: 'CTO @ StartupLabs',
                        quote: "The attention to detail is remarkable. From accessibility features to performance optimization, every component feels production-ready. This is what modern design systems should be.",
                        image: 'https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/d3da1789-0f7a-4fbc-b7b6-606f9b85b083_3840w.jpg'
                    },
                    {
                        id: '3',
                        name: 'Emily Foster',
                        role: 'Product Manager @ CloudScale',
                        quote: "Our team loves the consistency and polish. Documentation is clear, support is responsive, and the templates give us a massive head start on every project.",
                        image: 'https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/68d0e141-c428-45cd-819a-d7123081d736_3840w.jpg'
                    },
                    {
                        id: '4',
                        name: 'David Kim',
                        role: 'Senior Engineer @ DataViz',
                        quote: "TypeScript support is excellent, the component API is intuitive, and the bundle size is impressively small. This has become our go-to library for all new projects.",
                        image: 'https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/986db8ed-1c5d-42fb-8c1d-4b3716d2e317_320w.jpg'
                    }
                ]
            },
            brands: {
                heading: 'Trusted by teams at',
                items: [
                    { name: 'TechFlow', fontClass: '' },
                    { name: 'Nexus Labs', fontClass: 'font-bricolage' },
                    { name: 'DataSync', fontClass: 'font-merriweather' },
                    { name: 'VisionCorp', fontClass: 'font-instrument-serif' },
                    { name: 'CloudBase', fontClass: 'font-playfair' },
                    { name: 'InnovateTech', fontClass: '' },
                    { name: 'FlowState', fontClass: '' }
                ]
            },
            workflow: {
                title: 'My Creative Workflow & Tools',
                subtitle: 'The professional tools I use to craft high-quality videos, designs, and motion graphics.',
                items: [
                    { id: '1', name: 'After Effects', image: 'https://cdn.iconscout.com/icon/free/png-256/free-adobe-after-effects-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-1-pack-logos-icons-2945233.png?f=webp&w=256' },
                    { id: '2', name: 'Illustrator', image: 'https://cdn.iconscout.com/icon/free/png-256/free-adobe-illustrator-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-1-pack-logos-icons-2945234.png?f=webp&w=256' },
                    { id: '3', name: 'Photoshop', image: 'https://cdn.iconscout.com/icon/free/png-256/free-adobe-photoshop-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-1-pack-logos-icons-2945235.png?f=webp&w=256' },
                    { id: '4', name: 'Premiere Pro', image: 'https://cdn.iconscout.com/icon/free/png-256/free-adobe-premiere-pro-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-1-pack-logos-icons-2945236.png?f=webp&w=256' }
                ]
            }
        },
        work: {
            header: {
                title: 'My Work',
                subtitle: 'Browse through my portfolio of projects'
            },
            filters: {
                allLabel: 'All',
                emptyMessage: 'No projects found'
            },
            loading: {
                message: 'Loading works...'
            },
            modal: {
                toolsLabel: 'Tools Used'
            }
        },
        contact: {
            header: {
                title: 'Work With Me',
                subtitle: 'Share a few details about your project, and I\'ll get back to you with ideas, options, and next steps.'
            },
            form: {
                nameLabel: 'Name',
                namePlaceholder: 'What should I call you?',
                emailLabel: 'Email',
                emailPlaceholder: 'your@email.com',
                channelLabel: 'Channel / Profile Link',
                channelPlaceholder: 'Paste your channel or profile link',
                visionLabel: 'What\'s your vision for this project?',
                visionOptions: 'Just getting started,Growing consistently,Scaling aggressively,Not sure yet',
                servicesLabel: 'What type of services do you need?',
                services: 'Video editing for YouTube,Reels & short-form content,Thumbnails & graphic design,Motion graphics / intro animation,Full content package,Something else',
                messageLabel: 'Anything else I should know?',
                messagePlaceholder: 'Tell me about your content, goals, timeline, and what success looks like for you.',
                submitButton: 'Send Message',
                responseTime: 'I usually respond within 24–48 hours. No spam, no pressure.'
            },
            success: {
                title: 'Message Sent!',
                message: 'Thanks! I\'ve received your message and will get back to you soon.',
                backButton: 'Send another message'
            }
        },
        pricing: {
            badge: 'Pricing',
            title: 'Flexible Packages for Serious Creators',
            subtitle: 'Whether you need a single impactful edit or a long-term content partner, I have a structure that scales with you.',
            footer: 'Need something custom? Reach out through the contact form and we\'ll tailor a package for you.',
            card1: {
                name: 'Starter',
                description: 'Perfect for getting started with quality.',
                price: '₹40,000',
                period: '/mo',
                features: '4 YouTube Shorts / Reels,1 Long-form Video,Basic Color Grading,2 Revision Rounds',
                button: 'Get Started'
            },
            card2: {
                badge: 'Most Popular',
                name: 'Growth',
                description: 'Consistent content to build your audience.',
                price: '₹1,00,000',
                period: '/mo',
                features: '8 YouTube Shorts / Reels,2 Long-form Videos,Advanced Motion Graphics,Custom Thumbnails included,Strategy Call',
                button: 'Choose Growth'
            },
            card3: {
                name: 'Full Partner',
                description: 'For aggressive scaling and brand building.',
                price: '₹2,00,000',
                period: '/mo',
                features: '12 YouTube Shorts / Reels,4 Long-form Videos,Full Channel Branding,Priority Support,Unlimited Revisions',
                button: 'Let\'s Talk'
            }
        },
        assets: {
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
        },
        footer: {
            copyright: '© 2025 Raju. All rights reserved.',
            links: [
                { id: '1', label: 'Impressum', url: '#' },
                { id: '2', label: 'Datenschutz', url: '#' }
            ],
            socials: [
                { id: '1', platform: 'instagram', url: '#' },
                { id: '2', platform: 'youtube', url: '#' },
                { id: '3', platform: 'linkedin', url: '#' },
                { id: '4', platform: 'tiktok', url: '#' },
                { id: '5', platform: 'twitter', url: '#' }
            ]
        }
    };
    const [content, setContent] = useState<SiteContent>(defaultContent);
    const [contentLoading, setContentLoading] = useState(false);
    const [contentSaving, setContentSaving] = useState(false);
    const [selectedPage, setSelectedPage] = useState<'home' | 'work' | 'contact' | 'assets' | 'pricing' | 'footer'>('home');
    const [expandedSections, setExpandedSections] = useState<string[]>(['hero']);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchProjects();
                fetchFeaturedProjects();
                // Settings are handled in SettingsTab component
                fetchContent();
                fetchContactSubmissions();
                fetchAssets();
            } else {
                setProjects([]);
                setFeaturedProjects([]);
                setContactSubmissions([]);
                setAssets([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // ============ PROJECTS FUNCTIONS ============
    const fetchProjects = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'projects'), orderBy('order', 'asc'));
            const querySnapshot = await getDocs(q);
            const data: Project[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Project));
            setProjects(data);
        } catch (error) {
            console.error("Error fetching projects: ", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            type: 'video',
            link: '',
            title: '',
            description: '',
            tools: [],
            order: 0,
            aspect: 'aspect-[16/9]',
            autoPlay: true
        });
        setToolsInput('');
        setEditingId(null);
        setCustomTypeMode(false);
        setCustomTypeInput('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const toolsArray = toolsInput.split(',').map(t => t.trim()).filter(t => t);

        const projectData = {
            ...formData,
            tools: toolsArray
        };

        try {
            if (editingId) {
                const projectRef = doc(db, 'projects', editingId);
                await updateDoc(projectRef, projectData);
            } else {
                await addDoc(collection(db, 'projects'), projectData);
            }
            await fetchProjects();
            resetForm();
        } catch (error) {
            console.error("Error saving project: ", error);
            alert("Error saving project");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (project: Project) => {
        setEditingId(project.id);
        setFormData({
            type: project.type,
            link: project.link,
            title: project.title,
            description: project.description,
            tools: project.tools,
            order: project.order,
            aspect: project.aspect || 'aspect-[16/9]',
            autoPlay: project.autoPlay !== false // Default to true if undefined
        });
        setToolsInput(project.tools.join(', '));
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this project?')) {
            if (confirm('This action cannot be undone. Click OK again to confirm deletion.')) {
                setLoading(true);
                try {
                    await deleteDoc(doc(db, 'projects', id));
                    await fetchProjects();
                } catch (error) {
                    console.error("Error deleting project: ", error);
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    // ============ FEATURED PROJECTS FUNCTIONS ============
    const fetchFeaturedProjects = async () => {
        setFeaturedLoading(true);
        try {
            const q = query(collection(db, 'featuredProjects'), orderBy('order', 'asc'));
            const querySnapshot = await getDocs(q);
            const data: FeaturedProject[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as FeaturedProject));
            setFeaturedProjects(data);
        } catch (error) {
            console.error("Error fetching featured projects: ", error);
        } finally {
            setFeaturedLoading(false);
        }
    };

    const resetFeaturedForm = () => {
        setFeaturedFormData({
            type: 'video',
            src: '',
            category: '',
            title: '',
            aspect: 'aspect-[16/9]',
            order: 0
        });
        setFeaturedEditingId(null);
        setFeaturedCustomTypeMode(false);
        setFeaturedCustomTypeInput('');
    };

    const handleFeaturedSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeaturedLoading(true);

        try {
            if (featuredEditingId) {
                const projectRef = doc(db, 'featuredProjects', featuredEditingId);
                await updateDoc(projectRef, featuredFormData);
            } else {
                await addDoc(collection(db, 'featuredProjects'), featuredFormData);
            }
            await fetchFeaturedProjects();
            resetFeaturedForm();
        } catch (error) {
            console.error("Error saving featured project: ", error);
            alert("Error saving featured project");
        } finally {
            setFeaturedLoading(false);
        }
    };

    const handleFeaturedEdit = (project: FeaturedProject) => {
        setFeaturedEditingId(project.id);
        setFeaturedFormData({
            type: project.type,
            src: project.src,
            category: project.category,
            title: project.title,
            aspect: project.aspect,
            order: project.order
        });
        window.scrollTo(0, 0);
    };

    const handleFeaturedDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this featured project?')) {
            if (confirm('This action cannot be undone. Click OK again to confirm deletion.')) {
                setFeaturedLoading(true);
                try {
                    await deleteDoc(doc(db, 'featuredProjects', id));
                    await fetchFeaturedProjects();
                } catch (error) {
                    console.error("Error deleting featured project: ", error);
                } finally {
                    setFeaturedLoading(false);
                }
            }
        }
    };

    // Function to download sample Excel template
    const downloadSampleExcel = () => {
        const sampleData = [
            { Title: 'Sample Project 1', Link: 'https://example.com/video.mp4', Type: 'video', Description: 'A sample video project', Tools: 'Premiere Pro, After Effects', Order: 1, Aspect: 'aspect-[16/9]', AutoPlay: 'TRUE' },
            { Title: 'Sample Project 2', Link: 'https://example.com/image.jpg', Type: 'image', Description: 'A sample image project', Tools: 'Photoshop, Illustrator', Order: 2, Aspect: 'aspect-[4/3]', AutoPlay: 'TRUE' },
            { Title: 'Sample Project 3', Link: 'https://example.com/motion.mp4', Type: 'Motion Graphics', Description: 'Hover to play video', Tools: 'After Effects', Order: 3, Aspect: 'aspect-[16/9]', AutoPlay: 'FALSE' }
        ];
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
        XLSX.writeFile(workbook, 'sample_projects_template.xlsx');
    };

    // Function to download all projects as Excel
    const downloadAllProjectsExcel = () => {
        if (projects.length === 0) {
            alert('No projects to export!');
            return;
        }
        const exportData = projects.map(p => ({
            Title: p.title,
            Link: p.link,
            Type: p.type,
            Description: p.description,
            Tools: p.tools.join(', '),
            Order: p.order,
            Aspect: p.aspect || 'aspect-[16/9]',
            AutoPlay: p.autoPlay !== false ? 'TRUE' : 'FALSE'
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
        XLSX.writeFile(workbook, 'all_projects_export.xlsx');
    };

    // Settings handlers moved to SettingsTab component


    // ============ CONTACT SUBMISSIONS FUNCTIONS ============
    const fetchContactSubmissions = async () => {
        setSubmissionsLoading(true);
        setSubmissionsError(null);
        try {
            const q = query(collection(db, 'contactSubmissions'), orderBy('submittedAt', 'desc'));
            let querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log("No ordered submissions found, trying unordered fetch...");
                const fallbackQ = collection(db, 'contactSubmissions');
                querySnapshot = await getDocs(fallbackQ);
            }

            const data: ContactSubmission[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ContactSubmission));

            // Sort in memory if we fell back
            if (data.length > 0 && !data[0].submittedAt) { // heuristic check
                // timestamps might be strings or objects, complex to sort without proper types, 
                // but basic array reverse might mimic desc order if inserted sequentially
                data.reverse();
            }

            setContactSubmissions(data);
        } catch (error: any) {
            console.error("Error fetching contact submissions: ", error);
            setSubmissionsError(error.message);
        } finally {
            setSubmissionsLoading(false);
        }
    };

    const deleteContactSubmission = async (id: string) => {
        if (confirm('Are you sure you want to delete this submission?')) {
            try {
                await deleteDoc(doc(db, 'contactSubmissions', id));
                await fetchContactSubmissions();
            } catch (error) {
                console.error("Error deleting submission: ", error);
            }
        }
    };

    // ============ ASSETS FUNCTIONS ============
    const fetchAssets = async () => {
        setAssetsLoading(true);
        setAssetsError(null);
        try {
            console.log("Fetching assets...");
            const q = query(collection(db, 'assets'), orderBy('order', 'asc'));
            let querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log("No ordered assets found, trying unordered fetch...");
                const fallbackQ = collection(db, 'assets');
                querySnapshot = await getDocs(fallbackQ);
            }

            console.log(`Found ${querySnapshot.size} assets`);
            const data: Asset[] = querySnapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    title: d.title || '',
                    description: d.description || '',
                    category: d.category || 'free',
                    type: d.type || '',
                    price: d.price || '',
                    imageUrl: d.imageUrl || '',
                    downloadLink: d.downloadLink || '',
                    order: d.order || 0
                } as Asset;
            });
            // If we fell back to unordered, sort them in memory
            if (data.length > 0 && data[0].order === 0) {
                data.sort((a, b) => (a.order || 0) - (b.order || 0));
            }
            setAssets(data);
        } catch (error: any) {
            console.error("Error fetching assets: ", error);
            setAssetsError(error.message);
        } finally {
            setAssetsLoading(false);
        }
    };

    const resetAssetForm = () => {
        setAssetFormData({
            title: '',
            description: '',
            category: 'free',
            type: '',
            price: '',
            imageUrl: '',
            downloadLink: '',
            order: 0
        });
        setAssetEditingId(null);
    };

    const handleAssetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAssetsLoading(true);

        try {
            if (assetEditingId) {
                const assetRef = doc(db, 'assets', assetEditingId);
                await updateDoc(assetRef, assetFormData);
            } else {
                await addDoc(collection(db, 'assets'), assetFormData);
            }
            await fetchAssets();
            resetAssetForm();
        } catch (error) {
            console.error("Error saving asset: ", error);
            alert("Error saving asset");
        } finally {
            setAssetsLoading(false);
        }
    };

    const handleAssetEdit = (asset: Asset) => {
        setAssetEditingId(asset.id);
        setAssetFormData({
            title: asset.title,
            description: asset.description,
            category: asset.category,
            type: asset.type || '',
            price: asset.price || '',
            imageUrl: asset.imageUrl || '',
            downloadLink: asset.downloadLink || '',
            order: asset.order
        });
        window.scrollTo(0, 0);
    };

    const handleAssetDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this asset?')) {
            if (confirm('This action cannot be undone. Click OK again to confirm deletion.')) {
                setAssetsLoading(true);
                try {
                    await deleteDoc(doc(db, 'assets', id));
                    await fetchAssets();
                } catch (error) {
                    console.error("Error deleting asset: ", error);
                } finally {
                    setAssetsLoading(false);
                }
            }
        }
    };

    const downloadAssetsSampleExcel = () => {
        const sampleData = [
            { Title: 'Cinematic LUTs Starter', Description: '5 basic LUTs for Sony & Canon log footage.', Category: 'free', Type: 'LUTs', Price: '', ImageUrl: '', DownloadLink: 'https://example.com/luts.zip', Order: 1 },
            { Title: 'Ultimate Thumbnail Pack', Description: '20+ PSD Templates for high CTR.', Category: 'featured', Type: 'Templates', Price: '₹2,499', ImageUrl: 'https://example.com/thumbnail.jpg', DownloadLink: 'https://example.com/buy/thumbnails', Order: 1 },
            { Title: 'The Creator Master Bundle', Description: 'Everything I use: Presets, SFX, Graphics.', Category: 'premium', Type: 'Bundle', Price: '₹8,499', ImageUrl: '', DownloadLink: 'https://example.com/buy/bundle', Order: 1 }
        ];
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');
        XLSX.writeFile(workbook, 'sample_assets_template.xlsx');
    };

    const downloadAllAssetsExcel = () => {
        if (assets.length === 0) {
            alert('No assets to export!');
            return;
        }
        const exportData = assets.map(a => ({
            Title: a.title,
            Description: a.description,
            Category: a.category,
            Type: a.type || '',
            Price: a.price || '',
            ImageUrl: a.imageUrl || '',
            DownloadLink: a.downloadLink || '',
            Order: a.order
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');
        XLSX.writeFile(workbook, 'all_assets_export.xlsx');
    };

    const handleAssetExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                if (jsonData.length === 0) {
                    alert('No data found in Excel file');
                    return;
                }

                const requiredFields = ['Title', 'Description', 'Category'];
                const hasRequiredFields = requiredFields.every(field =>
                    jsonData[0].hasOwnProperty(field)
                );

                if (!hasRequiredFields) {
                    alert(`Excel file must contain these columns: ${requiredFields.join(', ')}, Type, Price, ImageUrl, DownloadLink, Order`);
                    return;
                }

                if (confirm(`Found ${jsonData.length} assets. Import all?`)) {
                    setAssetsLoading(true);
                    const batch = writeBatch(db);

                    jsonData.forEach((row) => {
                        const assetRef = doc(collection(db, 'assets'));
                        const assetData: Omit<Asset, 'id'> = {
                            title: String(row.Title || ''),
                            description: String(row.Description || ''),
                            category: (row.Category as 'free' | 'featured' | 'premium') || 'free',
                            type: String(row.Type || ''),
                            price: String(row.Price || ''),
                            imageUrl: String(row.ImageUrl || ''),
                            downloadLink: String(row.DownloadLink || ''),
                            order: Number(row.Order) || 0
                        };
                        batch.set(assetRef, assetData);
                    });

                    await batch.commit();
                    await fetchAssets();
                    alert(`Successfully imported ${jsonData.length} assets!`);
                } else {
                    alert('Import cancelled');
                }
            } catch (error) {
                console.error("Error importing Excel: ", error);
                alert("Error importing Excel file");
            } finally {
                setAssetsLoading(false);
                e.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // ============ CONTENT FUNCTIONS ============
    const fetchContent = async () => {
        setContentLoading(true);
        try {
            const docRef = doc(db, 'settings', 'content');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setContent({
                    home: {
                        ...defaultContent.home, ...data.home,
                        hero: { ...defaultContent.home.hero, ...data.home?.hero },
                        stats: { ...defaultContent.home.stats, ...data.home?.stats },
                        about: { ...defaultContent.home.about, ...data.home?.about },
                        portfolio: { ...defaultContent.home.portfolio, ...data.home?.portfolio, timeline: { ...defaultContent.home.portfolio.timeline, ...data.home?.portfolio?.timeline } },
                        testimonials: { ...defaultContent.home.testimonials, ...data.home?.testimonials, items: data.home?.testimonials?.items || defaultContent.home.testimonials.items },
                        brands: { ...defaultContent.home.brands, ...data.home?.brands, items: data.home?.brands?.items || defaultContent.home.brands.items },
                        workflow: { ...defaultContent.home.workflow, ...data.home?.workflow, items: data.home?.workflow?.items || defaultContent.home.workflow.items }
                    },
                    work: { ...defaultContent.work, ...data.work, header: { ...defaultContent.work.header, ...data.work?.header }, filters: { ...defaultContent.work.filters, ...data.work?.filters }, loading: { ...defaultContent.work.loading, ...data.work?.loading }, modal: { ...defaultContent.work.modal, ...data.work?.modal } },
                    contact: { ...defaultContent.contact, ...data.contact, header: { ...defaultContent.contact.header, ...data.contact?.header }, form: { ...defaultContent.contact.form, ...data.contact?.form }, success: { ...defaultContent.contact.success, ...data.contact?.success } },
                    pricing: { ...defaultContent.pricing, ...data.pricing, card1: { ...defaultContent.pricing.card1, ...data.pricing?.card1 }, card2: { ...defaultContent.pricing.card2, ...data.pricing?.card2 }, card3: { ...defaultContent.pricing.card3, ...data.pricing?.card3 } },
                    assets: { ...defaultContent.assets, ...data.assets, header: { ...defaultContent.assets.header, ...data.assets?.header }, sections: { ...defaultContent.assets.sections, ...data.assets?.sections }, buttons: { ...defaultContent.assets.buttons, ...data.assets?.buttons } },
                    footer: { ...defaultContent.footer, ...data.footer, links: data.footer?.links || defaultContent.footer.links, socials: data.footer?.socials || defaultContent.footer.socials }
                } as SiteContent);
            }
        } catch (error) {
            console.error("Error fetching content: ", error);
        } finally {
            setContentLoading(false);
        }
    };

    const saveContent = async () => {
        setContentSaving(true);
        try {
            const docRef = doc(db, 'settings', 'content');
            await setDoc(docRef, content);
            alert('Content saved successfully!');
        } catch (error) {
            console.error("Error saving content: ", error);
            alert('Error saving content');
        } finally {
            setContentSaving(false);
        }
    };

    // ============ AUTH FUNCTIONS ============
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            alert('Login Failed: ' + error.message);
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    // ============ RENDER: LOGIN ============
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#070707] text-white">
                <form onSubmit={handleLogin} className="p-8 bg-[#111] rounded-lg border border-[#222] w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-6 text-center">Admin Access</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 bg-[#070707] border border-[#333] rounded text-white focus:outline-none focus:border-[#9B5CFF]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 bg-[#070707] border border-[#333] rounded text-white focus:outline-none focus:border-[#9B5CFF]"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loginLoading}
                            className="w-full bg-[#9B5CFF] text-white p-2 rounded hover:bg-[#8A4BEF] disabled:opacity-50 flex justify-center"
                        >
                            {loginLoading ? <Loader2 className="animate-spin" /> : 'Login'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // ============ RENDER: MAIN ADMIN ============
    return (
        <div className="min-h-screen bg-[#070707] text-white flex">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-[#0a0a0a] border-r border-[#222] h-screen sticky top-0 transition-all duration-300 flex flex-col`}>
                {/* Sidebar Header */}
                <div className="p-4 border-b border-[#222] flex items-center justify-between">
                    {sidebarOpen && <h1 className="text-lg font-bold text-white">Admin Panel</h1>}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-[#222] rounded transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'projects'
                            ? 'bg-[#9B5CFF] text-white'
                            : 'text-gray-400 hover:bg-[#222] hover:text-white'
                            }`}
                    >
                        <Briefcase size={20} />
                        {sidebarOpen && <span>Projects</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('featured')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'featured'
                            ? 'bg-[#9B5CFF] text-white'
                            : 'text-gray-400 hover:bg-[#222] hover:text-white'
                            }`}
                    >
                        <Star size={20} />
                        {sidebarOpen && <span>Featured Projects</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'settings'
                            ? 'bg-[#9B5CFF] text-white'
                            : 'text-gray-400 hover:bg-[#222] hover:text-white'
                            }`}
                    >
                        <Settings size={20} />
                        {sidebarOpen && <span>Settings</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'content'
                            ? 'bg-[#9B5CFF] text-white'
                            : 'text-gray-400 hover:bg-[#222] hover:text-white'
                            }`}
                    >
                        <FileText size={20} />
                        {sidebarOpen && <span>Content</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('assets')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'assets'
                            ? 'bg-[#9B5CFF] text-white'
                            : 'text-gray-400 hover:bg-[#222] hover:text-white'
                            }`}
                    >
                        <Package size={20} />
                        {sidebarOpen && <span>Assets</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'messages'
                            ? 'bg-[#9B5CFF] text-white'
                            : 'text-gray-400 hover:bg-[#222] hover:text-white'
                            }`}
                    >
                        <Mail size={20} />
                        {sidebarOpen && <span>Messages</span>}
                        {contactSubmissions.length > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {contactSubmissions.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('purchases')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'purchases'
                            ? 'bg-[#9B5CFF] text-white'
                            : 'text-gray-400 hover:bg-[#222] hover:text-white'
                            }`}
                    >
                        <Download size={20} />
                        {sidebarOpen && <span>Purchases</span>}
                    </button>
                </nav>

                {/* User Info */}
                <div className="p-4 border-t border-[#222]">
                    {sidebarOpen && <span className="text-xs text-gray-500 block mb-2 truncate">{user.email}</span>}
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-2 text-gray-400 hover:text-white transition-colors ${sidebarOpen ? 'w-full' : 'justify-center'}`}
                    >
                        <LogOut size={18} />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                <div className="max-w-4xl mx-auto">
                    {/* ============ PROJECTS TAB ============ */}
                    {activeTab === 'projects' && (
                        <>
                            <div className="flex justify-between items-center mb-8">
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    Project Dashboard
                                </h1>
                            </div>

                            <div className="mb-8 flex justify-end gap-3">
                                <button
                                    onClick={async () => {
                                        if (confirm('Add Motion Graphics projects?')) {
                                            setLoading(true);
                                            const motionProjects = [
                                                { link: "https://cdn.jsdelivr.net/gh/rajudalai/portfolio-assets@main/Motion%20Graphics/line.mp4", title: "Line" },
                                                { link: "https://cdn.jsdelivr.net/gh/rajudalai/portfolio-assets@main/Motion%20Graphics/money%20skills.mp4", title: "Money Skills" },
                                                { link: "https://cdn.jsdelivr.net/gh/rajudalai/portfolio-assets@main/Motion%20Graphics/no%20one%20is%20safe%20company%202.mp4", title: "No One Is Safe Company 2" },
                                                { link: "https://cdn.jsdelivr.net/gh/rajudalai/portfolio-assets@main/Motion%20Graphics/paycheck.mp4", title: "Paycheck" },
                                                { link: "https://cdn.jsdelivr.net/gh/rajudalai/portfolio-assets@main/Motion%20Graphics/pie%20chart%20animation.mp4", title: "Pie Chart Animation" },
                                                { link: "https://cdn.jsdelivr.net/gh/rajudalai/portfolio-assets@main/Motion%20Graphics/smart%20productive%20more%20effecient%202.mp4", title: "Smart Productive More Effecient 2" },
                                                { link: "https://cdn.jsdelivr.net/gh/rajudalai/portfolio-assets@main/Motion%20Graphics/test%205.mp4", title: "Test 5" },
                                                { link: "https://cdn.jsdelivr.net/gh/rajudalai/portfolio-assets@main/Motion%20Graphics/test.mp4", title: "Test" },
                                                { link: "https://cdn.jsdelivr.net/gh/rajudalai/portfolio-assets@main/Motion%20Graphics/wire%20animation.mp4", title: "Wire Animation" }
                                            ];

                                            try {
                                                let order = 14;
                                                for (const p of motionProjects) {
                                                    await addDoc(collection(db, 'projects'), {
                                                        type: 'Motion Graphics',
                                                        link: p.link,
                                                        title: p.title,
                                                        description: p.title,
                                                        tools: [],
                                                        order: order++,
                                                        aspect: 'aspect-[16/9]'
                                                    });
                                                }
                                                await fetchProjects();
                                                alert('Motion Graphics added!');
                                            } catch (e: any) {
                                                console.error(e);
                                                alert('Error: ' + e.message);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                    className="text-xs text-neon hover:underline"
                                >
                                    + Add Motion Graphics
                                </button>
                                <button
                                    onClick={async () => {
                                        if (confirm('This will add sample projects to your database. Continue?')) {
                                            setLoading(true);
                                            const sampleProjects = [
                                                {
                                                    type: 'video',
                                                    link: 'https://vjs.zencdn.net/v/oceans.mp4',
                                                    title: 'Ocean Documentary Spec',
                                                    description: 'A cinematic exploration of marine life.',
                                                    tools: ['Premiere Pro', 'DaVinci Resolve'],
                                                    order: 1
                                                },
                                                {
                                                    type: 'thumbnail',
                                                    link: 'https://picsum.photos/id/1/800/600',
                                                    title: 'Tech Review Thumbnail',
                                                    description: 'High CTR thumbnail design for YouTube.',
                                                    tools: ['Photoshop'],
                                                    order: 2
                                                },
                                                {
                                                    type: 'image',
                                                    link: 'https://picsum.photos/id/2/800/600',
                                                    title: 'Brand Identity',
                                                    description: 'Minimalist logo and brand guidelines.',
                                                    tools: ['Illustrator', 'Figma'],
                                                    order: 3
                                                }
                                            ];

                                            try {
                                                for (const p of sampleProjects) {
                                                    await addDoc(collection(db, 'projects'), p);
                                                }
                                                await fetchProjects();
                                                alert('Sample data added!');
                                            } catch (e: any) {
                                                console.error(e);
                                                alert('Error adding sample data: ' + e.message);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                    className="text-xs text-[#9B5CFF] hover:underline"
                                >
                                    + Load Sample Data
                                </button>
                            </div>

                            {/* Bulk Operations Section */}
                            <div className="bg-[#111] p-6 rounded-xl border border-[#222] mb-8">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <FileSpreadsheet size={20} />
                                    Bulk Operations
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Excel Import */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium text-gray-400">Import Projects from Excel</h3>
                                        <div className="flex gap-2">
                                            <input
                                                type="file"
                                                accept=".xlsx, .xls, .csv"
                                                className="hidden"
                                                id="excel-upload"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    setLoading(true);
                                                    try {
                                                        const data = await file.arrayBuffer();
                                                        const workbook = XLSX.read(data);
                                                        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                                                        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                                                        const batch = writeBatch(db);
                                                        let count = 0;

                                                        for (const row of jsonData) {
                                                            const docRef = doc(collection(db, "projects"));
                                                            const newProject: any = {
                                                                title: row.Title || row.title || 'Untitled',
                                                                link: row.Link || row.link || '',
                                                                type: row.Type || row.type || 'video',
                                                                description: row.Description || row.description || '',
                                                                tools: (row.Tools || row.tools || '').split(',').map((t: string) => t.trim()).filter(Boolean),
                                                                order: parseInt(row.Order || row.order) || 0,
                                                                aspect: row.Aspect || row.aspect || 'aspect-[16/9]',
                                                                autoPlay: (row.AutoPlay || row.autoPlay || 'TRUE').toString().toUpperCase() !== 'FALSE'
                                                            };
                                                            batch.set(docRef, newProject);
                                                            count++;
                                                        }

                                                        await batch.commit();
                                                        await fetchProjects();
                                                        alert(`Successfully imported ${count} projects!`);
                                                    } catch (error: any) {
                                                        console.error("Error importing Excel:", error);
                                                        alert("Error importing Excel: " + error.message);
                                                    } finally {
                                                        setLoading(false);
                                                        // Reset input
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor="excel-upload"
                                                className="cursor-pointer flex items-center gap-2 bg-[#222] px-4 py-2 rounded hover:bg-[#333] transition-colors"
                                            >
                                                <Upload size={16} />
                                                Choose File
                                            </label>
                                            <button
                                                type="button"
                                                onClick={downloadSampleExcel}
                                                className="flex items-center gap-2 bg-[#9B5CFF]/20 text-[#9B5CFF] px-4 py-2 rounded hover:bg-[#9B5CFF]/30 transition-colors"
                                            >
                                                <FileSpreadsheet size={16} />
                                                Download Template
                                            </button>
                                            <button
                                                type="button"
                                                onClick={downloadAllProjectsExcel}
                                                className="flex items-center gap-2 bg-green-900/20 text-green-500 px-4 py-2 rounded hover:bg-green-900/40 transition-colors"
                                            >
                                                <FileSpreadsheet size={16} />
                                                Download All Projects
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Supported columns: Title, Link, Type, Description, Tools, Order, Aspect, AutoPlay (TRUE/FALSE)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form Section */}
                            <div className="bg-[#111] p-6 rounded-xl border border-[#222] mb-8">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
                                    {editingId ? 'Edit Project' : 'Add New Project'}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Link (Image/Video URL)</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.link}
                                                onChange={e => setFormData({ ...formData, link: e.target.value })}
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Type</label>
                                            {customTypeMode ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter new type..."
                                                        value={customTypeInput}
                                                        onChange={e => {
                                                            setCustomTypeInput(e.target.value);
                                                            setFormData({ ...formData, type: e.target.value });
                                                        }}
                                                        className="flex-1 bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCustomTypeMode(false);
                                                            setCustomTypeInput('');
                                                            setFormData({ ...formData, type: 'video' });
                                                        }}
                                                        className="px-3 py-2 bg-[#333] rounded hover:bg-[#444] text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <select
                                                    value={formData.type}
                                                    onChange={e => {
                                                        if (e.target.value === '__new__') {
                                                            setCustomTypeMode(true);
                                                            setCustomTypeInput('');
                                                            setFormData({ ...formData, type: '' });
                                                        } else {
                                                            setFormData({ ...formData, type: e.target.value });
                                                        }
                                                    }}
                                                    className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                                >
                                                    {allProjectTypes.map(type => (
                                                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                                    ))}
                                                    <option value="__new__">+ Add new type...</option>
                                                </select>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Order</label>
                                            <input
                                                type="number"
                                                value={formData.order}
                                                onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Aspect Ratio (W:H)</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="W"
                                                    value={formData.aspect?.match(/\[(\d+)/)?.[1] || '16'}
                                                    onChange={e => {
                                                        const w = e.target.value || '16';
                                                        const h = formData.aspect?.match(/\/(\d+)\]/)?.[1] || '9';
                                                        setFormData({ ...formData, aspect: `aspect-[${w}/${h}]` });
                                                    }}
                                                    className="w-20 bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none text-center"
                                                />
                                                <span className="text-gray-500">:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="H"
                                                    value={formData.aspect?.match(/\/(\d+)\]/)?.[1] || '9'}
                                                    onChange={e => {
                                                        const w = formData.aspect?.match(/\[(\d+)/)?.[1] || '16';
                                                        const h = e.target.value || '9';
                                                        setFormData({ ...formData, aspect: `aspect-[${w}/${h}]` });
                                                    }}
                                                    className="w-20 bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Description</label>
                                        <textarea
                                            required
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none h-24"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Tools (comma separated)</label>
                                        <input
                                            type="text"
                                            value={toolsInput}
                                            onChange={e => setToolsInput(e.target.value)}
                                            placeholder="React, Firebase, Tailwind"
                                            className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                        />
                                    </div>

                                    {/* AutoPlay Toggle */}
                                    <div className="flex items-center gap-3">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.autoPlay !== false}
                                                onChange={e => setFormData({ ...formData, autoPlay: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9B5CFF]"></div>
                                        </label>
                                        <span className="text-sm text-gray-400">Auto-play video</span>
                                        <span className="text-xs text-gray-600">(If off, video plays on hover)</span>
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex items-center gap-2 bg-[#9B5CFF] text-white px-6 py-2 rounded hover:bg-[#8A4BEF] disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                            {editingId ? 'Update' : 'Save'} Project
                                        </button>
                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={resetForm}
                                                className="flex items-center gap-2 bg-[#333] text-white px-6 py-2 rounded hover:bg-[#444]"
                                            >
                                                <X size={20} /> Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* List Section */}
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                    <h2 className="text-xl font-semibold">Existing Projects</h2>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setSelectedTypeFilter('all')}
                                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedTypeFilter === 'all'
                                                ? 'bg-[#9B5CFF] text-white'
                                                : 'bg-[#222] text-gray-400 hover:bg-[#333] hover:text-white'
                                                }`}
                                        >
                                            All ({projects.length})
                                        </button>
                                        {allProjectTypes.map(type => {
                                            const count = projects.filter(p => p.type === type).length;
                                            if (count === 0) return null;
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => setSelectedTypeFilter(type)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedTypeFilter === type
                                                        ? 'bg-[#9B5CFF] text-white'
                                                        : 'bg-[#222] text-gray-400 hover:bg-[#333] hover:text-white'
                                                        }`}
                                                >
                                                    {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                {loading && projects.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">Loading...</div>
                                ) : (
                                    projects
                                        .filter(p => selectedTypeFilter === 'all' || p.type === selectedTypeFilter)
                                        .map(project => (
                                            <div key={project.id} className="bg-[#111] p-4 rounded-xl border border-[#222]">
                                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-[#222] rounded overflow-hidden flex-shrink-0">
                                                            {project.type === 'video' ? (
                                                                <video src={project.link} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <img src={project.link} alt={project.title} className="w-full h-full object-cover" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg">{project.title}</h3>
                                                            <div className="flex gap-2 text-xs text-gray-400">
                                                                <span className="bg-[#222] px-2 py-0.5 rounded uppercase">{project.type}</span>
                                                                <span>Order: {project.order}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEdit(project)}
                                                            className="p-2 bg-[#222] text-white rounded hover:bg-[#333]"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(project.id)}
                                                            className="p-2 bg-red-900/20 text-red-500 rounded hover:bg-red-900/40"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>

                            {/* Delete All Projects - Danger Zone at Bottom */}
                            <div className="bg-[#111] p-6 rounded-xl border border-red-900/30 mt-8">
                                <h3 className="text-lg font-medium text-red-400 flex items-center gap-2 mb-4">
                                    <AlertTriangle size={20} />
                                    Danger Zone
                                </h3>
                                <button
                                    onClick={async () => {
                                        if (confirm("ARE YOU SURE? This will DELETE ALL projects permanently. This action cannot be undone.")) {
                                            const doubleCheck = prompt("Type 'DELETE' to confirm:");
                                            if (doubleCheck !== "DELETE") return;

                                            setLoading(true);
                                            try {
                                                const batch = writeBatch(db);
                                                projects.forEach(p => {
                                                    const ref = doc(db, 'projects', p.id);
                                                    batch.delete(ref);
                                                });
                                                await batch.commit();
                                                await fetchProjects();
                                                alert("All projects deleted.");
                                            } catch (error: any) {
                                                console.error("Error deleting all:", error);
                                                alert("Error deleting all: " + error.message);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                    className="flex items-center gap-2 bg-red-900/20 text-red-500 px-4 py-3 rounded hover:bg-red-900/40 transition-colors w-full justify-center"
                                >
                                    <Trash2 size={16} />
                                    Delete ALL Projects
                                </button>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    This action cannot be undone. Use with extreme caution.
                                </p>
                            </div>
                        </>
                    )}

                    {/* ============ FEATURED PROJECTS TAB ============ */}
                    {activeTab === 'featured' && (
                        <>
                            <div className="flex justify-between items-center mb-8">
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    Featured Projects
                                </h1>
                            </div>

                            {/* Seed Data Button for Featured */}
                            <div className="mb-8 flex justify-end">
                                <button
                                    onClick={async () => {
                                        if (confirm('This will add sample featured projects to your database. Continue?')) {
                                            setFeaturedLoading(true);
                                            const sampleFeatured = [
                                                {
                                                    type: 'image',
                                                    src: 'https://cdn.jsdelivr.net/gh/rajudalai/portfolio-assets@main/DS%20Updated%20%20p1.jpg',
                                                    category: 'Branding',
                                                    title: 'Arcadia OS',
                                                    aspect: 'aspect-[9/13]',
                                                    order: 1
                                                },
                                                {
                                                    type: 'video',
                                                    src: 'https://cdn.jsdelivr.net/gh/rajudalai/portfolio-assets@main/Gen%20AI%20Vs%20Agentic%20AI%20Motion%20Animation%20.mp4',
                                                    category: 'Health',
                                                    title: 'Helix Care',
                                                    aspect: 'aspect-[16/9]',
                                                    order: 2
                                                },
                                                {
                                                    type: 'video',
                                                    src: 'https://cdn.jsdelivr.net/gh/rajudalai/portfolio-assets@main/Laziest%20way%20to%20make%20money%20with%20ai%20intro%20Compressed.mp4',
                                                    category: 'Product',
                                                    title: 'Nimbus Finance',
                                                    aspect: 'aspect-[16/9]',
                                                    order: 3
                                                },
                                                {
                                                    type: 'image',
                                                    src: 'https://cdn.jsdelivr.net/gh/rajudalai/portfolio-assets@main/DS%20Updated%20%20p1.jpg',
                                                    category: 'Motion',
                                                    title: 'Lumen AI',
                                                    aspect: 'aspect-[9/13]',
                                                    order: 4
                                                }
                                            ];

                                            try {
                                                for (const p of sampleFeatured) {
                                                    await addDoc(collection(db, 'featuredProjects'), p);
                                                }
                                                await fetchFeaturedProjects();
                                                alert('Sample featured projects added!');
                                            } catch (e: any) {
                                                console.error(e);
                                                alert('Error adding sample data: ' + e.message);
                                            } finally {
                                                setFeaturedLoading(false);
                                            }
                                        }
                                    }}
                                    className="text-xs text-[#9B5CFF] hover:underline"
                                >
                                    + Load Sample Data
                                </button>
                            </div>

                            {/* Form Section */}
                            <div className="bg-[#111] p-6 rounded-xl border border-[#222] mb-8">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    {featuredEditingId ? <Edit2 size={20} /> : <Plus size={20} />}
                                    {featuredEditingId ? 'Edit Featured Project' : 'Add New Featured Project'}
                                </h2>

                                <form onSubmit={handleFeaturedSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={featuredFormData.title}
                                                onChange={e => setFeaturedFormData({ ...featuredFormData, title: e.target.value })}
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Category</label>
                                            <input
                                                type="text"
                                                required
                                                value={featuredFormData.category}
                                                onChange={e => setFeaturedFormData({ ...featuredFormData, category: e.target.value })}
                                                placeholder="Branding, Product, Motion..."
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Source URL (Image/Video)</label>
                                            <input
                                                type="text"
                                                required
                                                value={featuredFormData.src}
                                                onChange={e => setFeaturedFormData({ ...featuredFormData, src: e.target.value })}
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Type</label>
                                            {featuredCustomTypeMode ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter new type..."
                                                        value={featuredCustomTypeInput}
                                                        onChange={e => {
                                                            setFeaturedCustomTypeInput(e.target.value);
                                                            setFeaturedFormData({ ...featuredFormData, type: e.target.value });
                                                        }}
                                                        className="flex-1 bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFeaturedCustomTypeMode(false);
                                                            setFeaturedCustomTypeInput('');
                                                            setFeaturedFormData({ ...featuredFormData, type: 'video' });
                                                        }}
                                                        className="px-3 py-2 bg-[#333] rounded hover:bg-[#444] text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <select
                                                    value={featuredFormData.type}
                                                    onChange={e => {
                                                        if (e.target.value === '__new__') {
                                                            setFeaturedCustomTypeMode(true);
                                                            setFeaturedCustomTypeInput('');
                                                            setFeaturedFormData({ ...featuredFormData, type: '' });
                                                        } else {
                                                            setFeaturedFormData({ ...featuredFormData, type: e.target.value });
                                                        }
                                                    }}
                                                    className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                                >
                                                    {allFeaturedTypes.map(type => (
                                                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                                    ))}
                                                    <option value="__new__">+ Add new type...</option>
                                                </select>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Aspect Ratio</label>
                                            <select
                                                value={featuredFormData.aspect}
                                                onChange={e => setFeaturedFormData({ ...featuredFormData, aspect: e.target.value })}
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            >
                                                <option value="aspect-[16/9]">16:9 (Landscape)</option>
                                                <option value="aspect-[9/13]">9:13 (Portrait)</option>
                                                <option value="aspect-[1/1]">1:1 (Square)</option>
                                                <option value="aspect-[4/3]">4:3 (Standard)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Order</label>
                                            <input
                                                type="number"
                                                value={featuredFormData.order}
                                                onChange={e => setFeaturedFormData({ ...featuredFormData, order: parseInt(e.target.value) })}
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button
                                            type="submit"
                                            disabled={featuredLoading}
                                            className="flex items-center gap-2 bg-[#9B5CFF] text-white px-6 py-2 rounded hover:bg-[#8A4BEF] disabled:opacity-50"
                                        >
                                            {featuredLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                            {featuredEditingId ? 'Update' : 'Save'} Featured Project
                                        </button>
                                        {featuredEditingId && (
                                            <button
                                                type="button"
                                                onClick={resetFeaturedForm}
                                                className="flex items-center gap-2 bg-[#333] text-white px-6 py-2 rounded hover:bg-[#444]"
                                            >
                                                <X size={20} /> Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* List Section */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold mb-4">Existing Featured Projects</h2>
                                {featuredLoading && featuredProjects.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">Loading...</div>
                                ) : featuredProjects.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">No featured projects yet. Add one above or load sample data.</div>
                                ) : (
                                    featuredProjects.map(project => (
                                        <div key={project.id} className="bg-[#111] p-4 rounded-xl border border-[#222] flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-12 bg-[#222] rounded overflow-hidden flex-shrink-0">
                                                    {project.type === 'video' ? (
                                                        <video src={project.src} className="w-full h-full object-cover" muted />
                                                    ) : (
                                                        <img src={project.src} alt={project.title} className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">{project.title}</h3>
                                                    <div className="flex gap-2 text-xs text-gray-400">
                                                        <span className="bg-[#222] px-2 py-0.5 rounded uppercase">{project.type}</span>
                                                        <span className="bg-[#222] px-2 py-0.5 rounded">{project.category}</span>
                                                        <span>Order: {project.order}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleFeaturedEdit(project)}
                                                    className="p-2 bg-[#222] text-white rounded hover:bg-[#333]"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleFeaturedDelete(project.id)}
                                                    className="p-2 bg-red-900/20 text-red-500 rounded hover:bg-red-900/40"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {/* ============ SETTINGS TAB ============ */}
                    {activeTab === 'settings' && (
                        <SettingsTab allProjectTypes={allProjectTypes} />
                    )}

                    {/* ============ CONTENT TAB ============ */}
                    {activeTab === 'content' && (
                        <>
                            <div className="flex justify-between items-center mb-8">
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    Edit Content
                                </h1>
                                <button
                                    onClick={saveContent}
                                    disabled={contentSaving}
                                    className="flex items-center gap-2 bg-[#9B5CFF] text-white px-6 py-2 rounded-lg hover:bg-[#8A4BEF] disabled:opacity-50"
                                >
                                    {contentSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save All Changes
                                </button>
                            </div>

                            {contentLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-[#9B5CFF]" size={32} />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Page Selector */}
                                    <div className="bg-[#111] p-4 rounded-xl border border-[#222]">
                                        <label className="block text-sm text-gray-400 mb-2">Select Page</label>
                                        <select
                                            value={selectedPage}
                                            onChange={(e) => setSelectedPage(e.target.value as 'home' | 'work' | 'assets' | 'contact' | 'pricing' | 'footer')}
                                            className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 text-white"
                                        >
                                            <option value="home">Home Page</option>
                                            <option value="work">Work Page</option>
                                            <option value="assets">Assets Page</option>
                                            <option value="contact">Contact Page</option>
                                            <option value="pricing">Pricing Page</option>
                                            <option value="footer">Footer</option>
                                        </select>
                                    </div>

                                    {/* HOME PAGE SECTIONS */}
                                    {selectedPage === 'home' && (
                                        <div className="space-y-4">
                                            {/* Hero Section Accordion */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('hero') ? prev.filter(s => s !== 'hero') : [...prev, 'hero'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Hero Section</span>
                                                    {expandedSections.includes('hero') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('hero') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Badge Text</label>
                                                            <input type="text" value={content.home.hero.badge} onChange={(e) => setContent({ ...content, home: { ...content.home, hero: { ...content.home.hero, badge: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Title</label>
                                                            <textarea value={content.home.hero.title} onChange={(e) => setContent({ ...content, home: { ...content.home, hero: { ...content.home.hero, title: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Subtitle</label>
                                                            <textarea value={content.home.hero.subtitle} onChange={(e) => setContent({ ...content, home: { ...content.home, hero: { ...content.home.hero, subtitle: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Hero Image URL</label>
                                                            <input type="text" value={content.home.hero.image} onChange={(e) => setContent({ ...content, home: { ...content.home, hero: { ...content.home.hero, image: e.target.value } } })} placeholder="https://..." className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Primary Button Text</label>
                                                                <input type="text" value={content.home.hero.buttonPrimary} onChange={(e) => setContent({ ...content, home: { ...content.home, hero: { ...content.home.hero, buttonPrimary: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Secondary Button Text</label>
                                                                <input type="text" value={content.home.hero.buttonSecondary} onChange={(e) => setContent({ ...content, home: { ...content.home, hero: { ...content.home.hero, buttonSecondary: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 mt-4 border-t border-[#333] pt-4">
                                                            <h3 className="col-span-2 text-sm font-semibold text-gray-300">Hero Card 1 (Retention Rate)</h3>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Label</label>
                                                                <input type="text" value={content.home.hero.card1.label} onChange={(e) => setContent({ ...content, home: { ...content.home, hero: { ...content.home.hero, card1: { ...content.home.hero.card1, label: e.target.value } } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Value</label>
                                                                <input type="text" value={content.home.hero.card1.value} onChange={(e) => setContent({ ...content, home: { ...content.home, hero: { ...content.home.hero, card1: { ...content.home.hero.card1, value: e.target.value } } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <h3 className="col-span-2 text-sm font-semibold text-gray-300">Hero Card 2 (Total Views)</h3>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Label</label>
                                                                <input type="text" value={content.home.hero.card2.label} onChange={(e) => setContent({ ...content, home: { ...content.home, hero: { ...content.home.hero, card2: { ...content.home.hero.card2, label: e.target.value } } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Value</label>
                                                                <input type="text" value={content.home.hero.card2.value} onChange={(e) => setContent({ ...content, home: { ...content.home, hero: { ...content.home.hero, card2: { ...content.home.hero.card2, value: e.target.value } } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Stats Section Accordion */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('stats') ? prev.filter(s => s !== 'stats') : [...prev, 'stats'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Stats Section</span>
                                                    {expandedSections.includes('stats') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('stats') && (
                                                    <div className="p-4 pt-0 border-t border-[#222]">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Stat 1</label>
                                                                <input type="text" value={content.home.stats.stat1Value} onChange={(e) => setContent({ ...content, home: { ...content.home, stats: { ...content.home.stats, stat1Value: e.target.value } } })} placeholder="Value" className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                                <input type="text" value={content.home.stats.stat1Label} onChange={(e) => setContent({ ...content, home: { ...content.home, stats: { ...content.home.stats, stat1Label: e.target.value } } })} placeholder="Label" className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 mt-2" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Stat 2</label>
                                                                <input type="text" value={content.home.stats.stat2Value} onChange={(e) => setContent({ ...content, home: { ...content.home, stats: { ...content.home.stats, stat2Value: e.target.value } } })} placeholder="Value" className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                                <input type="text" value={content.home.stats.stat2Label} onChange={(e) => setContent({ ...content, home: { ...content.home, stats: { ...content.home.stats, stat2Label: e.target.value } } })} placeholder="Label" className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 mt-2" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Stat 3</label>
                                                                <input type="text" value={content.home.stats.stat3Value} onChange={(e) => setContent({ ...content, home: { ...content.home, stats: { ...content.home.stats, stat3Value: e.target.value } } })} placeholder="Value" className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                                <input type="text" value={content.home.stats.stat3Label} onChange={(e) => setContent({ ...content, home: { ...content.home, stats: { ...content.home.stats, stat3Label: e.target.value } } })} placeholder="Label" className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 mt-2" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* About Section Accordion */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('about') ? prev.filter(s => s !== 'about') : [...prev, 'about'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">About Section</span>
                                                    {expandedSections.includes('about') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('about') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Title</label>
                                                                <input type="text" value={content.home.about.title} onChange={(e) => setContent({ ...content, home: { ...content.home, about: { ...content.home.about, title: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Subtitle</label>
                                                                <input type="text" value={content.home.about.subtitle} onChange={(e) => setContent({ ...content, home: { ...content.home, about: { ...content.home.about, subtitle: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Paragraph 1</label>
                                                            <textarea value={content.home.about.paragraph1} onChange={(e) => setContent({ ...content, home: { ...content.home, about: { ...content.home.about, paragraph1: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-24" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Paragraph 2</label>
                                                            <textarea value={content.home.about.paragraph2} onChange={(e) => setContent({ ...content, home: { ...content.home, about: { ...content.home.about, paragraph2: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-24" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Skills (comma-separated)</label>
                                                            <textarea value={content.home.about.skills} onChange={(e) => setContent({ ...content, home: { ...content.home, about: { ...content.home.about, skills: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">About Image URL</label>
                                                                <input type="text" value={content.home.about.image} onChange={(e) => setContent({ ...content, home: { ...content.home, about: { ...content.home.about, image: e.target.value } } })} placeholder="https://..." className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Years Experience</label>
                                                                <input type="text" value={content.home.about.yearsExperience} onChange={(e) => setContent({ ...content, home: { ...content.home, about: { ...content.home.about, yearsExperience: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Portfolio Section Accordion */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('portfolio') ? prev.filter(s => s !== 'portfolio') : [...prev, 'portfolio'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Portfolio Section</span>
                                                    {expandedSections.includes('portfolio') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('portfolio') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Section Tag</label>
                                                            <input type="text" value={content.home.portfolio.tag} onChange={(e) => setContent({ ...content, home: { ...content.home, portfolio: { ...content.home.portfolio, tag: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Heading</label>
                                                            <textarea value={content.home.portfolio.heading} onChange={(e) => setContent({ ...content, home: { ...content.home, portfolio: { ...content.home.portfolio, heading: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 border-t border-[#333] pt-4">
                                                            <h3 className="col-span-2 text-sm font-semibold text-gray-300">Timeline Items</h3>
                                                            {/* Item 1 */}
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Item 1 Title</label>
                                                                <input type="text" value={content.home.portfolio.timeline.item1Title} onChange={(e) => setContent({ ...content, home: { ...content.home, portfolio: { ...content.home.portfolio, timeline: { ...content.home.portfolio.timeline, item1Title: e.target.value } } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Item 1 Desc</label>
                                                                <input type="text" value={content.home.portfolio.timeline.item1Desc} onChange={(e) => setContent({ ...content, home: { ...content.home, portfolio: { ...content.home.portfolio, timeline: { ...content.home.portfolio.timeline, item1Desc: e.target.value } } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            {/* Item 2 */}
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Item 2 Title</label>
                                                                <input type="text" value={content.home.portfolio.timeline.item2Title} onChange={(e) => setContent({ ...content, home: { ...content.home, portfolio: { ...content.home.portfolio, timeline: { ...content.home.portfolio.timeline, item2Title: e.target.value } } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Item 2 Desc</label>
                                                                <input type="text" value={content.home.portfolio.timeline.item2Desc} onChange={(e) => setContent({ ...content, home: { ...content.home, portfolio: { ...content.home.portfolio, timeline: { ...content.home.portfolio.timeline, item2Desc: e.target.value } } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            {/* Item 3 */}
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Item 3 Title</label>
                                                                <input type="text" value={content.home.portfolio.timeline.item3Title} onChange={(e) => setContent({ ...content, home: { ...content.home, portfolio: { ...content.home.portfolio, timeline: { ...content.home.portfolio.timeline, item3Title: e.target.value } } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Item 3 Desc</label>
                                                                <input type="text" value={content.home.portfolio.timeline.item3Desc} onChange={(e) => setContent({ ...content, home: { ...content.home, portfolio: { ...content.home.portfolio, timeline: { ...content.home.portfolio.timeline, item3Desc: e.target.value } } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                        <div className="border-t border-[#333] pt-4">
                                                            <h3 className="text-sm font-semibold text-gray-300 mb-4">Impact Section</h3>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-sm text-gray-400 mb-1">Impact Title</label>
                                                                    <input type="text" value={content.home.portfolio.impactTitle} onChange={(e) => setContent({ ...content, home: { ...content.home, portfolio: { ...content.home.portfolio, impactTitle: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm text-gray-400 mb-1">Button Text</label>
                                                                    <input type="text" value={content.home.portfolio.buttonText} onChange={(e) => setContent({ ...content, home: { ...content.home, portfolio: { ...content.home.portfolio, buttonText: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <label className="block text-sm text-gray-400 mb-1">Impact Description</label>
                                                                    <textarea value={content.home.portfolio.impactDesc} onChange={(e) => setContent({ ...content, home: { ...content.home, portfolio: { ...content.home.portfolio, impactDesc: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Testimonials Section Accordion */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('testimonials') ? prev.filter(s => s !== 'testimonials') : [...prev, 'testimonials'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Testimonials Section</span>
                                                    {expandedSections.includes('testimonials') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('testimonials') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Section Title</label>
                                                            <input type="text" value={content.home.testimonials.title} onChange={(e) => setContent({ ...content, home: { ...content.home, testimonials: { ...content.home.testimonials, title: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Section Subtitle</label>
                                                            <input type="text" value={content.home.testimonials.subtitle} onChange={(e) => setContent({ ...content, home: { ...content.home, testimonials: { ...content.home.testimonials, subtitle: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div className="border-t border-[#333] pt-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h3 className="text-sm font-semibold text-gray-300">Testimonials</h3>
                                                                <button
                                                                    onClick={() => setContent({ ...content, home: { ...content.home, testimonials: { ...content.home.testimonials, items: [...content.home.testimonials.items, { id: Date.now().toString(), name: '', role: '', quote: '', image: '' }] } } })}
                                                                    className="flex items-center gap-2 px-3 py-1 bg-[#9B5CFF] text-white rounded hover:bg-[#8A4BEF] transition-colors text-sm"
                                                                >
                                                                    <Plus size={16} /> Add Testimonial
                                                                </button>
                                                            </div>
                                                            <div className="space-y-4">
                                                                {content.home.testimonials.items.map((item, index) => (
                                                                    <div key={item.id} className="grid grid-cols-1 gap-4 p-4 bg-[#0a0a0a] rounded border border-[#333]">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-xs text-gray-500 font-semibold">Testimonial {index + 1}</span>
                                                                            <button
                                                                                onClick={() => setContent({ ...content, home: { ...content.home, testimonials: { ...content.home.testimonials, items: content.home.testimonials.items.filter((_, i) => i !== index) } } })}
                                                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div>
                                                                                <label className="block text-xs text-gray-500 mb-1">Name</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={item.name}
                                                                                    onChange={(e) => {
                                                                                        const newItems = [...content.home.testimonials.items];
                                                                                        newItems[index] = { ...newItems[index], name: e.target.value };
                                                                                        setContent({ ...content, home: { ...content.home, testimonials: { ...content.home.testimonials, items: newItems } } });
                                                                                    }}
                                                                                    className="w-full bg-[#070707] border border-[#444] rounded p-2 text-sm"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-xs text-gray-500 mb-1">Role</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={item.role}
                                                                                    onChange={(e) => {
                                                                                        const newItems = [...content.home.testimonials.items];
                                                                                        newItems[index] = { ...newItems[index], role: e.target.value };
                                                                                        setContent({ ...content, home: { ...content.home, testimonials: { ...content.home.testimonials, items: newItems } } });
                                                                                    }}
                                                                                    className="w-full bg-[#070707] border border-[#444] rounded p-2 text-sm"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs text-gray-500 mb-1">Image URL</label>
                                                                            <input
                                                                                type="text"
                                                                                value={item.image}
                                                                                onChange={(e) => {
                                                                                    const newItems = [...content.home.testimonials.items];
                                                                                    newItems[index] = { ...newItems[index], image: e.target.value };
                                                                                    setContent({ ...content, home: { ...content.home, testimonials: { ...content.home.testimonials, items: newItems } } });
                                                                                }}
                                                                                className="w-full bg-[#070707] border border-[#444] rounded p-2 text-sm"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs text-gray-500 mb-1">Quote</label>
                                                                            <textarea
                                                                                value={item.quote}
                                                                                onChange={(e) => {
                                                                                    const newItems = [...content.home.testimonials.items];
                                                                                    newItems[index] = { ...newItems[index], quote: e.target.value };
                                                                                    setContent({ ...content, home: { ...content.home, testimonials: { ...content.home.testimonials, items: newItems } } });
                                                                                }}
                                                                                className="w-full bg-[#070707] border border-[#444] rounded p-2 text-sm h-20"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Brands Section Accordion */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('brands') ? prev.filter(s => s !== 'brands') : [...prev, 'brands'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Brands/Clients Section</span>
                                                    {expandedSections.includes('brands') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('brands') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Heading Text</label>
                                                            <input
                                                                type="text"
                                                                value={content.home.brands.heading}
                                                                onChange={(e) => setContent({ ...content, home: { ...content.home, brands: { ...content.home.brands, heading: e.target.value } } })}
                                                                className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3"
                                                                placeholder="e.g., Trusted by teams at"
                                                            />
                                                        </div>
                                                        <div className="border-t border-[#333] pt-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h3 className="text-sm font-semibold text-gray-300">Brand Items</h3>
                                                                <button
                                                                    onClick={() => setContent({ ...content, home: { ...content.home, brands: { ...content.home.brands, items: [...content.home.brands.items, { name: '', imageUrl: '', fontClass: '' }] } } })}
                                                                    className="flex items-center gap-2 px-3 py-1 bg-[#9B5CFF] text-white rounded hover:bg-[#8A4BEF] transition-colors text-sm"
                                                                >
                                                                    <Plus size={16} /> Add Brand
                                                                </button>
                                                            </div>
                                                            <div className="space-y-3">
                                                                {content.home.brands.items.map((brand, index) => (
                                                                    <div key={index} className="grid grid-cols-1 gap-2 p-3 bg-[#0a0a0a] rounded border border-[#333]">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-xs text-gray-500 font-semibold">Brand {index + 1}</span>
                                                                            <button
                                                                                onClick={() => setContent({ ...content, home: { ...content.home, brands: { ...content.home.brands, items: content.home.brands.items.filter((_, i) => i !== index) } } })}
                                                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={brand.name}
                                                                            onChange={(e) => {
                                                                                const newItems = [...content.home.brands.items];
                                                                                newItems[index] = { ...newItems[index], name: e.target.value };
                                                                                setContent({ ...content, home: { ...content.home, brands: { ...content.home.brands, items: newItems } } });
                                                                            }}
                                                                            placeholder="Brand Name (required)"
                                                                            className="bg-[#070707] border border-[#444] rounded p-2 text-sm"
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            value={brand.imageUrl || ''}
                                                                            onChange={(e) => {
                                                                                const newItems = [...content.home.brands.items];
                                                                                newItems[index] = { ...newItems[index], imageUrl: e.target.value };
                                                                                setContent({ ...content, home: { ...content.home, brands: { ...content.home.brands, items: newItems } } });
                                                                            }}
                                                                            placeholder="Image URL (optional - leave empty for text)"
                                                                            className="bg-[#070707] border border-[#444] rounded p-2 text-sm"
                                                                        />
                                                                        <select
                                                                            value={brand.fontClass || ''}
                                                                            onChange={(e) => {
                                                                                const newItems = [...content.home.brands.items];
                                                                                newItems[index] = { ...newItems[index], fontClass: e.target.value };
                                                                                setContent({ ...content, home: { ...content.home, brands: { ...content.home.brands, items: newItems } } });
                                                                            }}
                                                                            className="bg-[#070707] border border-[#444] rounded p-2 text-sm"
                                                                        >
                                                                            <option value="">Font: Default</option>
                                                                            <option value="font-bricolage">Font: Bricolage</option>
                                                                            <option value="font-merriweather">Font: Merriweather</option>
                                                                            <option value="font-instrument-serif">Font: Instrument Serif</option>
                                                                            <option value="font-playfair">Font: Playfair</option>
                                                                        </select>
                                                                    </div>
                                                                ))}
                                                                {content.home.brands.items.length === 0 && (
                                                                    <div className="text-center py-6 text-gray-500 text-sm">
                                                                        No brands yet. Click "Add Brand" to get started.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Orbital Workflow Section Accordion */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('workflow') ? prev.filter(s => s !== 'workflow') : [...prev, 'workflow'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Orbital Workflow Section</span>
                                                    {expandedSections.includes('workflow') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('workflow') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Section Title</label>
                                                            <input type="text" value={content.home.workflow?.title || ''} onChange={(e) => setContent({ ...content, home: { ...content.home, workflow: { ...content.home.workflow, title: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Section Subtitle</label>
                                                            <textarea value={content.home.workflow?.subtitle || ''} onChange={(e) => setContent({ ...content, home: { ...content.home, workflow: { ...content.home.workflow, subtitle: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" />
                                                        </div>
                                                        <div className="border-t border-[#333] pt-4">
                                                            <h3 className="text-sm font-semibold text-gray-300 mb-3">Workflow Items (4 Fixed items)</h3>
                                                            <div className="space-y-4">
                                                                {content.home.workflow?.items?.map((item, index) => (
                                                                    <div key={item.id || index} className="p-3 bg-[#0a0a0a] rounded border border-[#333]">
                                                                        <h4 className="text-xs text-gray-500 font-semibold mb-2">Item {index + 1}</h4>
                                                                        <div className="space-y-2">
                                                                            <div>
                                                                                <label className="block text-xs text-gray-500 mb-1">Name / Tooltip</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={item.name}
                                                                                    onChange={(e) => {
                                                                                        const newItems = [...(content.home.workflow.items || [])];
                                                                                        newItems[index] = { ...newItems[index], name: e.target.value };
                                                                                        setContent({ ...content, home: { ...content.home, workflow: { ...content.home.workflow, items: newItems } } });
                                                                                    }}
                                                                                    className="w-full bg-[#070707] border border-[#444] rounded p-2 text-sm"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-xs text-gray-500 mb-1">Image URL</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={item.image}
                                                                                    onChange={(e) => {
                                                                                        const newItems = [...(content.home.workflow.items || [])];
                                                                                        newItems[index] = { ...newItems[index], image: e.target.value };
                                                                                        setContent({ ...content, home: { ...content.home, workflow: { ...content.home.workflow, items: newItems } } });
                                                                                    }}
                                                                                    className="w-full bg-[#070707] border border-[#444] rounded p-2 text-sm"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* WORK PAGE SECTIONS */}
                                    {selectedPage === 'work' && (
                                        <div className="space-y-4">
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('workHeader') ? prev.filter(s => s !== 'workHeader') : [...prev, 'workHeader'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Page Header</span>
                                                    {expandedSections.includes('workHeader') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('workHeader') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Title</label>
                                                            <input type="text" value={content.work.header.title} onChange={(e) => setContent({ ...content, work: { ...content.work, header: { ...content.work.header, title: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Subtitle</label>
                                                            <input type="text" value={content.work.header.subtitle} onChange={(e) => setContent({ ...content, work: { ...content.work, header: { ...content.work.header, subtitle: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Filters Section */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('workFilters') ? prev.filter(s => s !== 'workFilters') : [...prev, 'workFilters'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Filter Buttons</span>
                                                    {expandedSections.includes('workFilters') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('workFilters') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">"All" Label</label>
                                                            <input type="text" value={content.work.filters.allLabel} onChange={(e) => setContent({ ...content, work: { ...content.work, filters: { ...content.work.filters, allLabel: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Empty State Message</label>
                                                            <input type="text" value={content.work.filters.emptyMessage} onChange={(e) => setContent({ ...content, work: { ...content.work, filters: { ...content.work.filters, emptyMessage: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Loading State Section */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('workLoading') ? prev.filter(s => s !== 'workLoading') : [...prev, 'workLoading'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Loading State</span>
                                                    {expandedSections.includes('workLoading') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('workLoading') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Loading Message</label>
                                                            <input type="text" value={content.work.loading.message} onChange={(e) => setContent({ ...content, work: { ...content.work, loading: { ...content.work.loading, message: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Modal Settings Section */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('workModal') ? prev.filter(s => s !== 'workModal') : [...prev, 'workModal'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Modal Settings</span>
                                                    {expandedSections.includes('workModal') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('workModal') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">"Tools Used" Label</label>
                                                            <input type="text" value={content.work.modal.toolsLabel} onChange={(e) => setContent({ ...content, work: { ...content.work, modal: { ...content.work.modal, toolsLabel: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* CONTACT PAGE SECTIONS */}
                                    {selectedPage === 'contact' && (
                                        <div className="space-y-4">
                                            {/* Header Section */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('contactHeader') ? prev.filter(s => s !== 'contactHeader') : [...prev, 'contactHeader'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Page Header</span>
                                                    {expandedSections.includes('contactHeader') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('contactHeader') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Title</label>
                                                            <input type="text" value={content.contact.header.title} onChange={(e) => setContent({ ...content, contact: { ...content.contact, header: { ...content.contact.header, title: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Subtitle</label>
                                                            <textarea value={content.contact.header.subtitle} onChange={(e) => setContent({ ...content, contact: { ...content.contact, header: { ...content.contact.header, subtitle: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Form Labels Section */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('contactFormLabels') ? prev.filter(s => s !== 'contactFormLabels') : [...prev, 'contactFormLabels'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Form Labels</span>
                                                    {expandedSections.includes('contactFormLabels') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('contactFormLabels') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Name Label</label>
                                                                <input type="text" value={content.contact.form.nameLabel} onChange={(e) => setContent({ ...content, contact: { ...content.contact, form: { ...content.contact.form, nameLabel: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Email Label</label>
                                                                <input type="text" value={content.contact.form.emailLabel} onChange={(e) => setContent({ ...content, contact: { ...content.contact, form: { ...content.contact.form, emailLabel: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Channel Label</label>
                                                            <input type="text" value={content.contact.form.channelLabel} onChange={(e) => setContent({ ...content, contact: { ...content.contact, form: { ...content.contact.form, channelLabel: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Vision Label</label>
                                                            <input type="text" value={content.contact.form.visionLabel} onChange={(e) => setContent({ ...content, contact: { ...content.contact, form: { ...content.contact.form, visionLabel: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Services Label</label>
                                                            <input type="text" value={content.contact.form.servicesLabel} onChange={(e) => setContent({ ...content, contact: { ...content.contact, form: { ...content.contact.form, servicesLabel: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Message Label</label>
                                                            <input type="text" value={content.contact.form.messageLabel} onChange={(e) => setContent({ ...content, contact: { ...content.contact, form: { ...content.contact.form, messageLabel: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Form Placeholders Section */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('contactFormPlaceholders') ? prev.filter(s => s !== 'contactFormPlaceholders') : [...prev, 'contactFormPlaceholders'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Form Placeholders</span>
                                                    {expandedSections.includes('contactFormPlaceholders') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('contactFormPlaceholders') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Name Placeholder</label>
                                                                <input type="text" value={content.contact.form.namePlaceholder} onChange={(e) => setContent({ ...content, contact: { ...content.contact, form: { ...content.contact.form, namePlaceholder: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Email Placeholder</label>
                                                                <input type="text" value={content.contact.form.emailPlaceholder} onChange={(e) => setContent({ ...content, contact: { ...content.contact, form: { ...content.contact.form, emailPlaceholder: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Channel Placeholder</label>
                                                            <input type="text" value={content.contact.form.channelPlaceholder} onChange={(e) => setContent({ ...content, contact: { ...content.contact, form: { ...content.contact.form, channelPlaceholder: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Message Placeholder</label>
                                                            <textarea value={content.contact.form.messagePlaceholder} onChange={(e) => setContent({ ...content, contact: { ...content.contact, form: { ...content.contact.form, messagePlaceholder: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Submit Button Text</label>
                                                            <input type="text" value={content.contact.form.submitButton} onChange={(e) => setContent({ ...content, contact: { ...content.contact, form: { ...content.contact.form, submitButton: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Response Time Message</label>
                                                            <input type="text" value={content.contact.form.responseTime} onChange={(e) => setContent({ ...content, contact: { ...content.contact, form: { ...content.contact.form, responseTime: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Dropdown Options & Services Section */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('contactFormOptions') ? prev.filter(s => s !== 'contactFormOptions') : [...prev, 'contactFormOptions'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Dropdown & Services Options</span>
                                                    {expandedSections.includes('contactFormOptions') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('contactFormOptions') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Vision Dropdown Options (comma-separated)</label>
                                                            <textarea value={content.contact.form.visionOptions} onChange={(e) => setContent({ ...content, contact: { ...content.contact, form: { ...content.contact.form, visionOptions: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" placeholder="Option 1, Option 2, Option 3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Services Checkboxes (comma-separated)</label>
                                                            <textarea value={content.contact.form.services} onChange={(e) => setContent({ ...content, contact: { ...content.contact, form: { ...content.contact.form, services: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" placeholder="Service 1, Service 2, Service 3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Success Message Section */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('contactSuccess') ? prev.filter(s => s !== 'contactSuccess') : [...prev, 'contactSuccess'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Success Message</span>
                                                    {expandedSections.includes('contactSuccess') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('contactSuccess') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Success Title</label>
                                                            <input type="text" value={content.contact.success.title} onChange={(e) => setContent({ ...content, contact: { ...content.contact, success: { ...content.contact.success, title: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Success Message</label>
                                                            <textarea value={content.contact.success.message} onChange={(e) => setContent({ ...content, contact: { ...content.contact, success: { ...content.contact.success, message: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Back Button Text</label>
                                                            <input type="text" value={content.contact.success.backButton} onChange={(e) => setContent({ ...content, contact: { ...content.contact, success: { ...content.contact.success, backButton: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ASSETS PAGE SECTIONS */}
                                    {selectedPage === 'assets' && (
                                        <div className="space-y-4">
                                            {/* Header Section */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('assetsHeader') ? prev.filter(s => s !== 'assetsHeader') : [...prev, 'assetsHeader'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Page Header</span>
                                                    {expandedSections.includes('assetsHeader') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('assetsHeader') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Title</label>
                                                            <input type="text" value={content.assets.header.title} onChange={(e) => setContent({ ...content, assets: { ...content.assets, header: { ...content.assets.header, title: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Subtitle</label>
                                                            <textarea value={content.assets.header.subtitle} onChange={(e) => setContent({ ...content, assets: { ...content.assets, header: { ...content.assets.header, subtitle: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Section Titles */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('assetsSections') ? prev.filter(s => s !== 'assetsSections') : [...prev, 'assetsSections'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Section Titles</span>
                                                    {expandedSections.includes('assetsSections') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('assetsSections') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Featured Assets Title</label>
                                                            <input type="text" value={content.assets.sections.featuredTitle} onChange={(e) => setContent({ ...content, assets: { ...content.assets, sections: { ...content.assets.sections, featuredTitle: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Free Assets Title</label>
                                                            <input type="text" value={content.assets.sections.freeTitle} onChange={(e) => setContent({ ...content, assets: { ...content.assets, sections: { ...content.assets.sections, freeTitle: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Premium Assets Title</label>
                                                            <input type="text" value={content.assets.sections.premiumTitle} onChange={(e) => setContent({ ...content, assets: { ...content.assets, sections: { ...content.assets.sections, premiumTitle: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">View More Button</label>
                                                            <input type="text" value={content.assets.sections.viewMore} onChange={(e) => setContent({ ...content, assets: { ...content.assets, sections: { ...content.assets.sections, viewMore: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Badge & Buttons Section */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('assetsButtons') ? prev.filter(s => s !== 'assetsButtons') : [...prev, 'assetsButtons'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Badge & Buttons</span>
                                                    {expandedSections.includes('assetsButtons') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('assetsButtons') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Page Badge Text</label>
                                                            <input type="text" value={content.assets.badge} onChange={(e) => setContent({ ...content, assets: { ...content.assets, badge: e.target.value } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Buy Now Button</label>
                                                                <input type="text" value={content.assets.buttons.buyNow} onChange={(e) => setContent({ ...content, assets: { ...content.assets, buttons: { ...content.assets.buttons, buyNow: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Download Button</label>
                                                                <input type="text" value={content.assets.buttons.download} onChange={(e) => setContent({ ...content, assets: { ...content.assets, buttons: { ...content.assets.buttons, download: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">"Free" Badge Text</label>
                                                            <input type="text" value={content.assets.freeBadge} onChange={(e) => setContent({ ...content, assets: { ...content.assets, freeBadge: e.target.value } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Tools Section */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('assetsTools') ? prev.filter(s => s !== 'assetsTools') : [...prev, 'assetsTools'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Tools Section</span>
                                                    {expandedSections.includes('assetsTools') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('assetsTools') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Section Title</label>
                                                            <input type="text" value={content.assets.toolsTitle} onChange={(e) => setContent({ ...content, assets: { ...content.assets, toolsTitle: e.target.value } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* PRICING PAGE SECTIONS */}
                                    {selectedPage === 'pricing' && (
                                        <div className="space-y-4">
                                            {/* Page Header */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('pricingHeader') ? prev.filter(s => s !== 'pricingHeader') : [...prev, 'pricingHeader'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Page Header</span>
                                                    {expandedSections.includes('pricingHeader') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('pricingHeader') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Badge Text</label>
                                                            <input type="text" value={content.pricing.badge} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, badge: e.target.value } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Title</label>
                                                            <input type="text" value={content.pricing.title} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, title: e.target.value } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Subtitle</label>
                                                            <textarea value={content.pricing.subtitle} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, subtitle: e.target.value } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Footer Text</label>
                                                            <input type="text" value={content.pricing.footer} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, footer: e.target.value } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card 1 - Starter */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('pricingCard1') ? prev.filter(s => s !== 'pricingCard1') : [...prev, 'pricingCard1'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Card 1 - Starter</span>
                                                    {expandedSections.includes('pricingCard1') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('pricingCard1') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Name</label>
                                                                <input type="text" value={content.pricing.card1.name} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card1: { ...content.pricing.card1, name: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Button Text</label>
                                                                <input type="text" value={content.pricing.card1.button} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card1: { ...content.pricing.card1, button: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Description</label>
                                                            <input type="text" value={content.pricing.card1.description} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card1: { ...content.pricing.card1, description: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Price</label>
                                                                <input type="text" value={content.pricing.card1.price} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card1: { ...content.pricing.card1, price: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Period</label>
                                                                <input type="text" value={content.pricing.card1.period} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card1: { ...content.pricing.card1, period: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Features (comma-separated)</label>
                                                            <textarea value={content.pricing.card1.features} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card1: { ...content.pricing.card1, features: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" placeholder="Feature 1, Feature 2, Feature 3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card 2 - Growth (Featured) */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('pricingCard2') ? prev.filter(s => s !== 'pricingCard2') : [...prev, 'pricingCard2'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Card 2 - Growth (Featured)</span>
                                                    {expandedSections.includes('pricingCard2') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('pricingCard2') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Featured Badge</label>
                                                            <input type="text" value={content.pricing.card2.badge} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card2: { ...content.pricing.card2, badge: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Name</label>
                                                                <input type="text" value={content.pricing.card2.name} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card2: { ...content.pricing.card2, name: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Button Text</label>
                                                                <input type="text" value={content.pricing.card2.button} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card2: { ...content.pricing.card2, button: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Description</label>
                                                            <input type="text" value={content.pricing.card2.description} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card2: { ...content.pricing.card2, description: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Price</label>
                                                                <input type="text" value={content.pricing.card2.price} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card2: { ...content.pricing.card2, price: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Period</label>
                                                                <input type="text" value={content.pricing.card2.period} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card2: { ...content.pricing.card2, period: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Features (comma-separated)</label>
                                                            <textarea value={content.pricing.card2.features} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card2: { ...content.pricing.card2, features: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" placeholder="Feature 1, Feature 2, Feature 3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card 3 - Full Partner */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('pricingCard3') ? prev.filter(s => s !== 'pricingCard3') : [...prev, 'pricingCard3'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Card 3 - Full Partner</span>
                                                    {expandedSections.includes('pricingCard3') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('pricingCard3') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Name</label>
                                                                <input type="text" value={content.pricing.card3.name} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card3: { ...content.pricing.card3, name: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Button Text</label>
                                                                <input type="text" value={content.pricing.card3.button} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card3: { ...content.pricing.card3, button: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Description</label>
                                                            <input type="text" value={content.pricing.card3.description} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card3: { ...content.pricing.card3, description: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Price</label>
                                                                <input type="text" value={content.pricing.card3.price} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card3: { ...content.pricing.card3, price: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm text-gray-400 mb-1">Period</label>
                                                                <input type="text" value={content.pricing.card3.period} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card3: { ...content.pricing.card3, period: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Features (comma-separated)</label>
                                                            <textarea value={content.pricing.card3.features} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, card3: { ...content.pricing.card3, features: e.target.value } } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3 h-20" placeholder="Feature 1, Feature 2, Feature 3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* FOOTER PAGE SECTIONS */}
                                    {selectedPage === 'footer' && (
                                        <div className="space-y-4">
                                            {/* Copyright Section */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('footerCopyright') ? prev.filter(s => s !== 'footerCopyright') : [...prev, 'footerCopyright'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Copyright Text</span>
                                                    {expandedSections.includes('footerCopyright') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('footerCopyright') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Copyright Text</label>
                                                            <input type="text" value={content.footer.copyright} onChange={(e) => setContent({ ...content, footer: { ...content.footer, copyright: e.target.value } })} className="w-full bg-[#0a0a0a] border border-[#333] rounded p-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Footer Links Section */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('footerLinks') ? prev.filter(s => s !== 'footerLinks') : [...prev, 'footerLinks'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Footer Links</span>
                                                    {expandedSections.includes('footerLinks') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('footerLinks') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        {content.footer.links.map((link, index) => (
                                                            <div key={link.id} className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <span className="text-sm font-medium text-gray-300">Link {index + 1}</span>
                                                                    <button
                                                                        onClick={() => setContent({
                                                                            ...content,
                                                                            footer: {
                                                                                ...content.footer,
                                                                                links: content.footer.links.filter(l => l.id !== link.id)
                                                                            }
                                                                        })}
                                                                        className="text-red-500 hover:text-red-400"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm text-gray-400 mb-1">Label</label>
                                                                        <input
                                                                            type="text"
                                                                            value={link.label}
                                                                            onChange={(e) => setContent({
                                                                                ...content,
                                                                                footer: {
                                                                                    ...content.footer,
                                                                                    links: content.footer.links.map(l => l.id === link.id ? { ...l, label: e.target.value } : l)
                                                                                }
                                                                            })}
                                                                            className="w-full bg-[#070707] border border-[#444] rounded p-2"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm text-gray-400 mb-1">URL</label>
                                                                        <input
                                                                            type="text"
                                                                            value={link.url}
                                                                            onChange={(e) => setContent({
                                                                                ...content,
                                                                                footer: {
                                                                                    ...content.footer,
                                                                                    links: content.footer.links.map(l => l.id === link.id ? { ...l, url: e.target.value } : l)
                                                                                }
                                                                            })}
                                                                            className="w-full bg-[#070707] border border-[#444] rounded p-2"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => setContent({
                                                                ...content,
                                                                footer: {
                                                                    ...content.footer,
                                                                    links: [...content.footer.links, { id: Date.now().toString(), label: 'New Link', url: '#' }]
                                                                }
                                                            })}
                                                            className="flex items-center gap-2 text-[#9B5CFF] hover:text-[#8A4BEF]"
                                                        >
                                                            <Plus size={16} />
                                                            Add Link
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Social Links Section */}
                                            <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedSections(prev => prev.includes('footerSocials') ? prev.filter(s => s !== 'footerSocials') : [...prev, 'footerSocials'])}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition-colors"
                                                >
                                                    <span className="text-lg font-semibold">Social Links</span>
                                                    {expandedSections.includes('footerSocials') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                {expandedSections.includes('footerSocials') && (
                                                    <div className="p-4 pt-0 space-y-4 border-t border-[#222]">
                                                        {content.footer.socials.map((social, index) => (
                                                            <div key={social.id} className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <span className="text-sm font-medium text-gray-300">Social {index + 1}</span>
                                                                    <button
                                                                        onClick={() => setContent({
                                                                            ...content,
                                                                            footer: {
                                                                                ...content.footer,
                                                                                socials: content.footer.socials.filter(s => s.id !== social.id)
                                                                            }
                                                                        })}
                                                                        className="text-red-500 hover:text-red-400"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm text-gray-400 mb-1">Platform</label>
                                                                        <select
                                                                            value={social.platform}
                                                                            onChange={(e) => setContent({
                                                                                ...content,
                                                                                footer: {
                                                                                    ...content.footer,
                                                                                    socials: content.footer.socials.map(s => s.id === social.id ? { ...s, platform: e.target.value } : s)
                                                                                }
                                                                            })}
                                                                            className="w-full bg-[#070707] border border-[#444] rounded p-2"
                                                                        >
                                                                            <option value="instagram">Instagram</option>
                                                                            <option value="youtube">YouTube</option>
                                                                            <option value="linkedin">LinkedIn</option>
                                                                            <option value="tiktok">TikTok</option>
                                                                            <option value="twitter">Twitter / X</option>
                                                                            <option value="facebook">Facebook</option>
                                                                            <option value="github">GitHub</option>
                                                                            <option value="dribbble">Dribbble</option>
                                                                            <option value="behance">Behance</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm text-gray-400 mb-1">URL</label>
                                                                        <input
                                                                            type="text"
                                                                            value={social.url}
                                                                            onChange={(e) => setContent({
                                                                                ...content,
                                                                                footer: {
                                                                                    ...content.footer,
                                                                                    socials: content.footer.socials.map(s => s.id === social.id ? { ...s, url: e.target.value } : s)
                                                                                }
                                                                            })}
                                                                            className="w-full bg-[#070707] border border-[#444] rounded p-2"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => setContent({
                                                                ...content,
                                                                footer: {
                                                                    ...content.footer,
                                                                    socials: [...content.footer.socials, { id: Date.now().toString(), platform: 'instagram', url: '#' }]
                                                                }
                                                            })}
                                                            className="flex items-center gap-2 text-[#9B5CFF] hover:text-[#8A4BEF]"
                                                        >
                                                            <Plus size={16} />
                                                            Add Social Link
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* ============ MESSAGES TAB ============ */}
                    {activeTab === 'messages' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <Mail size={28} />
                                    Contact Form Submissions
                                </h2>
                                <button
                                    onClick={fetchContactSubmissions}
                                    disabled={submissionsLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#222] rounded-lg hover:bg-[#333] transition-colors"
                                >
                                    {submissionsLoading ? <Loader2 className="animate-spin" size={16} /> : <>Refresh</>}
                                </button>
                            </div>

                            {submissionsLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="animate-spin" size={32} />
                                </div>
                            ) : submissionsError && (
                                <div className="bg-red-900/20 border border-red-900/50 text-red-500 p-4 rounded-lg mb-6 text-center">
                                    <p className="font-bold">Error loading messages:</p>
                                    <p>{submissionsError}</p>
                                    <p className="text-sm mt-2 opacity-80">This usually happens if the Firestore index is missing. Check the console for a link to create the index.</p>
                                </div>
                            )}

                            {!submissionsError && contactSubmissions.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No messages yet.</p>
                                </div>
                            ) : (
                                <div className="bg-[#111] rounded-lg border border-[#222] overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-[#0a0a0a] border-b border-[#222]">
                                            <tr>
                                                <th className="text-left p-4 text-sm font-medium text-gray-400">Date</th>
                                                <th className="text-left p-4 text-sm font-medium text-gray-400">Name</th>
                                                <th className="text-left p-4 text-sm font-medium text-gray-400">Email</th>
                                                <th className="text-left p-4 text-sm font-medium text-gray-400">Message</th>
                                                <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                                                <th className="text-left p-4 text-sm font-medium text-gray-400">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contactSubmissions.map((submission) => (
                                                <React.Fragment key={submission.id}>
                                                    <tr className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors">
                                                        <td className="p-4 text-sm text-gray-300">
                                                            {submission.submittedAt?.toDate?.().toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }) || 'N/A'}
                                                        </td>
                                                        <td className="p-4 text-sm font-medium">{submission.name || 'N/A'}</td>
                                                        <td className="p-4 text-sm text-gray-300">
                                                            <a href={`mailto:${submission.email}`} className="hover:text-[#9B5CFF]">
                                                                {submission.email || 'N/A'}
                                                            </a>
                                                        </td>
                                                        <td className="p-4 text-sm text-gray-400 max-w-xs truncate">
                                                            {submission.message?.slice(0, 60) || 'No message'}{submission.message?.length > 60 ? '...' : ''}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${submission.status === 'sent'
                                                                ? 'bg-green-500/20 text-green-400'
                                                                : submission.status === 'skipped'
                                                                    ? 'bg-blue-500/20 text-blue-400'
                                                                    : submission.status === 'pending'
                                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                                        : 'bg-red-500/20 text-red-400'
                                                                }`}>
                                                                {submission.status === 'sent' ? 'Sent' : submission.status === 'skipped' ? 'Skipped' : submission.status === 'pending' ? 'Pending' : 'Failed'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 flex items-center gap-2">
                                                            <button
                                                                onClick={() => setExpandedSubmissionId(
                                                                    expandedSubmissionId === submission.id ? null : submission.id
                                                                )}
                                                                className="p-2 hover:bg-[#333] rounded transition-colors"
                                                                title="View Details"
                                                            >
                                                                {expandedSubmissionId === submission.id ? <EyeOff size={16} /> : <Eye size={16} />}
                                                            </button>
                                                            <button
                                                                onClick={() => deleteContactSubmission(submission.id)}
                                                                className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {expandedSubmissionId === submission.id && (
                                                        <tr className="bg-[#0a0a0a]">
                                                            <td colSpan={6} className="p-6">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    <div>
                                                                        <h4 className="text-sm font-medium text-gray-400 mb-2">Full Message</h4>
                                                                        <p className="text-sm whitespace-pre-wrap bg-[#111] p-4 rounded-lg border border-[#222]">
                                                                            {submission.message || 'No message provided'}
                                                                        </p>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        {submission.channel && (
                                                                            <div>
                                                                                <h4 className="text-sm font-medium text-gray-400 mb-1">Channel/Link</h4>
                                                                                <a href={submission.channel} target="_blank" rel="noopener noreferrer" className="text-[#9B5CFF] hover:underline text-sm break-all">
                                                                                    {submission.channel}
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                        {submission.vision && (
                                                                            <div>
                                                                                <h4 className="text-sm font-medium text-gray-400 mb-1">Vision</h4>
                                                                                <p className="text-sm">{submission.vision}</p>
                                                                            </div>
                                                                        )}
                                                                        {submission.selectedServices?.length > 0 && (
                                                                            <div>
                                                                                <h4 className="text-sm font-medium text-gray-400 mb-1">Services Requested</h4>
                                                                                <ul className="text-sm space-y-1">
                                                                                    {submission.selectedServices.map((service, i) => (
                                                                                        <li key={i} className="flex items-center gap-2">
                                                                                            <span className="w-1 h-1 bg-[#9B5CFF] rounded-full"></span>
                                                                                            {service}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                        <div>
                                                                            <h4 className="text-sm font-medium text-gray-400 mb-1">API Response</h4>
                                                                            <pre className="text-xs bg-[#111] p-3 rounded-lg border border-[#222] overflow-x-auto">
                                                                                {JSON.stringify(submission.apiResponse, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ============ ASSETS TAB ============ */}
                    {activeTab === 'assets' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <Package size={28} />
                                    Asset Management
                                </h2>
                                <div className="flex gap-3">
                                    <button
                                        onClick={downloadAssetsSampleExcel}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#222] rounded-lg hover:bg-[#333] transition-colors"
                                    >
                                        <FileSpreadsheet size={16} />
                                        Template
                                    </button>
                                    <label className="flex items-center gap-2 px-4 py-2 bg-[#222] rounded-lg hover:bg-[#333] transition-colors cursor-pointer">
                                        <Upload size={16} />
                                        Import
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleAssetExcelUpload}
                                            className="hidden"
                                        />
                                    </label>
                                    <button
                                        onClick={downloadAllAssetsExcel}
                                        disabled={assets.length === 0}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#222] rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50"
                                    >
                                        <Database size={16} />
                                        Export
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[#111] p-6 rounded-xl border border-[#222]">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    {assetEditingId ? <Edit2 size={20} /> : <Plus size={20} />}
                                    {assetEditingId ? 'Edit Asset' : 'Add New Asset'}
                                </h2>

                                <form onSubmit={handleAssetSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Title *</label>
                                            <input
                                                type="text"
                                                required
                                                value={assetFormData.title}
                                                onChange={e => setAssetFormData({ ...assetFormData, title: e.target.value })}
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Category *</label>
                                            <select
                                                value={assetFormData.category}
                                                onChange={e => setAssetFormData({ ...assetFormData, category: e.target.value as Asset['category'] })}
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            >
                                                <option value="free">Free</option>
                                                <option value="featured">Featured</option>
                                                <option value="premium">Premium</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Type (e.g., LUTs, SFX)</label>
                                            <input
                                                type="text"
                                                value={assetFormData.type}
                                                onChange={e => setAssetFormData({ ...assetFormData, type: e.target.value })}
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Price</label>
                                            <input
                                                type="text"
                                                value={assetFormData.price}
                                                onChange={e => setAssetFormData({ ...assetFormData, price: e.target.value })}
                                                placeholder="₹2,499"
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Image URL</label>
                                            <input
                                                type="text"
                                                value={assetFormData.imageUrl}
                                                onChange={e => setAssetFormData({ ...assetFormData, imageUrl: e.target.value })}
                                                placeholder="https://example.com/image.jpg"
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Download/Buy Link</label>
                                            <input
                                                type="text"
                                                value={assetFormData.downloadLink}
                                                onChange={e => setAssetFormData({ ...assetFormData, downloadLink: e.target.value })}
                                                placeholder="https://example.com/download"
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm text-gray-400 mb-1">Description</label>
                                            <textarea
                                                value={assetFormData.description}
                                                onChange={e => setAssetFormData({ ...assetFormData, description: e.target.value })}
                                                rows={3}
                                                placeholder="Brief description (optional)"
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Order</label>
                                            <input
                                                type="number"
                                                value={assetFormData.order}
                                                onChange={e => setAssetFormData({ ...assetFormData, order: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-[#070707] border border-[#333] rounded p-2 focus:border-[#9B5CFF] outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={assetsLoading}
                                            className="flex items-center gap-2 px-6 py-2 bg-[#9B5CFF] rounded-lg hover:bg-[#8A4BEF] transition-colors disabled:opacity-50"
                                        >
                                            {assetsLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                            {assetEditingId ? 'Update' : 'Add Asset'}
                                        </button>
                                        {assetEditingId && (
                                            <button
                                                type="button"
                                                onClick={resetAssetForm}
                                                className="flex items-center gap-2 px-6 py-2 bg-[#333] rounded-lg hover:bg-[#444] transition-colors"
                                            >
                                                <X size={16} />
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {assetsLoading && !assetEditingId ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="animate-spin" size={32} />
                                </div>
                            ) : (
                                <>
                                    {['featured', 'free', 'premium'].map(category => {
                                        const categoryAssets = assets.filter(a => a.category === category);
                                        if (categoryAssets.length === 0) return null;

                                        return (
                                            <div key={category} className="mb-8">
                                                <h3 className="text-xl font-bold mb-4 capitalize flex items-center gap-2">
                                                    {category === 'featured' && <Star size={20} className="text-yellow-500" />}
                                                    {category} Assets ({categoryAssets.length})
                                                </h3>
                                                <div className="grid gap-4">
                                                    {categoryAssets.map((asset) => (
                                                        <div
                                                            key={asset.id}
                                                            className="bg-[#111] p-5 rounded-xl border border-[#222] hover:border-[#333] transition-all"
                                                        >
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                                        <h4 className="font-semibold text-lg">{asset.title}</h4>
                                                                        {asset.price && (
                                                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                                                                                {asset.price}
                                                                            </span>
                                                                        )}
                                                                        {asset.type && (
                                                                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                                                                                {asset.type}
                                                                            </span>
                                                                        )}
                                                                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                                                                            Order: {asset.order}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-gray-400 text-sm mb-2">{asset.description}</p>
                                                                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                                                                        {asset.downloadLink && (
                                                                            <span>
                                                                                Link: <a href={asset.downloadLink} target="_blank" rel="noopener noreferrer" className="text-[#9B5CFF] hover:underline">
                                                                                    {asset.downloadLink.slice(0, 50)}...
                                                                                </a>
                                                                            </span>
                                                                        )}
                                                                        {asset.imageUrl && (
                                                                            <span>
                                                                                Image: <a href={asset.imageUrl} target="_blank" rel="noopener noreferrer" className="text-[#9B5CFF] hover:underline">
                                                                                    {asset.imageUrl.slice(0, 50)}...
                                                                                </a>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleAssetEdit(asset)}
                                                                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded transition-colors"
                                                                    >
                                                                        <Edit2 size={16} className="text-blue-400" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleAssetDelete(asset.id)}
                                                                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded transition-colors"
                                                                    >
                                                                        <Trash2 size={16} className="text-red-400" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {assetsError && (
                                        <div className="bg-red-900/20 border border-red-900/50 text-red-500 p-4 rounded-lg mb-6 text-center">
                                            <p className="font-bold">Error loading assets:</p>
                                            <p>{assetsError}</p>
                                            <p className="text-sm mt-2 opacity-80">This usually happens if the Firestore index is missing. Check the console for a link to create the index.</p>
                                        </div>
                                    )}

                                    {!assetsError && assets.length === 0 && (
                                        <div className="text-center py-12 text-gray-400">
                                            <Package size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>No assets found. Add your first asset above!</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ============ PURCHASES TAB ============ */}
                    {activeTab === 'purchases' && (
                        <PurchasesTab />
                    )}
                </div>
            </main>
        </div>
    );
};

export default Admin;
