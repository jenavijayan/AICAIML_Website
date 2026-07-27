import { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CookieConsentProps {
  onOpenPrivacyPage: () => void;
}

export default function CookieConsent({ onOpenPrivacyPage }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem('aic-aiml-cookie-consent');
    if (!hasConsented) {
      // Small timeout to show it after page load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('aic-aiml-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('aic-aiml-cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          id="cookie-consent-banner"
          className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md bg-navy text-white rounded-xl shadow-2xl border border-white/10 p-5 z-40"
        >
          <div className="flex items-start gap-4">
            <div className="bg-gold/20 p-2.5 rounded-lg shrink-0 text-gold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-white">Cookie Consent Advisory</h4>
                <button 
                  onClick={() => setIsVisible(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                AICAIML uses cookies to optimize your browsing experience, analyze web traffic, and verify secure membership applications. By continuing, you agree to our 
                <button 
                  onClick={onOpenPrivacyPage}
                  className="text-gold underline ml-1 hover:text-[#B37612] inline font-semibold"
                >
                  Privacy Policy
                </button>.
              </p>
              <div className="flex gap-2.5 mt-4">
                <button
                  id="btn-cookies-accept"
                  onClick={handleAccept}
                  className="px-3.5 py-1.5 bg-gold hover:bg-[#B37612] text-white text-xs font-semibold rounded transition-colors"
                >
                  Accept All Cookies
                </button>
                <button
                  id="btn-cookies-decline"
                  onClick={handleDecline}
                  className="px-3 py-1.5 border border-white/20 hover:border-white/50 text-slate-300 hover:text-white text-xs font-semibold rounded transition-all"
                >
                  Reject Optional
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
