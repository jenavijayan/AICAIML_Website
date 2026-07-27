import { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronRight, Award, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui';
import logo from '../images/logo-web.png';

interface HeaderProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export default function Header({ currentPage, setCurrentPage }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Escape closes the mobile drawer and returns focus to the toggle button —
  // previously the only way to close it was re-tapping the hamburger or
  // navigating away.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        mobileToggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'know-aicaiml', label: 'About' },
    { id: 'courses', label: 'Courses' },
    { id: 'learners', label: 'Community' },
    { id: 'events-projects', label: 'Events' },
    { id: 'membership', label: 'Membership' },
    { id: 'contact', label: 'Contact' },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin' }] : []),
    ...(user ? [] : [{ id: 'login', label: 'Login' }])
  ];

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      id="global-header"
      className={`sticky top-0 z-50 w-full border-b border-slate-200 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md py-1.5 shadow-lg'
          : 'bg-white py-2 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo Brand Section */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img src={logo} alt="AICAIML Logo" width={48} height={48} className="w-12 h-12 object-contain" />
            <div>
              <span className="text-xl font-bold tracking-wider text-navy font-heading text-gradient-animate">
                AICAIML
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.id || 
                (item.id === 'membership' && currentPage.startsWith('membership-form'));
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 text-navy ${
                    isActive
                      ? 'bg-navy/8'
                      : 'hover:bg-navy/5'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Call-to-Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-navy/5 rounded-md text-xs font-semibold text-navy">
                  <User className="w-3.5 h-3.5" />
                  <span>{user.name}</span>
                  <span className="uppercase text-[10px] text-corp-blue bg-white px-1.5 py-0.5 rounded-full border border-corp-blue/20">{user.role}</span>
                </div>
                <Button id="header-btn-logout" onClick={logout} variant="outline" size="sm" icon={LogOut}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button id="header-btn-join" onClick={() => handleNavClick('membership')} variant="accent" icon={Award}>
                Join Network
              </Button>
            )}
          </div>

          {/* Mobile Hamburguer Toggle Button */}
          <div className="flex lg:hidden">
            <button
              ref={mobileToggleRef}
              id="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-navy hover:bg-navy/5 transition-colors focus:outline-none"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu-panel"
            >
              <span className="sr-only">{isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}</span>
              {isMobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            id="mobile-menu-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-slate-200 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                const isActive = currentPage === item.id ||
                  (item.id === 'membership' && currentPage.startsWith('membership-form'));
                return (
                  <button
                    key={item.id}
                    id={`mobile-nav-link-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex w-full items-center justify-between px-3 py-3 rounded-md text-base font-medium transition-colors text-navy ${
                      isActive
                        ? 'bg-navy/8'
                        : 'hover:bg-navy/5'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-navy/30" aria-hidden="true" />
                  </button>
                );
              })}

              {user && (
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 mt-2 bg-navy/5 rounded-md text-xs font-semibold text-navy">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {user.name} · <span className="uppercase text-corp-blue">{user.role}</span>
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-4 px-3 border-t border-slate-200">
                {user ? (
                  <Button
                    id="mobile-btn-logout"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    variant="outline"
                    icon={LogOut}
                    className="justify-center"
                  >
                    Logout
                  </Button>
                ) : (
                  <Button id="mobile-btn-join" onClick={() => handleNavClick('membership')} variant="accent" icon={Award} className="justify-center">
                    Join Network
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
