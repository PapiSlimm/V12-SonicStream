import { AnimatePresence } from 'motion/react';
import { AuthModal } from '../../features/auth/AuthModal';
import { useOverlayStore } from '../state/overlay.store';
import { useUIStore } from '../state/ui.store';

/**
 * GlobalUI manages centralized overlays, modals, and global UI elements.
 */
export function GlobalUI() {
  const { isAuthModalOpen: isLegacyAuthOpen, setAuthModalOpen: setLegacyAuthOpen } = useOverlayStore();
  const { isAuthModalOpen, setAuthModalOpen } = useUIStore();

  const isAnyAuthOpen = isLegacyAuthOpen || isAuthModalOpen;

  const handleClose = () => {
    setLegacyAuthOpen(false);
    setAuthModalOpen(false);
  };

  return (
    <AnimatePresence>
      {isAnyAuthOpen && (
        <AuthModal 
          isOpen={isAnyAuthOpen} 
          onClose={handleClose} 
        />
      )}
    </AnimatePresence>
  );
}
