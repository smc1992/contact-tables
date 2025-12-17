import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function KontaktPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);
    
    try {
      // Validierung auf Client-Seite
      if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        throw new Error('Bitte fülle alle Felder aus.');
      }
      
      // E-Mail-Format validieren
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Bitte gib eine gültige E-Mail-Adresse ein.');
      }
      
      // API-Call zum Senden der Nachricht
      await axios.post('/api/contact/send-message', formData);
      
      // Bei Erfolg
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error: any) {
      // Fehlerbehandlung
      const errorMessage = error.response?.data?.message || error.message || 'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.';
      setSubmitError(errorMessage);
      console.error('Kontaktformular-Fehler:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      
      <main className="flex-grow">
        {/* Hero-Bereich */}
        <section className="bg-gradient-to-b from-primary-500 to-primary-700 text-white py-20">
          <div className="container mx-auto px-4">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold mb-6 text-center"
            >
              Kontakt
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl max-w-3xl mx-auto text-center"
            >
              Haben Sie Fragen oder Anregungen? Wir freuen uns, von Ihnen zu hören!
            </motion.p>
          </div>
        </section>
        
        {/* Kontaktformular */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">Schreiben Sie uns</h2>
              
              {submitSuccess ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-green-100 border border-green-200 text-green-800 rounded-lg p-6 mb-6"
                >
                  <h3 className="text-xl font-semibold mb-2">Vielen Dank für Ihre Nachricht!</h3>
                  <p>Wir werden uns so schnell wie möglich bei Ihnen melden.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-secondary-700 mb-1">
                      Betreff
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="allgemein">Allgemeine Anfrage</option>
                      <option value="restaurant">Restaurant-Anmeldung</option>
                      <option value="support">Technischer Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Sonstiges</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-secondary-700 mb-1">
                      Nachricht
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    ></textarea>
                  </div>
                  
                  {submitError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 mb-6 bg-red-100 text-red-800 rounded-lg flex items-center"
                    >
                      <FiAlertCircle className="mr-2 flex-shrink-0" size={20} />
                      <span>{submitError}</span>
                    </motion.div>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 w-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span>Wird gesendet...</span>
                    ) : (
                      <>
                        <FiSend size={18} />
                        <span>Nachricht senden</span>
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
