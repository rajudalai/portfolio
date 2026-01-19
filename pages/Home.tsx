import React from 'react';
import { PageRoute, FeaturedProject } from '../types';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import OrbitalWorkflow from '../components/OrbitalWorkflow';
import ContactForm from '../components/ContactForm';
import LightRays from '../components/LightRays';
import { ArrowRight, Maximize2, X, Play, TrendingUp, Palette, Zap, Loader2, Quote } from 'lucide-react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { SEO } from '../components/SEO';

interface HomeProps {
  onNavigate: (page: PageRoute) => void;
  onScrollTo: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate, onScrollTo }) => {
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };


  // State for the active project modal
  const [selectedProject, setSelectedProject] = React.useState<{ type: string; src: string; category: string; title: string } | null>(null);

  // State for featured projects from Firebase
  const [featuredProjects, setFeaturedProjects] = React.useState<FeaturedProject[]>([]);
  const [featuredLoading, setFeaturedLoading] = React.useState(true);

  // State for editable content from Firebase
  interface SiteContent {
    home: {
      hero: { badge: string; title: string; subtitle: string; image: string; buttonPrimary: string; buttonSecondary: string; card1: { label: string; value: string; }; card2: { label: string; value: string; }; };
      stats: { stat1Value: string; stat1Label: string; stat2Value: string; stat2Label: string; stat3Value: string; stat3Label: string; };
      about: { title: string; subtitle: string; paragraph1: string; paragraph2: string; skills: string; image: string; yearsExperience: string; };
      portfolio: {
        tag: string; heading: string; impactTitle: string; impactDesc: string; buttonText: string;
        timeline: { item1Title: string; item1Desc: string; item2Title: string; item2Desc: string; item3Title: string; item3Desc: string; };
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
    work: { header: { title: string; subtitle: string; }; filters: { allLabel: string; emptyMessage: string; }; };
    contact: {
      header: { title: string; subtitle: string; };
      form: {
        nameLabel: string; namePlaceholder: string;
        emailLabel: string; emailPlaceholder: string;
        channelLabel: string; channelPlaceholder: string;
        visionLabel: string; servicesLabel: string;
        messageLabel: string; messagePlaceholder: string;
        submitButton: string; responseTime: string;
      };
      success: { title: string; message: string; backButton: string; };
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
      header: { title: 'My Work', subtitle: 'Browse through my portfolio of projects' },
      filters: { allLabel: 'All', emptyMessage: 'No projects found' }
    },
    contact: {
      header: { title: 'Work With Me', subtitle: 'Share a few details about your project, and I\'ll get back to you with ideas, options, and next steps.' },
      form: {
        nameLabel: 'Name', namePlaceholder: 'What should I call you?',
        emailLabel: 'Email', emailPlaceholder: 'your@email.com',
        channelLabel: 'Channel / Profile Link', channelPlaceholder: 'Paste your channel or profile link',
        visionLabel: 'What\'s your vision for this project?',
        servicesLabel: 'What type of services do you need?',
        messageLabel: 'Anything else I should know?',
        messagePlaceholder: 'Tell me about your content, goals, timeline, and what success looks like for you.',
        submitButton: 'Send Message',
        responseTime: 'I usually respond within 24–48 hours. No spam, no pressure.'
      },
      success: { title: 'Message Sent!', message: 'Thanks! I\'ve received your message and will get back to you soon.', backButton: 'Send another message' }
    }
  };
  const [content, setContent] = React.useState<SiteContent>(defaultContent);

  // Fetch featured projects and content from Firebase
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured projects
        const q = query(collection(db, 'featuredProjects'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        const data: FeaturedProject[] = querySnapshot.docs.map(docItem => ({
          id: docItem.id,
          ...docItem.data()
        } as FeaturedProject));
        setFeaturedProjects(data);

        // Fetch content
        const contentRef = doc(db, 'settings', 'content');
        const contentSnap = await getDoc(contentRef);
        if (contentSnap.exists()) {
          // Deep merge content with defaults
          const data = contentSnap.data();
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
            work: { ...defaultContent.work, ...data.work, header: { ...defaultContent.work.header, ...data.work?.header }, filters: { ...defaultContent.work.filters, ...data.work?.filters } },
            contact: { ...defaultContent.contact, ...data.contact, header: { ...defaultContent.contact.header, ...data.contact?.header }, form: { ...defaultContent.contact.form, ...data.contact?.form }, success: { ...defaultContent.contact.success, ...data.contact?.success } }
          });
        }
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setFeaturedLoading(false);
      }
    };

    fetchData();
  }, []);

  // Icon mapping for categories
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'branding': return <Palette size={14} />;
      case 'health': return <Zap size={14} />;
      case 'product': return <TrendingUp size={14} />;
      case 'motion': return <Play size={14} />;
      default: return <Palette size={14} />;
    }
  };

  // ... imports ...

  // ... inside Home component ...

  return (
    <div className="flex flex-col w-full">
      <SEO
        title="Home"
        description={content.home.hero.subtitle || "Cinematic video editing and visual storytelling portfolio."}
      />
      {/* 4.1 HERO SECTION - STATIC & EXACT REFERENCE */}
      <section className="relative min-h-screen flex items-center  overflow-hidden bg-[#070707] sm:pt-16 pt-10">

        {/* LIGHT RAYS BACKGROUND EFFECT */}
        <div className="absolute inset-0 z-0">


          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <LightRays
              raysOrigin="left"
              raysColor="#8A63F8"
              raysSpeed={1.5}
              lightSpread={0.8}
              rayLength={2}
              followMouse={true}
              mouseInfluence={0.1}
              noiseAmount={0.1}
              distortion={0.05}
              className="custom-rays"
            />
          </div>
        </div>

        {/* Top-right subtle purple ambient light */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#6A5AF9]/20 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2 z-0"
        />

        <div className="max-w-7xl mx-auto px-6 pt-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full z-10">

          {/* Left Side Content - Static */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-start text-left"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="inline-block px-4 py-2 rounded-full bg-[#0F0F0F] border border-white/5 mb-8">
              <span
                className="text-[10px] md:text-xs font-bold tracking-widest text-neon uppercase"
                dangerouslySetInnerHTML={{ __html: content.home.hero.badge }}
              />
            </motion.div>

            {/*   Heading */}
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6 text-white">
              {content.home.hero.title.split(' ').slice(0, 1).join(' ')} <br />
              {content.home.hero.title.split(' ').slice(1, 2).join(' ')} <br />
              {content.home.hero.title.split(' ').slice(2, 4).join(' ')} <br />
              {/* Shimmer animation for premium effect */}
              <span className="text-transparent bg-clip-text bg-text-gradient">{content.home.hero.title.split(' ').slice(4).join(' ') || 'Storytelling'}</span>
            </motion.h1>

            {/* Paragraph */}
            <motion.p
              variants={fadeInUp}
              className="text-gray-400 text-lg md:text-xl max-w-[500px] leading-relaxed mb-10"
              dangerouslySetInnerHTML={{ __html: content.home.hero.subtitle }}
            />

            {/* Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-row gap-4 mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('work')}
                className="px-8 py-3 bg-white text-black rounded-full font-bold transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:bg-btn-gradient hover:text-black hover:border-transparent"
                dangerouslySetInnerHTML={{ __html: content.home.hero.buttonPrimary }}
              />
              <motion.button
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onScrollTo('contact')}
                className="group px-8 py-3 bg-transparent border border-white/20 text-white rounded-full font-bold hover:border-purple-500 transition-colors flex items-center gap-2"
              >
                <span dangerouslySetInnerHTML={{ __html: content.home.hero.buttonSecondary }} />
                <ArrowRight size={18} />
              </motion.button>
            </motion.div>

            {/* Stats Row with Divider - Glass Cards */}
            <motion.div variants={fadeInUp} className="w-full border-t border-white/10 pt-8 flex flex-wrap gap-6">
              {[
                { value: content.home.stats.stat1Value, label: content.home.stats.stat1Label },
                { value: content.home.stats.stat2Value, label: content.home.stats.stat2Label },
                { value: content.home.stats.stat3Value, label: content.home.stats.stat3Label }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="glass-card px-5 py-3 rounded-xl cursor-default transition-all duration-100 hover:border-neon/30"
                >
                  <div className="text-2xl font-bold text-white" dangerouslySetInnerHTML={{ __html: stat.value }} />
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1" dangerouslySetInnerHTML={{ __html: stat.label }} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Static Visuals */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative h-[500px] w-full flex items-center justify-center lg:justify-end"
          >
            {/* Hero Image Replacement & Cards */}
            <motion.div
              className="relative z-10"
            >
              <img
                src={content.home.hero.image || "https://github.com/ayushkanha/task3/blob/main/portfolio%20image%202.png?raw=true"}
                alt="Hero Visual"
                className="w-[350px] h-[350px] md:w-[450px] md:h-[450px] object-cover rounded-3xl shadow-2xl "
              />
              {/* Subtle Glow - Purple */}
              <div className="absolute inset-0 bg-[#9B5CFF]/20 blur-[100px] -z-10 rounded-full opacity-40"></div>

              {/* Card 1: Retention Rate (Top Right) - Glassmorphism */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0, duration: 0.6, type: "spring" }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="absolute top-24 -right-16 md:top-24 md:-right-24 glass-card p-4 pr-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-4 z-20 cursor-default"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon/20 to-purple-500/20 flex items-center justify-center border border-neon/30">
                  <div className="w-2.5 h-2.5 rounded-full bg-neon shadow-[0_0_12px_rgba(155,92,255,0.8)] pulse-glow"></div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5" dangerouslySetInnerHTML={{ __html: content.home.hero.card1.label }} />
                  <div className="text-lg font-bold text-white" dangerouslySetInnerHTML={{ __html: content.home.hero.card1.value }} />
                </div>
              </motion.div>

              {/* Card 2: Total Views (Bottom Left) - Glassmorphism */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0, duration: 0.6, type: "spring" }}
                whileHover={{ scale: 1.05, y: 4 }}
                className="absolute bottom-8 -left-4 md:bottom-12 md:-left-12 glass-card p-4 pr-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-4 z-20 cursor-default"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]"></div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5" dangerouslySetInnerHTML={{ __html: content.home.hero.card2.label }} />
                  <div className="text-lg font-bold text-white" dangerouslySetInnerHTML={{ __html: content.home.hero.card2.value }} />
                </div>
              </motion.div>

            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="z-10 sm:py-24 fade-in fade-in-delay-4  pb-8 relative"
        style={{ opacity: 1, transform: 'translateY(0px)' }}>
        <div className="sm:px-6 lg:px-8 max-w-7xl mr-auto ml-auto pr-4 pl-4">
          <div className="text-center mb-12">
            <p className="uppercase text-xs font-medium text-zinc-500 tracking-wide" dangerouslySetInnerHTML={{ __html: content.home.brands.heading }} />
          </div>

          {/* Ticker Container */}
          <div className="overflow-hidden relative"
            style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
            {/* Gradient Overlays */}
            <div className="z-10 pointer-events-none bg-gradient-to-r from-black via-black/80 to-transparent w-20 absolute top-0 bottom-0 left-0"
              style={{ visibility: 'hidden' }}></div>


            {/* Animated Ticker */}
            <div className="ticker-track flex pt-2 pb-2 items-center">
              {/* First set of brands */}
              <div className="flex gap-16 shrink-0 gap-x-16 gap-y-16 items-center pr-16">
                {content.home.brands.items.map((brand, index) => (
                  <div key={`brand-1-${index}`} className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                    {brand.imageUrl ? (
                      <img src={brand.imageUrl} alt={brand.name} className="h-8 object-contain" />
                    ) : (
                      <span className={`text-lg tracking-tighter ${brand.fontClass || ''} ${index % 3 === 0 ? 'font-bold' : index % 3 === 1 ? 'font-semibold' : 'font-normal'}`}>{brand.name}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Duplicate set for seamless loop */}
              <div className="flex items-center gap-16 shrink-0 pr-16">
                {content.home.brands.items.map((brand, index) => (
                  <div key={`brand-2-${index}`} className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors duration-300">
                    {brand.imageUrl ? (
                      <img src={brand.imageUrl} alt={brand.name} className="h-8 object-contain" />
                    ) : (
                      <span className={`text-lg tracking-tighter ${brand.fontClass || ''} ${index % 3 === 0 ? 'font-bold' : index % 3 === 1 ? 'font-semibold' : 'font-normal'}`}>{brand.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style>
          {`
        @keyframes ticker {
            0% {
                transform: translateX(0);
            }

            100% {
                transform: translateX(-50%);
            }
        }

        .ticker-track {
            animation: ticker 40s linear infinite;
            width: max-content;
        }

        .ticker-track:hover {
            animation-play-state: paused;
        }
        `}
        </style>
      </section>
      {/* 4.2 ABOUT ME - BOX STYLE WITH IMAGE OVERFLOW */}
      <section id="about" className="py-24 bg-[#070707] relative overflow-visible pt-30">
        <div className="max-w-7xl mx-auto px-50 py-50 border border-white/5 rounded-3xl">
          {/* Main Container Box */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative bg-gradient-to-br from-[#0d0d0d] to-[#0a0a0a] rounded-3xl border border-white/5 overflow-visible min-h-[500px]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* Left Side - Image Container (Overflowing from bottom) */}
              <div className="relative hidden lg:block min-h-[500px]">
                {/* Image that overflows the container from bottom */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="absolute left-8 bottom-0 "
                >
                  <img
                    src="https://github.com/ayushkanha/task3/blob/main/my%20photo.png?raw=true"
                    alt="Raju Portrait"
                    className="h-[750px] w-auto object-cover object-top rounded-t-2xl"
                    style={{
                      maskImage: 'linear-gradient(to top, transparent 0%, black 8%, black 100%)',
                      WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 8%, black 100%)'
                    }}
                  />
                </motion.div>

                {/* Experience Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  className="absolute bottom-8 right-8 glass-card p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-10 cursor-default"
                >
                  <span className="block text-4xl font-bold shimmer-text">4+</span>
                  <span className="text-sm text-gray-400">Years Experience</span>
                </motion.div>
              </div>

              {/* Right Side - Text Content */}
              <div className="p-10 lg:p-16 flex flex-col justify-center">
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <h2 className="text-4xl font-bold mb-2" dangerouslySetInnerHTML={{ __html: content.home.about.title }} />
                  <h3 className="text-neon text-sm font-bold uppercase tracking-widest mb-6" dangerouslySetInnerHTML={{ __html: content.home.about.subtitle }} />
                </motion.div>

                {/* Description Paragraphs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="space-y-6 text-gray-400 leading-relaxed mb-10"
                >
                  <p dangerouslySetInnerHTML={{ __html: content.home.about.paragraph1 }} />
                  <p dangerouslySetInnerHTML={{ __html: content.home.about.paragraph2 }} />
                </motion.div>

                {/* Skill Tags */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-wrap gap-3"
                >
                  {content.home.about.skills.split(',').map((skill, index) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      whileHover={{
                        scale: 1.08,
                        y: -2,
                        boxShadow: "0 0 20px rgba(155, 92, 255, 0.3)"
                      }}
                      className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 hover:text-white hover:border-neon/50 hover:bg-neon/10 transition-all duration-300 cursor-default"
                      dangerouslySetInnerHTML={{ __html: skill }}
                    />
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Mobile Image (visible only on smaller screens) */}
            <div className="lg:hidden relative h-80 overflow-hidden rounded-t-3xl order-first">
              <img
                src="https://github.com/ayushkanha/task3/blob/main/my%20photo.png?raw=true"
                alt="Raju Portrait"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent"></div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-neon/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none"></div>
          </motion.div>
        </div>
      </section>

      {/* 4.3 RECENT SELECTED WORK (NEW GRID DESIGN) */}
      <section id="work" className="sm:p-8 rounded-3xl mt-4 pt-6 pr-6 pb-6 pl-6 w-full max-w-[88%] mx-auto relative overflow-hidden">


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 items-start relative z-10">
          {/* Left: Heading + Timeline */}
          <div className="flex flex-col justify-between min-h-full">
            <div className="">
              <span className="text-sm font-normal text-neutral-500 font-geist" dangerouslySetInnerHTML={{ __html: content.home.portfolio.tag }} />
              <h2
                className="text-4xl sm:text-5xl lg:text-6xl leading-[0.9] mt-2 tracking-tight font-medium  text-neutral-100 mb-8"
                dangerouslySetInnerHTML={{ __html: content.home.portfolio.heading }}
              />

              {/* Timeline List */}
              <div className="space-y-0 relative pl-2">

                {/* Item 1: Brand Identity (Green) */}
                <div className="relative pl-10 pb-8 group">
                  {/* Vertical Line */}
                  <div className="absolute left-[11px] top-6 bottom-0 w-px bg-neutral-800 group-last:hidden"></div>
                  {/* Icon/Dot */}
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border border-white/50 flex items-center justify-center bg-neutral-950 z-10 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  </div>
                  {/* Content */}
                  <div>
                    <h3 className="text-lg font-medium text-[#d0f5ff] mb-1 font-geist" dangerouslySetInnerHTML={{ __html: content.home.portfolio.timeline.item1Title }} />
                    <p className="text-neutral-500 text-sm font-geist" dangerouslySetInnerHTML={{ __html: content.home.portfolio.timeline.item1Desc }} />
                  </div>
                </div>

                {/* Item 2: Product Design (Blue) */}
                <div className="relative pl-10 pb-8 group">
                  <div className="absolute left-[11px] top-6 bottom-0 w-px bg-neutral-800"></div>
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border border-blue-500/50 flex items-center justify-center bg-neutral-950 z-10 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-blue-400 mb-1 font-geist" dangerouslySetInnerHTML={{ __html: content.home.portfolio.timeline.item2Title }} />
                    <p className="text-neutral-500 text-sm font-geist" dangerouslySetInnerHTML={{ __html: content.home.portfolio.timeline.item2Desc }} />
                  </div>
                </div>

                {/* Item 3: Web Development (Purple) */}
                <div className="relative pl-10 group">
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border border-purple-500/50 flex items-center justify-center bg-neutral-950 z-10 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '1s' }}></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-purple-400 mb-1 font-geist" dangerouslySetInnerHTML={{ __html: content.home.portfolio.timeline.item3Title }} />
                    <p className="text-neutral-500 text-sm font-geist" dangerouslySetInnerHTML={{ __html: content.home.portfolio.timeline.item3Desc }} />
                  </div>
                </div>

              </div>
            </div>

            <div className="w-full mt-6">
              <div className="">
                <h3 className="text-base font-medium tracking-tight font-geist text-neutral-100 mb-2" dangerouslySetInnerHTML={{ __html: content.home.portfolio.impactTitle }} />
                <p className="text-sm font-geist text-neutral-400 mb-6 max-w-md" dangerouslySetInnerHTML={{ __html: content.home.portfolio.impactDesc }} />
                <a
                  href="/work"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', '/work');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:bg-btn-gradient hover:text-black hover:border-transparent"
                >
                  <span dangerouslySetInnerHTML={{ __html: content.home.portfolio.buttonText }} />
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-black"></span>
                </a>
              </div>
            </div>
          </div>

          {/* Right: Project grid */}
          <div className="grid grid-cols-2 gap-4 relative">
            {featuredLoading ? (
              <div className="col-span-2 flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#9B5CFF]" size={32} />
              </div>
            ) : featuredProjects.length === 0 ? (
              <div className="col-span-2 flex items-center justify-center py-20 text-gray-500">
                No featured projects yet.
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {featuredProjects.filter((_, i) => i % 2 === 0).map((project) => (
                    <article key={project.id} className={`relative overflow-hidden ${project.aspect} border rounded-2xl border-neutral-800 group bg-neutral-900`}>
                      {project.type === 'video' ? (
                        <video
                          src={project.src}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <img
                          src={project.src}
                          alt={project.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                        />
                      )}

                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>



                      <div className="absolute top-3 right-3 z-10">
                        <span className="px-2 py-1 rounded-md backdrop-blur text-[11px] font-normal border font-geist bg-black/60 text-neutral-300 border-neutral-800">
                          {project.category}
                        </span>
                      </div>

                      {/* Maximize Button */}
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 z-20 hover:bg-white/20"
                        aria-label="View Full Screen"
                      >
                        <Maximize2 size={20} />
                      </button>


                    </article>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  {featuredProjects.filter((_, i) => i % 2 !== 0).map((project) => (
                    <article key={project.id} className={`relative overflow-hidden ${project.aspect} border rounded-2xl border-neutral-800 group bg-neutral-900`}>
                      {project.type === 'video' ? (
                        <video
                          src={project.src}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <img
                          src={project.src}
                          alt={project.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                        />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

                      <div className="absolute top-3 right-3 z-10">
                        <span className="px-2 py-1 rounded-md backdrop-blur text-[11px] font-normal border font-geist bg-black/60 text-neutral-300 border-neutral-800">
                          {project.category}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedProject(project)}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 z-20 hover:bg-white/20"
                        aria-label="View Full Screen"
                      >
                        <Maximize2 size={20} />
                      </button>


                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4.4 ORBITAL WORKFLOW */}
      <OrbitalWorkflow
        title={content.home.workflow.title}
        subtitle={content.home.workflow.subtitle}
        items={content.home.workflow.items}
      />

      {/* 4.5 TESTIMONIALS */}
      <section id="testimonials" className="py-24 relative">
        {/* Background Gradients */}
        <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 max-w-2xl mx-auto"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] tracking-widest font-bold text-neon mb-4">
              TESTIMONIALS
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 font-geist tracking-tight" dangerouslySetInnerHTML={{ __html: content.home.testimonials.title }} />
            <p className="text-gray-400 text-lg" dangerouslySetInnerHTML={{ __html: content.home.testimonials.subtitle }} />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {content.home.testimonials.items.map((testimonial, idx) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300 relative group shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              >
                <div className="absolute top-8 right-8 text-white/10 group-hover:text-white/15 transition-colors">
                  <Quote size={40} />
                </div>

                <div className="flex flex-col h-full justify-between gap-8">
                  <p className="text-lg text-gray-300 leading-relaxed font-geist relative z-10">
                    "<span dangerouslySetInnerHTML={{ __html: testimonial.quote }} />"
                  </p>
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover border border-[#333]"
                    />
                    <div>
                      <h4 className="font-bold text-white font-geist" dangerouslySetInnerHTML={{ __html: testimonial.name }} />
                      <p className="text-sm text-gray-500 font-geist" dangerouslySetInnerHTML={{ __html: testimonial.role }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.6 CONTACT FORM */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <ContactForm content={content.contact} />
      </motion.div>

      {/* Full Screen Project Modal */}
      <AnimatePresence>
        {selectedProject && (
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
                  {selectedProject.type === 'video' ? (
                    <video
                      src={selectedProject.src}
                      controls
                      autoPlay
                      loop
                      className="max-w-full max-h-[70vh] rounded-lg object-contain"
                    />
                  ) : (
                    <img
                      src={selectedProject.src}
                      alt={selectedProject.title}
                      className="max-w-full max-h-[70vh] rounded-lg object-contain"
                    />
                  )}
                </div>

                
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Home;