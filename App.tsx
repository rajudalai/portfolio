import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import Home from './pages/Home';
import Work from './pages/Work';
import Pricing from './pages/Pricing';
import Assets from './pages/Assets';
import BoughtAccess from './pages/BoughtAccess';
import ReceiptDetail from './pages/ReceiptDetail';
import { PageRoute } from './types';

import Admin from './pages/Admin';

import { HelmetProvider } from 'react-helmet-async';

const App: React.FC = () => {
  // Simple state-based routing
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [receiptId, setReceiptId] = useState<string>('');

  // Handle browser navigation (back/forward buttons) using History API
  useEffect(() => {
    const getRouteFromPath = () => {
      const path = window.location.pathname.replace(/^\//, ''); // Remove leading slash

      // Handle parameterized routes like /receipt/RCP-20260105-ABC1
      if (path.startsWith('receipt/')) {
        const id = path.split('/')[1];
        if (id) {
          setCurrentPage('receipt');
          setReceiptId(id);
          return;
        }
      }

      // Handle simple routes
      if (['work', 'pricing', 'assets', 'bought-access', 'admin'].includes(path)) {
        setCurrentPage(path as PageRoute);
        setReceiptId(''); // Clear receipt ID when navigating away
      } else {
        // Default to home if no path, root path, or invalid route
        setCurrentPage('home');
        setReceiptId('');
      }
    };

    const handlePopState = () => {
      getRouteFromPath();
    };

    window.addEventListener('popstate', handlePopState);
    // Initial check on mount
    getRouteFromPath();

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (page: PageRoute) => {
    setCurrentPage(page);
    const newPath = page === 'home' ? '/' : `/${page}`;
    window.history.pushState({}, '', newPath);
    window.scrollTo(0, 0);
  };

  const handleScrollTo = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-[#070707] text-white selection:bg-[#9B5CFF] selection:text-white">
        {currentPage !== 'admin' && currentPage !== 'receipt' && (
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
          {currentPage === 'bought-access' && <BoughtAccess />}
          {currentPage === 'receipt' && <ReceiptDetail receiptId={receiptId} />}
          {currentPage === 'admin' && <Admin />}
        </main>

        {currentPage !== 'admin' && currentPage !== 'receipt' && (
          <>
            <Footer />
            <BackToTop />
          </>
        )}
      </div>
    </HelmetProvider>
  );
};

export default App;