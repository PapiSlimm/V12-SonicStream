import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MAIN_NAV_ITEMS, 
  SECONDARY_NAV_ITEMS, 
  FEATURE_NAV_ITEMS, 
  ADMIN_NAV_ITEMS,
  FOOTER_NAV_ITEMS 
} from '../../config/nav.config';
import { useLayoutStore } from '../state/layout.store';
import { useAuth } from '../../context/AuthContext';
import { hasAccess, FeatureKey } from '../../config/featureFlags';
import { cn } from '../../utils/cn';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useLayoutStore();
  const { user, logout } = useAuth();

  const NavLink = ({ item }: { item: any }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    if (item.feature && !hasAccess(user, item.feature as FeatureKey)) {
      return null;
    }

    return (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group relative",
          isActive 
            ? "bg-zinc-700 text-white font-bold shadow-lg shadow-black/20" 
            : "text-zinc-400 hover:text-white hover:bg-white/5"
        )}
      >
        <Icon size={20} className={cn("shrink-0", isActive ? "text-black" : "group-hover:scale-110 transition-transform")} />
        {sidebarOpen && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm truncate"
          >
            {item.label}
          </motion.span>
        )}
        {isActive && (
          <motion.div 
            layoutId="active-pill"
            className="absolute left-0 w-1 h-6 bg-black rounded-r-full"
          />
        )}
      </Link>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 280 : 88 }}
      className="h-screen sticky top-0 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col z-50"
    >
      {/* Logo Section */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-zinc-700 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-lg shadow-black/20">
            S
          </div>
          {sidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-black uppercase tracking-tighter text-xl text-white truncate"
            >
              SonicStream
            </motion.span>
          )}
        </div>
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-4 space-y-8 py-4 scrollbar-hide">
        <div className="space-y-1">
          {MAIN_NAV_ITEMS.map(item => <NavLink key={item.id} item={item} />)}
        </div>

        <div>
          {sidebarOpen && (
            <p className="px-4 mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">Your Music</p>
          )}
          <div className="space-y-1">
            {SECONDARY_NAV_ITEMS.map(item => <NavLink key={item.id} item={item} />)}
          </div>
        </div>

        <div>
          {sidebarOpen && (
            <p className="px-4 mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">Features</p>
          )}
          <div className="space-y-1">
            {FEATURE_NAV_ITEMS.map(item => <NavLink key={item.id} item={item} />)}
          </div>
        </div>

        {user?.userType === 'admin' && (
          <div>
            {sidebarOpen && (
              <p className="px-4 mb-2 text-[10px] font-black uppercase tracking-widest text-red-500/60">Admin</p>
            )}
            <div className="space-y-1">
              {ADMIN_NAV_ITEMS.map(item => <NavLink key={item.id} item={item} />)}
            </div>
          </div>
        )}
      </div>

      {/* Footer / User Section */}
      <div className="p-4 border-t border-white/5 space-y-4">
        <div className="space-y-1">
          {FOOTER_NAV_ITEMS.map(item => <NavLink key={item.id} item={item} />)}
        </div>

        {user && (
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-all group"
          >
            <LogOut size={20} className="shrink-0 group-hover:rotate-12 transition-transform" />
            {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        )}
      </div>
    </motion.aside>
  );
};
