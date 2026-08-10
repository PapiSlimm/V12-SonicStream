import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, ExternalLink, Sparkles, BookOpen, Camera, Palette, Video, Megaphone, Share2, FileText, Info, Phone, HelpCircle, AlertTriangle, Upload, Cloud, HardDrive, Globe, User, LogOut, LogIn, Layout } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from './Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const services = [
    { name: 'Graphic Design Service', href: '#design', icon: <Palette size={16} /> },
    { name: 'Marketing Research Services', href: '#research', icon: <Megaphone size={16} /> },
    { name: 'Photography Services', href: '#photography', icon: <Camera size={16} /> },
    { name: 'Promotional Packages', href: '#promotional', icon: <Sparkles size={16} /> },
    { name: 'Video Editing', href: '#video', icon: <Video size={16} /> },
  ];

  const pages = [
    { name: 'Home', href: '/', icon: <Logo size="sm" /> },
    { name: 'About Us', href: '#about', icon: <Info size={16} /> },
    { name: 'Contact Us', href: '#contact', icon: <Phone size={16} /> },
    { name: 'Documentation', href: '#docs', icon: <BookOpen size={16} /> },
    { name: 'Pricing & Rates', href: '#pricing', icon: <ExternalLink size={16} /> },
    { name: 'Blog', href: '#blog', icon: <Share2 size={16} /> },
  ];

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-6',
          isScrolled ? 'bg-v12-gray-900/90 backdrop-blur-2xl border-b border-white/10 py-4' : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group cursor-pointer">
            <Logo size="sm" className="transition-transform duration-500 group-hover:rotate-12" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10">
            <div className="relative" onMouseEnter={() => setActiveDropdown('services')} onMouseLeave={() => setActiveDropdown(null)}>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-v12-gray-400 hover:text-v12-red transition-colors">
                Services <ChevronDown size={12} className={cn('transition-transform duration-300', activeDropdown === 'services' && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {activeDropdown === 'services' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-4 w-64 bg-v12-gray-900 border border-white/10 p-4 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="grid gap-2">
                      {services.map((service) => (
                        <a
                          key={service.name}
                          href={service.href}
                          className="flex items-center gap-3 p-3 text-[10px] font-bold uppercase tracking-widest text-v12-gray-400 hover:bg-v12-red hover:text-white transition-all group"
                        >
                          <span className="text-v12-red group-hover:text-white transition-colors">{service.icon}</span>
                          {service.name}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" onMouseEnter={() => setActiveDropdown('pages')} onMouseLeave={() => setActiveDropdown(null)}>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-v12-gray-400 hover:text-v12-red transition-colors">
                Pages <ChevronDown size={12} className={cn('transition-transform duration-300', activeDropdown === 'pages' && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {activeDropdown === 'pages' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-4 w-72 bg-v12-gray-900 border border-white/10 p-4 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="grid grid-cols-1 gap-2">
                      {pages.map((page) => (
                        <Link
                          key={page.name}
                          to={page.href}
                          className="flex items-center gap-3 p-3 text-[10px] font-bold uppercase tracking-widest text-v12-gray-400 hover:bg-v12-red hover:text-white transition-all group"
                        >
                          <span className="text-v12-red group-hover:text-white transition-colors">{page.icon}</span>
                          {page.name}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a href="#blog" className="text-[10px] font-black uppercase tracking-[0.3em] text-v12-gray-400 hover:text-v12-red transition-colors">Blog</a>
            
            <div className="h-4 w-[1px] bg-white/10 mx-2" />

            <Link to="/dashboard" className="text-[10px] font-black uppercase tracking-[0.3em] text-v12-red hover:text-white transition-colors flex items-center gap-2">
              <Layout size={14} /> Dashboard
            </Link>

            <div className="h-4 w-[1px] bg-white/10 mx-2" />

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-v12-red flex items-center justify-center text-white font-black text-xs">
                    {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white hidden lg:block">{user.name || user.email}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-v12-gray-400 hover:text-v12-red transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-v12-red hover:text-white transition-colors"
              >
                <LogIn size={14} /> Login
              </Link>
            )}

            <button className="btn btn-primary py-2 px-8 text-[10px] font-black uppercase tracking-widest">
              Contact Us
            </button>
          </div>

          {/* Mobile Toggle */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              className="text-white p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden absolute top-full left-0 right-0 bg-v12-gray-900 border-b border-white/10 overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-6">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-v12-red uppercase tracking-widest">Services</p>
                  <div className="grid gap-4 pl-4">
                    {services.map((service) => (
                      <a key={service.name} href={service.href} className="text-sm font-bold uppercase tracking-tighter text-v12-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                        {service.name}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-v12-red uppercase tracking-widest">Pages</p>
                  <div className="grid gap-4 pl-4">
                    {pages.map((page) => (
                      <Link key={page.name} to={page.href} className="text-sm font-bold uppercase tracking-tighter text-v12-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                        {page.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <Link to="/dashboard" className="text-sm font-black text-v12-red uppercase tracking-widest" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                <button className="btn btn-primary w-full py-4 uppercase font-black tracking-widest text-xs">Contact Us</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
