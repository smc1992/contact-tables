import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiCheck, FiInfo, FiAlertCircle, FiMapPin, FiPhone, FiMail, FiGlobe, FiClock, FiUsers, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link';
import PageLayout from '../../components/PageLayout';

export default function PartnerRequest() {
  const router = useRouter();
  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    restaurantName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Deutschland',
    phone: '',
    email: '',
    website: '',
    description: '',
    cuisine: '',
    capacity: '',
    openingHours: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    termsAccepted: false,
    dataPrivacyAccepted: false
  });

  // Form validation
  const validateStep = (step: number) => {
    setFormError('');
    
    if (step === 1) {
      if (!formData.restaurantName || !formData.address || !formData.city || !formData.postalCode) {
        setFormError('Bitte füllen Sie alle Pflichtfelder aus.');
        return false;
      }
    } else if (step === 2) {
      if (!formData.phone || !formData.email) {
        setFormError('Bitte geben Sie Kontaktdaten an.');
        return false;
      }
      
      // Einfache E-Mail-Validierung
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setFormError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        return false;
      }
    } else if (step === 3) {
      if (!formData.contactName || !formData.contactEmail) {
        setFormError('Bitte geben Sie Ihre Kontaktdaten an.');
        return false;
      }
      
      if (!formData.termsAccepted || !formData.dataPrivacyAccepted) {
        setFormError('Bitte akzeptieren Sie die Nutzungsbedingungen und Datenschutzrichtlinien.');
        return false;
      }
    }
    
    return true;
  };

  // Form navigation
  const nextStep = () => {
    if (validateStep(formStep)) {
      setFormStep(formStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setFormStep(formStep - 1);
    window.scrollTo(0, 0);
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    setFormError('');
    
    try {
      const response = await fetch('/api/restaurant/partner-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ein Fehler ist aufgetreten');
      }
      
      setFormSuccess(true);
      
      // Weiterleitung zur Erfolgsseite nach kurzer Verzögerung
      setTimeout(() => {
        router.push('/restaurant/registration-success');
      }, 2000);
      
    } catch (error) {
      console.error('Fehler beim Absenden:', error);
      setFormError(error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render form steps
  const renderFormStep = () => {
    switch (formStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Restaurantinformationen</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  id="restaurantName"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div className="col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  Stadt *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  PLZ *
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div className="col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung des Restaurants
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Kontakt- und Betriebsinformationen</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700 mb-1">
                  Küche / Spezialität
                </label>
                <input
                  type="text"
                  id="cuisine"
                  name="cuisine"
                  value={formData.cuisine}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Kapazität (Sitzplätze)
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="openingHours" className="block text-sm font-medium text-gray-700 mb-1">
                  Öffnungszeiten
                </label>
                <input
                  type="text"
                  id="openingHours"
                  name="openingHours"
                  value={formData.openingHours}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="z.B. Mo-Fr 11-22, Sa-So 12-23"
                />
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Ansprechpartner & Bestätigung</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name des Ansprechpartners *
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail des Ansprechpartners *
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon des Ansprechpartners
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="termsAccepted"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="mt-1 mr-3"
                  required
                />
                <label htmlFor="termsAccepted" className="text-sm text-gray-700">
                  Ich akzeptiere die <Link href="/terms" className="text-primary-600 hover:underline">Nutzungsbedingungen</Link> für Restaurant-Partner *
                </label>
              </div>
              
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="dataPrivacyAccepted"
                  name="dataPrivacyAccepted"
                  checked={formData.dataPrivacyAccepted}
                  onChange={handleChange}
                  className="mt-1 mr-3"
                  required
                />
                <label htmlFor="dataPrivacyAccepted" className="text-sm text-gray-700">
                  Ich habe die <Link href="/privacy" className="text-primary-600 hover:underline">Datenschutzrichtlinien</Link> gelesen und stimme der Verarbeitung meiner Daten zu *
                </label>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <PageLayout>
      <div className="bg-primary-50 py-12 -mt-8 rounded-b-3xl">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Werden Sie Contact Tables Partner
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Steigern Sie Ihre Gästezahlen und werden Sie Teil einer wachsenden Community, die Einsamkeit bekämpft und Menschen am Restauranttisch zusammenbringt.
              </p>
            </div>
            
            {/* Fortschrittsanzeige */}
            <div className="flex justify-between items-center mb-12 max-w-md mx-auto">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                      step < formStep ? 'bg-primary-600 text-white' : 
                      step === formStep ? 'bg-primary-500 text-white' : 
                      'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step < formStep ? <FiCheck /> : step}
                  </div>
                  <div className="text-xs mt-2 text-gray-500">
                    {step === 1 ? 'Restaurant' : step === 2 ? 'Kontakt' : 'Bestätigung'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {formSuccess ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheck className="text-green-600 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Anfrage erfolgreich gesendet!</h3>
                <p className="text-gray-600 mb-4">
                  Vielen Dank für Ihr Interesse an Contact Tables. Wir werden Ihre Anfrage prüfen und uns in Kürze bei Ihnen melden.
                </p>
                <p className="text-gray-500 text-sm">
                  Sie werden in wenigen Sekunden weitergeleitet...
                </p>
              </motion.div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8">
                {formError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
                    <FiAlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-red-700">{formError}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  {renderFormStep()}
                  
                  <div className="mt-8 flex justify-between">
                    {formStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={isSubmitting}
                      >
                        Zurück
                      </button>
                    )}
                    
                    {formStep < 3 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="ml-auto px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center"
                      >
                        Weiter <FiChevronRight className="ml-2" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="ml-auto px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Wird gesendet...' : 'Anfrage senden'}
                        {!isSubmitting && <FiChevronRight className="ml-2" />}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
            
            {/* Vorteile-Sektion */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Ihre Vorteile als Partner</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <FiUsers className="text-primary-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Mehr Gäste</h3>
                  <p className="text-gray-600">
                    Gewinnen Sie neue Kunden und füllen Sie leere Tische durch unsere wachsende Community.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <FiMapPin className="text-primary-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Lokale Sichtbarkeit</h3>
                  <p className="text-gray-600">
                    Erhöhen Sie Ihre Sichtbarkeit in der lokalen Community und werden Sie Teil einer sozialen Bewegung.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <FiHeart className="text-primary-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Soziales Engagement</h3>
                  <p className="text-gray-600">
                    Tragen Sie aktiv dazu bei, Einsamkeit zu bekämpfen und soziale Verbindungen zu fördern.
                  </p>
                </div>
              </div>
            </div>
            
            {/* FAQ-Sektion */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Häufig gestellte Fragen</h2>
              
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold mb-2">Wie funktioniert Contact Tables für Restaurants?</h3>
                  <p className="text-gray-600">
                    Als Partner-Restaurant stellen Sie Tische für Contact Tables zur Verfügung. Nutzer können diese Tische über unsere Plattform finden und sich anmelden. Die eigentliche Reservierung erfolgt direkt bei Ihnen.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold mb-2">Welche Kosten entstehen für mein Restaurant?</h3>
                  <p className="text-gray-600">
                    Wir bieten verschiedene Partnerschaftsmodelle an, die auf die Bedürfnisse Ihres Restaurants zugeschnitten sind. Nach der Genehmigung Ihrer Anfrage stellen wir Ihnen die Optionen vor.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold mb-2">Wie lange dauert der Anmeldeprozess?</h3>
                  <p className="text-gray-600">
                    Nach Eingang Ihrer Anfrage prüfen wir diese innerhalb von 2-3 Werktagen. Bei positiver Bewertung erhalten Sie einen Vertrag und können nach Unterzeichnung sofort starten.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <Link href="/faq" className="text-primary-600 hover:text-primary-700 font-medium">
                  Alle FAQs ansehen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
