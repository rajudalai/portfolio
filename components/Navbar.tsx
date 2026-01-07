import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { PageRoute, NavSettings } from '../types';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface NavbarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  onScrollTo: (sectionId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, onScrollTo }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSettings, setNavSettings] = useState<NavSettings>({
    showWork: true,
    showAbout: true,
    showAssets: true,
    showPricing: true,
    showContact: true
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    // Fetch nav settings
    const fetchNavSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'nav');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNavSettings(docSnap.data() as NavSettings);
        }
      } catch (error) {
        console.error("Error fetching nav settings:", error);
      }
    };
    fetchNavSettings();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (page: PageRoute | null, sectionId?: string) => {
    setMobileMenuOpen(false);

    if (page && page !== currentPage) {
      onNavigate(page);
      // If there's a section ID, we need to wait for the page to mount (handled in App parent usually, 
      // but simple timeout works for this interaction)
      if (sectionId) {
        setTimeout(() => onScrollTo(sectionId), 100);
      }
    } else if (sectionId) {
      // Same page
      if (currentPage !== 'home' && (sectionId === 'about' || sectionId === 'contact')) {
        onNavigate('home');
        setTimeout(() => onScrollTo(sectionId), 100);
      } else {
        onScrollTo(sectionId);
      }
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled
          ? 'bg-[#070707]/80 backdrop-blur-md border-white/10 py-4'
          : 'bg-transparent border-transparent py-6'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <div
          className="text-2xl font-bold tracking-tighter cursor-pointer group"
          onClick={() => handleNavClick('home')}
        >
          <span className="text-transparent bg-clip-text bg-text-gradient">RAJU </span> VISUALS<span className="text-neon group-hover:text-neon-hover transition-colors">.</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navSettings.showWork && (
            <button
              onClick={() => handleNavClick('work')}
              className={`text-sm font-medium transition-colors hover:text-neon ${currentPage === 'work' ? 'text-neon' : 'text-gray-300'}`}
            >
              Work
            </button>
          )}
          {navSettings.showAbout && (
            <button
              onClick={() => handleNavClick(null, 'about')}
              className="text-sm font-medium text-gray-300 transition-colors hover:text-neon"
            >
              About
            </button>
          )}
          {navSettings.showAssets && (
            <button
              onClick={() => handleNavClick('assets')}
              className={`text-sm font-medium transition-colors hover:text-neon ${currentPage === 'assets' ? 'text-neon' : 'text-gray-300'}`}
            >
              Assets
            </button>
          )}
          {navSettings.showPricing && (
            <button
              onClick={() => handleNavClick('pricing')}
              className={`text-sm font-medium transition-colors hover:text-neon ${currentPage === 'pricing' ? 'text-neon' : 'text-gray-300'}`}
            >
              Pricing
            </button>
          )}


          {/* Pill Button */}
          <button
            onClick={() => handleNavClick(null, 'contact')}
            className="ml-4 px-6 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-gray-200 hover:shadow-[0_0_15px_rgba(138,99,248,0.3)] transition-all transform hover:-translate-y-0.5"
          >
            Work With Me
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#070707] border-b border-white/10 p-6 flex flex-col gap-6 shadow-2xl">
          {navSettings.showWork && <button onClick={() => handleNavClick('work')} className="text-left text-lg font-medium text-gray-300 hover:text-neon">Work</button>}
          {navSettings.showAbout && <button onClick={() => handleNavClick(null, 'about')} className="text-left text-lg font-medium text-gray-300 hover:text-neon">About</button>}
          {navSettings.showAssets && <button onClick={() => handleNavClick('assets')} className="text-left text-lg font-medium text-gray-300 hover:text-neon">Assets</button>}
          {navSettings.showPricing && <button onClick={() => handleNavClick('pricing')} className="text-left text-lg font-medium text-gray-300 hover:text-neon">Pricing</button>}
          {navSettings.showContact && <button onClick={() => handleNavClick(null, 'contact')} className="text-left text-lg font-medium text-gray-300 hover:text-neon">Contact</button>}
          <button
            onClick={() => handleNavClick(null, 'contact')}
            className="w-full py-3 bg-white text-black rounded-full text-base font-bold text-center"
          >
            Work With Me
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;