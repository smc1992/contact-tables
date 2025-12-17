import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiMapPin, FiMail, FiPhone, FiMessageSquare, FiUser, FiInfo } from 'react-icons/fi';
import PageLayout from '../../components/PageLayout';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | 'success' | 'error'>(null);

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
    
    // Hier würde normalerweise ein API-Call erfolgen
    // Für Demo-Zwecke simulieren wir eine erfolgreiche Übermittlung
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      
      // Formular zurücksetzen
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general'
      });
      
      // Status nach 5 Sekunden zurücksetzen
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    }, 1500);
  };

  const contactTypes = [
    { id: 'general', label: 'Allgemeine Anfrage', icon: <FiInfo /> },
    { id: 'restaurant', label: 'Restaurant-Partnerschaft', icon: <FiMapPin /> },
    { id: 'support', label: 'Technischer Support', icon: <FiMessageSquare /> },
    { id: 'feedback', label: 'Feedback', icon: <FiMessageSquare /> },
  ];

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="bg-primary-800 text-white py-24 -mt-8 rounded-b-3xl">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Kontakt aufnehmen
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Hast du Fragen, Anregungen oder möchtest du mit deinem Restaurant teilnehmen?
              Wir freuen uns, von dir zu hören!
            </p>
          </motion.div>
        </div>
      </div>

      {/* Kontaktformular und Infos */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 gap-12">
              {/* Kontaktformular */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-3xl mx-auto"
              >
                <div className="bg-white rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold mb-6 text-secondary-800">Schreib uns eine Nachricht</h2>
                  
                  {submitStatus === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4"
                    >
                      Vielen Dank für deine Nachricht! Wir werden uns so schnell wie möglich bei dir melden.
                    </motion.div>
                  )}
                  
                  {submitStatus === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4"
                    >
                      Es gab ein Problem beim Senden deiner Nachricht. Bitte versuche es später noch einmal.
                    </motion.div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                      <label htmlFor="type" className="block text-gray-700 font-medium mb-2">
                        Art deiner Anfrage
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {contactTypes.map((type) => (
                          <div 
                            key={type.id}
                            onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                            className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center text-center transition-colors ${
                              formData.type === type.id 
                                ? 'border-primary-500 bg-primary-50 text-primary-700' 
                                : 'border-neutral-200 hover:border-primary-200 hover:bg-primary-50/30'
                            }`}
                          >
                            <div className={`p-2 rounded-full mb-2 ${
                              formData.type === type.id ? 'bg-primary-100' : 'bg-neutral-100'
                            }`}>
                              {type.icon}
                            </div>
                            <span className="text-sm">{type.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                          Dein Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiUser className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            placeholder="Dein Name"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                          Deine E-Mail
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiMail className="text-gray-400" />
                          </div>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            placeholder="deine@email.de"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">
                        Dein Betreff
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        placeholder="Worum geht es?"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="message" className="block text-gray-700 font-medium mb-2">
                        Deine Nachricht
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
                        placeholder="Wie können wir dir helfen?"
                      ></textarea>
                    </div>
                    
                    <div className="flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex items-center px-8 py-3 rounded-lg font-medium transition-colors ${
                          isSubmitting 
                            ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' 
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Wird gesendet...
                          </>
                        ) : (
                          <>
                            <FiSend className="mr-2" />
                            Nachricht senden
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      

    </PageLayout>
  );
}
