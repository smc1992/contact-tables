import { useState, useEffect } from 'react';
import { FiX, FiMail, FiClock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailVerificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
}

const EmailVerificationPopup = ({ isOpen, onClose, email }: EmailVerificationPopupProps) => {
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
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Popup schließen"
            >
              <FiX size={24} />
            </button>
            
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FiMail size={32} className="text-blue-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Bitte bestätige deine E-Mail-Adresse</h2>
            
            <p className="text-gray-600 leading-relaxed mb-2">
              Wir haben eine Bestätigungs-E-Mail an <span className="font-semibold">{email}</span> gesendet.
            </p>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4 text-left">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FiClock className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Wichtig:</strong> Der Bestätigungslink ist nur <strong>1 Stunde</strong> gültig. Ohne Bestätigung kann deine Registrierung nicht abgeschlossen werden.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-gray-500 text-sm mt-4">
              Falls du keine E-Mail erhalten hast, überprüfe bitte deinen Spam-Ordner oder fordere eine neue Bestätigungs-E-Mail an.
            </p>
            
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <button 
                onClick={onClose}
                className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Schließen
              </button>
              <button 
                onClick={() => window.location.href = '/auth/resend-verification'}
                className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Neue E-Mail anfordern
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmailVerificationPopup;
