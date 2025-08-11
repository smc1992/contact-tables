import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const LaunchPopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Prüfen, ob das Popup in dieser Sitzung bereits geschlossen wurde
    const hasBeenClosed = sessionStorage.getItem('launchPopupClosed');
    if (!hasBeenClosed) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    // Popup für die aktuelle Sitzung als geschlossen markieren
    sessionStorage.setItem('launchPopupClosed', 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Popup schließen"
            >
              <FiX size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Bald geht's richtig los!</h2>
            <p className="text-gray-600 leading-relaxed">
              Der offizielle Launch von contact-tables ist im 
              <span className="font-semibold text-primary-600"> Oktober 2025</span>.
              <br />
              Du kannst dich aber schon jetzt registrieren und Teil unserer Community werden.
            </p>
            <div className="mt-6">
              <a 
                href="/auth/register" 
                className="bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors w-full sm:w-auto inline-block"
                onClick={handleClose}
              >
                Jetzt registrieren
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LaunchPopup;
