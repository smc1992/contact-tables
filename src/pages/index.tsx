import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { FiSearch, FiCoffee, FiUsers, FiCalendar, FiMapPin, FiStar, FiInfo, FiHeart, FiGlobe, FiCheck, FiArrowRight, FiHelpCircle } from 'react-icons/fi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RestaurantCard from '../components/RestaurantCard';
import { restaurantApi } from '../utils/api';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

// Sprachvariationen für das Banner
const languageVariations = [
  { language: 'Deutsch', text: 'Wo Menschen gemeinsam essen' },
  { language: 'Englisch', text: 'Where people eat together' },
  { language: 'Französisch', text: 'Où les gens mangent ensemble' },
  { language: 'Spanisch', text: 'Donde la gente come junta' },
  { language: 'Portugiesisch', text: 'Onde as pessoas comem juntas' }
];

// Moderne Sprachanimations-Komponente für den Hero-Bereich
const LanguageSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % languageVariations.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);
  
  return (
    <motion.div 
      className="mb-12 py-6 px-8 backdrop-blur-xl bg-black/40 rounded-2xl shadow-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.6 }}
    >
      <div className="flex justify-center mb-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="bg-primary-500 p-3 rounded-full inline-flex shadow-lg relative"
        >
          <FiGlobe className="text-white text-2xl" />
        </motion.div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center py-2"
        >
          <span className="italic font-semibold text-white text-xl">»{languageVariations[currentIndex].text}«</span>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default function Home() {
  const router = useRouter();
  const { session, user, loading } = useAuth();
  const [popularRestaurants, setPopularRestaurants] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchCuisine, setSearchCuisine] = useState('');
  
  // Benutzerrolle bestimmen
  const userRole = user?.user_metadata?.role || 'GUEST';
  
  // Beliebte Restaurants beim Laden der Seite abrufen
  useEffect(() => {
    const fetchPopularRestaurants = async () => {
      try {
        setIsLoading(true);
        // Standardwerte für Berlin, falls keine Geolokalisierung verfügbar ist
        const defaultLatitude = 52.520008;
        const defaultLongitude = 13.404954;
        
        // Sicherstellen, dass die Parameter korrekt als Strings übergeben werden
        const response = await restaurantApi.search({
          searchTerm: 'restaurant', 
          latitude: defaultLatitude,
          longitude: defaultLongitude,
          sortBy: 'popularity',
          limit: 6
        });
        
        // Prüfen, ob die Antwort gültig ist und Restaurants enthält
        if (response && response.restaurants) {
          setPopularRestaurants(response.restaurants);
        } else {
          setPopularRestaurants([]);
        }
      } catch (error) {
        console.error('Fehler beim Laden beliebter Restaurants:', error);
        // Fallback: Leeres Array verwenden, wenn die API fehlschlägt
        setPopularRestaurants([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPopularRestaurants();
  }, []);

  // Suchfunktion
    const handleHomepageSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) {
      // The /restaurants page uses 'q' for a general text search (e.g., name, city)
      params.append('q', searchLocation);
    }
    if (searchCuisine && searchCuisine !== '') {
      params.append('cuisine', searchCuisine);
    }
    router.push(`/restaurants?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow">
      
      {/* Hero-Sektion mit verbessertem Design und Lesbarkeit */}
      <div className="relative overflow-hidden bg-black">
        {/* Hintergrundbild mit moderatem Overlay für bessere Lesbarkeit */}
        <div className="absolute inset-0 z-0 opacity-30">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2 }}
            src="/images/hero/menschen am restaranttisch.webp"
            alt="Menschen am Restauranttisch"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Haupttitel und Einleitung mit modernem Design */}
          <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="backdrop-blur-xl bg-black/40 px-12 pt-6 pb-12 rounded-3xl shadow-xl text-center"
              >

              
              <motion.h1 
                className="text-5xl md:text-7xl font-bold mb-8 text-white tracking-tight"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                CONTACT – TABLES
              </motion.h1>
              <motion.div 
                className="w-24 h-1 bg-primary-400 mx-auto mb-8"
                initial={{ width: 0 }}
                animate={{ width: 96 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              />
              <motion.h2 
                className="text-2xl md:text-4xl font-semibold text-white mb-8 tracking-wide"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                Alleine unterwegs – gemeinsam essen!
              </motion.h2>
              <motion.p 
                className="text-xl text-white mb-8 max-w-3xl mx-auto font-medium leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                Egal ob auf Reisen, neu in der Stadt oder im Alltag – finde bei uns unkompliziert Gesellschaft für ein gemeinsames Essen.
              </motion.p>
              <motion.p 
                className="text-2xl font-semibold text-primary-300 mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              >
                Willkommen bei contact-tables.org!
              </motion.p>
              
              {/* Sprachanimation im Hero-Bereich */}
              <LanguageSlider />
              
              {/* Vereinfachte Feature-Badges */}
              <div className="flex flex-row gap-8 mb-12 justify-center">
                <motion.div 
                  className="flex items-center backdrop-blur-xl bg-black/40 px-7 py-4 rounded-full shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="w-5 h-5 bg-primary-500 rounded-full mr-4"></div>
                  <span className="text-white font-medium text-lg">Offen</span>
                </motion.div>
                <motion.div 
                  className="flex items-center backdrop-blur-xl bg-black/40 px-7 py-4 rounded-full shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="w-5 h-5 bg-primary-500 rounded-full mr-4"></div>
                  <span className="text-white font-medium text-lg">Entspannt</span>
                </motion.div>
                <motion.div 
                  className="flex items-center backdrop-blur-xl bg-black/40 px-7 py-4 rounded-full shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <div className="w-5 h-5 bg-primary-500 rounded-full mr-4"></div>
                  <span className="text-white font-medium text-lg">Menschlich</span>
                </motion.div>
              </div>
              
              {/* Vereinfachte Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-8 justify-center mt-10">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/search')}
                  className="bg-primary-600 text-white font-medium py-4 px-10 rounded-full shadow-lg transition duration-300 flex items-center justify-center text-lg"
                >
                  <FiSearch className="mr-3 text-xl" /> Restaurant finden
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/tables/create')}
                  className="bg-white/10 backdrop-blur-md text-white font-medium py-4 px-10 rounded-full shadow-lg transition duration-300 flex items-center justify-center text-lg"
                >
                  <FiUsers className="mr-3 text-xl" /> Kontakttisch erstellen
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Wie es funktioniert Sektion */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Wie Contact Tables funktioniert</h2>
            <div className="w-24 h-1 bg-primary-400 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">In drei einfachen Schritten zu neuen Gesprächen und Bekanntschaften</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-lg text-center relative"
              whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiSearch className="text-primary-600 text-2xl" />
              </div>
              <div className="absolute -top-4 -right-4 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
              <h3 className="text-xl font-bold mb-4">Restaurant finden</h3>
              <p className="text-gray-600">Entdecke Restaurants mit offenen Tischen für spontane Begegnungen.</p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-lg text-center relative"
              whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCalendar className="text-primary-600 text-2xl" />
              </div>
              <div className="absolute -top-4 -right-4 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
              <h3 className="text-xl font-bold mb-4">Reservieren</h3>
              <p className="text-gray-600">Reserviere deinen Platz oder erstelle selbst einen neuen Kontakttisch, um andere einzuladen.</p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-lg text-center relative"
              whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiUsers className="text-primary-600 text-2xl" />
              </div>
              <div className="absolute -top-4 -right-4 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
              <h3 className="text-xl font-bold mb-4">Neue Leute kennenlernen</h3>
              <p className="text-gray-600">Triff neue Leute, genieße gutes Essen und erlebe inspirierende Gespräche.</p>
            </motion.div>
          </div>
          
          <div className="text-center mt-12">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary-600 text-white font-medium py-3 px-8 rounded-full shadow-md inline-flex items-center"
                onClick={() => router.push('/about')}
              >
                Mehr erfahren <FiArrowRight className="ml-2" />
              </motion.button>

              {/* Neuer FAQ Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary-500 text-white font-medium py-3 px-8 rounded-full shadow-md inline-flex items-center"
                onClick={() => router.push('/faq')}
              >
                FAQs <FiHelpCircle className="ml-2" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Verbesserte Suchsektion */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Finden Sie Ihren nächsten Kontakttisch</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Entdecken Sie Restaurants in Ihrer Nähe, die Contact Tables anbieten</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Standort</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMapPin className="text-gray-400" />
                    </div>
                                        <input 
                      type="text" 
                      placeholder="Stadt, Stadtteil oder PLZ" 
                      className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="text-gray-400" />
                    </div>
                    <input 
                      type="date" 
                      className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Küche</label>
                                    <select 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={searchCuisine}
                    onChange={(e) => setSearchCuisine(e.target.value)}
                  >
                    <option value="">Alle Küchen</option>
                    <option value="deutsch">Deutsch</option>
                    <option value="italienisch">Italienisch</option>
                    <option value="asiatisch">Asiatisch</option>
                    <option value="mediterran">Mediterran</option>
                    <option value="vegetarisch">Vegetarisch/Vegan</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gäste</label>
                  <select 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="1">1 Person</option>
                    <option value="2">2 Personen</option>
                    <option value="3">3 Personen</option>
                    <option value="4">4+ Personen</option>
                  </select>
                </div>
              </div>
              <div className="text-center mt-8">
                <button
                  onClick={handleHomepageSearch}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-12 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center w-full md:w-auto"
                >
                  <FiSearch className="mr-2" />
                  Restaurants suchen
                </button>
              </div>
              

            </div>
            
            <div className="mt-6 text-center text-gray-500 text-sm">
              <p>Bereits über 320 Restaurants in 15+ Städten verfügbar</p>
            </div>
          </div>
        </div>
      </div>
      

      

      
      {/* Beliebte Restaurants */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Beliebte Restaurants in Ihrer Nähe</h2>
              <p className="text-gray-600">Entdecken Sie Restaurants, die perfekt für neue Kontakte sind</p>
            </div>
            <Link href="/search" className="text-primary-600 hover:text-primary-800 font-medium hidden md:block">
              Alle anzeigen <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularRestaurants.length > 0 ? (
                popularRestaurants.slice(0, 3).map((restaurant: any) => (
                  <div key={restaurant.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="relative h-48">
                      <img 
                        src={restaurant.imageUrl || '/images/restaurant-placeholder.jpg'} 
                        alt={restaurant.name} 
                        className="w-full h-full object-cover"
                      />
                      {restaurant.rating && (
                        <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-sm font-medium flex items-center">
                          <FiStar className="text-yellow-500 mr-1" /> {restaurant.rating}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1 truncate">{restaurant.name}</h3>
                      <p className="text-gray-600 text-sm mb-2 flex items-center">
                        <FiMapPin className="mr-1" size={14} /> 
                        {restaurant.address ? restaurant.address.substring(0, 30) + (restaurant.address.length > 30 ? '...' : '') : 'Adresse nicht verfügbar'}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm text-gray-500">{restaurant.cuisine || 'Verschiedene Küche'}</span>
                        <button 
                          onClick={() => router.push(`/restaurants/${restaurant.id}`)}
                          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 bg-white rounded-xl p-8 text-center shadow-md">
                  <FiInfo className="text-gray-400 text-4xl mb-4 mx-auto" />
                  <p className="text-gray-500 mb-4">Keine Restaurants gefunden. Versuchen Sie es später erneut oder ändern Sie Ihre Suchkriterien.</p>
                  <button
                    onClick={() => router.push('/search')}
                    className="text-primary-600 hover:text-primary-800 font-medium"
                  >
                    Zur erweiterten Suche
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/search" className="text-primary-600 hover:text-primary-800 font-medium">
              Alle Restaurants anzeigen <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Vorteile-Sektion */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Warum Contact Tables?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Unsere Plattform verbindet Menschen mit ähnlichen Interessen bei gemeinsamen Mahlzeiten</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <FiUsers className="text-primary-600 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Neue Kontakte knüpfen</h3>
              <p className="text-gray-600">Lernen Sie interessante Menschen in einer entspannten Atmosphäre kennen und erweitern Sie Ihr Netzwerk.</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <FiCoffee className="text-primary-600 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Kulinarische Erlebnisse</h3>
              <p className="text-gray-600">Entdecken Sie ausgewählte Restaurants und genießen Sie besondere kulinarische Erlebnisse in guter Gesellschaft.</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <FiHeart className="text-primary-600 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Gemeinsame Interessen</h3>
              <p className="text-gray-600">Finden Sie Menschen mit ähnlichen Interessen und tauschen Sie sich über Ihre Leidenschaften aus.</p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Wie funktioniert's Sektion */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">So funktioniert Contact Tables</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">In nur wenigen Schritten zu neuen Bekanntschaften</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="bg-white p-6 rounded-lg shadow-md relative z-10">
                <div className="bg-primary-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-4 mx-auto">
                  1
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Restaurant finden</h3>
                <p className="text-gray-600 text-center">Suchen Sie nach Restaurants in Ihrer Nähe, die Contact Tables anbieten.</p>
              </div>
              <div className="hidden md:block absolute top-1/2 left-full w-16 h-1 bg-gray-200 -translate-y-1/2 -ml-8 z-0"></div>
            </div>
            
            <div className="relative">
              <div className="bg-white p-6 rounded-lg shadow-md relative z-10">
                <div className="bg-primary-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-4 mx-auto">
                  2
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Tisch auswählen</h3>
                <p className="text-gray-600 text-center">Wählen Sie einen Kontakttisch aus oder erstellen Sie einen neuen mit Ihren Interessen.</p>
              </div>
              <div className="hidden md:block absolute top-1/2 left-full w-16 h-1 bg-gray-200 -translate-y-1/2 -ml-8 z-0"></div>
            </div>
            
            <div className="relative">
              <div className="bg-white p-6 rounded-lg shadow-md relative z-10">
                <div className="bg-primary-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-4 mx-auto">
                  3
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Gemeinsam essen</h3>
                <p className="text-gray-600 text-center">Treffen Sie sich im Restaurant, lernen Sie neue Menschen kennen und genießen Sie Ihr Essen.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <Link href="/about"
              className="bg-white border border-primary-600 text-primary-600 hover:bg-primary-50 font-medium py-3 px-6 rounded-md transition duration-300 inline-block"
            >
              Mehr über uns erfahren
            </Link>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Was unsere Nutzer sagen</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Erfahrungen von Menschen, die über Contact Tables neue Bekanntschaften geschlossen haben</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                  <span className="text-primary-600 font-bold">LM</span>
                </div>
                <div>
                  <h4 className="font-bold">Laura Müller</h4>
                  <p className="text-sm text-gray-500">Berlin</p>
                </div>
              </div>
              <p className="text-gray-600 italic">"Durch Contact Tables habe ich nicht nur tolle Restaurants entdeckt, sondern auch Menschen kennengelernt, mit denen ich heute noch befreundet bin."</p>
              <div className="flex mt-4">
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                  <span className="text-primary-600 font-bold">TK</span>
                </div>
                <div>
                  <h4 className="font-bold">Thomas Krause</h4>
                  <p className="text-sm text-gray-500">München</p>
                </div>
              </div>
              <p className="text-gray-600 italic">"Als Neu-Münchner war es schwer, Anschluss zu finden. Contact Tables hat mir geholfen, schnell neue Leute kennenzulernen und mich in der Stadt heimisch zu fühlen."</p>
              <div className="flex mt-4">
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-gray-300" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                  <span className="text-primary-600 font-bold">SB</span>
                </div>
                <div>
                  <h4 className="font-bold">Sarah Becker</h4>
                  <p className="text-sm text-gray-500">Hamburg</p>
                </div>
              </div>
              <p className="text-gray-600 italic">"Die Kombination aus gutem Essen und interessanten Gesprächen ist einfach perfekt. Ich nutze Contact Tables regelmäßig, um meinen Horizont zu erweitern."</p>
              <div className="flex mt-4">
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
                <FiStar className="text-yellow-500" />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Statistik-Sektion */}
      <section className="py-16 bg-secondary-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary-800 mb-3">Contact Tables in Zahlen</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Unsere wachsende Community verbindet Menschen an Tischen in ganz Deutschland</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white p-8 rounded-xl shadow-md text-center"
            >
              <div className="text-4xl font-bold text-primary-600 mb-2">1.250+</div>
              <div className="text-gray-600">Aktive Nutzer</div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white p-8 rounded-xl shadow-md text-center"
            >
              <div className="text-4xl font-bold text-primary-600 mb-2">320+</div>
              <div className="text-gray-600">Teilnehmende Restaurants</div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-8 rounded-xl shadow-md text-center"
            >
              <div className="text-4xl font-bold text-primary-600 mb-2">4.800+</div>
              <div className="text-gray-600">Vermittelte Kontakttische</div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white p-8 rounded-xl shadow-md text-center"
            >
              <div className="text-4xl font-bold text-primary-600 mb-2">15+</div>
              <div className="text-gray-600">Städte in Deutschland</div>
            </motion.div>
          </div>
        </div>
      </section>
      

      {/* CTA-Sektion für Kunden */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Bereit, neue Kontakte zu knüpfen?</h2>
            <p className="text-xl opacity-90 mb-8">Registrieren Sie sich jetzt und entdecken Sie die Welt der Contact Tables</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/auth/register" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-4 px-8 rounded-lg transition duration-300 inline-block text-lg">
                Als Gast registrieren
              </Link>
              <Link href="/auth/login" className="bg-transparent border-2 border-white text-white hover:bg-primary-700 font-medium py-4 px-8 rounded-lg transition duration-300 inline-block text-lg">
                Als Gast anmelden
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Restaurant-Partner-Sektion */}
      <section className="py-16 bg-gray-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Für Restaurant-Partner</h2>
              <p className="text-lg opacity-90 mb-6">Sie sind Restaurantbesitzer und möchten Teil von Contact Tables werden? Melden Sie sich an oder erfahren Sie mehr über die Vorteile einer Partnerschaft.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/login" className="bg-primary-600 text-white hover:bg-primary-700 font-medium py-3 px-6 rounded-lg transition duration-300 inline-block">
                  Als Restaurant anmelden
                </Link>
                <Link href="/restaurant/partner-info" className="bg-transparent border border-white text-white hover:bg-gray-700 font-medium py-3 px-6 rounded-lg transition duration-300 inline-block">
                  Partner werden
                </Link>
              </div>
            </div>
            <div className="relative">
              <motion.img 
                src="/images/restaurant-partner.jpg" 
                alt="Restaurant Partner" 
                className="rounded-lg shadow-xl w-full" 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              />
              <div className="absolute -bottom-4 -right-4 bg-primary-600 text-white p-4 rounded-lg shadow-lg">
                <p className="font-bold">Über 320+ Partner-Restaurants</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
