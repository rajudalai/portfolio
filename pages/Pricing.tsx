import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SEO } from '../components/SEO';

const Pricing: React.FC = () => {
  const [content, setContent] = useState({
    badge: 'Pricing',
    title: 'Flexible Packages for Serious Creators',
    subtitle: 'Whether you need a single impactful edit or a long-term content partner, I have a structure that scales with you.',
    footer: 'Need something custom? Reach out through the contact form and we\'ll tailor a package for you.',
    card1: {
      name: 'Starter',
      description: 'Perfect for getting started with quality.',
      price: '$500',
      period: '/mo',
      features: '4 YouTube Shorts / Reels,1 Long-form Video,Basic Color Grading,2 Revision Rounds',
      button: 'Get Started'
    },
    card2: {
      badge: 'Most Popular',
      name: 'Growth',
      description: 'Consistent content to build your audience.',
      price: '$1,200',
      period: '/mo',
      features: '8 YouTube Shorts / Reels,2 Long-form Videos,Advanced Motion Graphics,Custom Thumbnails included,Strategy Call',
      button: 'Choose Growth'
    },
    card3: {
      name: 'Full Partner',
      description: 'For aggressive scaling and brand building.',
      price: '$2,500',
      period: '/mo',
      features: '12 YouTube Shorts / Reels,4 Long-form Videos,Full Channel Branding,Priority Support,Unlimited Revisions',
      button: 'Let\'s Talk'
    }
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const contentRef = doc(db, 'settings', 'content');
        const contentSnap = await getDoc(contentRef);
        if (contentSnap.exists()) {
          const data = contentSnap.data();
          if (data.pricing) {
            setContent(prev => ({
              badge: data.pricing.badge || prev.badge,
              title: data.pricing.title || prev.title,
              subtitle: data.pricing.subtitle || prev.subtitle,
              footer: data.pricing.footer || prev.footer,
              card1: { ...prev.card1, ...data.pricing.card1 },
              card2: { ...prev.card2, ...data.pricing.card2 },
              card3: { ...prev.card3, ...data.pricing.card3 }
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching content:", error);
      }
    };
    fetchContent();
  }, []);

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.6,
        ease: "easeOut"
      }
    })
  };

  // Parse comma-separated features into array
  const parseFeatures = (features: string) => features.split(',').map(f => f.trim());

  return (
    <div className="pt-32 pb-24 min-h-screen bg-[#070707]">
      <SEO
        title="Pricing"
        description="Flexible packages for serious creators. Choose a plan that scales with you."
        url={window.location.href}
      />
      <div className="max-w-7xl mx-auto px-6">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <span className="text-neon text-sm font-bold tracking-widest uppercase mb-4 block">{content.badge}</span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{content.title}</h1>
          <p className="text-gray-400 text-lg">
            {content.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Card 1 */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ y: -10, borderColor: 'rgba(255, 255, 255, 0.3)' }}
            className="bg-dark-card border border-white/10 p-8 rounded-2xl transition-all"
          >
            <h3 className="text-xl font-bold text-white mb-2">{content.card1.name}</h3>
            <p className="text-gray-400 text-sm mb-6">{content.card1.description}</p>
            <div className="text-3xl font-bold text-white mb-8">{content.card1.price}<span className="text-sm font-normal text-gray-500">{content.card1.period}</span></div>

            <ul className="space-y-4 mb-8">
              {parseFeatures(content.card1.features).map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                  <Check size={16} className="text-neon" /> {feat}
                </li>
              ))}
            </ul>
            <button className="w-full py-3 border border-white/20 rounded-lg text-white font-bold hover:bg-white hover:text-black transition-all">
              {content.card1.button}
            </button>
          </motion.div>

          {/* Card 2 - Featured */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(138, 99, 248, 0.2)" }}
            className="bg-dark-surface border border-neon/50 p-8 rounded-2xl relative shadow-[0_0_30px_rgba(138,99,248,0.1)] transform md:-translate-y-4"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neon text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">{content.card2.badge}</div>
            <h3 className="text-xl font-bold text-white mb-2">{content.card2.name}</h3>
            <p className="text-gray-400 text-sm mb-6">{content.card2.description}</p>
            <div className="text-3xl font-bold text-white mb-8">{content.card2.price}<span className="text-sm font-normal text-gray-500">{content.card2.period}</span></div>

            <ul className="space-y-4 mb-8">
              {parseFeatures(content.card2.features).map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-white text-sm">
                  <div className="bg-neon/20 p-1 rounded-full"><Check size={12} className="text-neon" /></div> {feat}
                </li>
              ))}
            </ul>
            {/* Secondary Button Gradient applied */}
            <button className="w-full py-3 bg-btn-gradient text-white rounded-lg font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
              {content.card2.button}
            </button>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ y: -10, borderColor: 'rgba(255, 255, 255, 0.3)' }}
            className="bg-dark-card border border-white/10 p-8 rounded-2xl transition-all"
          >
            <h3 className="text-xl font-bold text-white mb-2">{content.card3.name}</h3>
            <p className="text-gray-400 text-sm mb-6">{content.card3.description}</p>
            <div className="text-3xl font-bold text-white mb-8">{content.card3.price}<span className="text-sm font-normal text-gray-500">{content.card3.period}</span></div>

            <ul className="space-y-4 mb-8">
              {parseFeatures(content.card3.features).map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                  <Check size={16} className="text-neon" /> {feat}
                </li>
              ))}
            </ul>
            <button className="w-full py-3 border border-white/20 rounded-lg text-white font-bold hover:bg-white hover:text-black transition-all">
              {content.card3.button}
            </button>
          </motion.div>

        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-center mt-16 text-gray-500 text-sm"
        >
          <p>{content.footer}</p>
        </motion.div>

      </div>
    </div>
  );
};

export default Pricing;