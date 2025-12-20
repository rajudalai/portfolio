import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import Home from './pages/Home';
import Work from './pages/Work';
import Pricing from './pages/Pricing';
import Assets from './pages/Assets';
import { PageRoute } from './types';

import Admin from './pages/Admin';

const App: React.FC = () => {
  // Simple state-based routing
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');

  // Handle Hash change for simple routing if user manually changes URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['home', 'work', 'pricing', 'assets', 'admin'].includes(hash)) {
        setCurrentPage(hash as PageRoute);
      } else {
        // Default to home if no hash or invalid
        if (!hash) setCurrentPage('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page: PageRoute) => {
    setCurrentPage(page);
    window.location.hash = page === 'home' ? '' : page;
    window.scrollTo(0, 0);
  };

  const handleScrollTo = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white selection:bg-[#9B5CFF] selection:text-white">
      {currentPage !== 'admin' && (
        <Navbar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onScrollTo={handleScrollTo}
        />
      )}

      <main>
        {currentPage === 'home' && <Home onNavigate={handleNavigate} onScrollTo={handleScrollTo} />}
        {currentPage === 'work' && <Work />}
        {currentPage === 'pricing' && <Pricing />}
        {currentPage === 'assets' && <Assets />}
        {currentPage === 'admin' && <Admin />}
      </main>

      {currentPage !== 'admin' && (
        <>
          <Footer />
          <BackToTop />
        </>
      )}
    </div>
  );
};

export default App;