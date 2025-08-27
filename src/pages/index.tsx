import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { GetServerSideProps } from 'next';
import { PrismaClient } from '@prisma/client';
import { FiSearch, FiCoffee, FiUsers, FiCalendar, FiMapPin, FiStar, FiInfo, FiHeart, FiGlobe, FiCheck, FiArrowRight, FiHelpCircle } from 'react-icons/fi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RestaurantCard from '../components/RestaurantCard';
import { restaurantApi } from '../utils/api';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import LaunchPopup from '../components/LaunchPopup';
import SEO from '../components/SEO';

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
      className="mb-12 py-6 px-8 bg-white/60 rounded-2xl shadow-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.6 }}
    >
      <div className="flex justify-center mb-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="bg-white p-3 rounded-full inline-flex items-center justify-center shadow-lg relative w-16 h-16"
        >
          <img src="/images/Favicon Contact Tables.png" alt="contact-tables Favicon" className="w-8 h-8" />
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
          <span className="italic font-semibold text-gray-800 text-xl">»{languageVariations[currentIndex].text}«</span>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

const prisma = new PrismaClient();

export const getServerSideProps: GetServerSideProps = async (context) => {
  const fallbackValues = { memberCount: 15, restaurantCount: 5 };

  try {
    const memberCount = await prisma.profile.count({
      where: {
        role: 'CUSTOMER',
      },
    });

    const restaurantCount = await prisma.restaurant.count({
      where: {
        isVisible: true,
      },
    });

    return {
      props: {
        memberCount: memberCount > 0 ? memberCount : fallbackValues.memberCount,
        restaurantCount: restaurantCount > 0 ? restaurantCount : fallbackValues.restaurantCount,
      },
    };
  } catch (error) {
    console.error("Error fetching stats for homepage:", error);
    // Fallback values in case of a database error
    return {
      props: fallbackValues,
    };
  }
};

export default function Home({ memberCount, restaurantCount }: { memberCount: number, restaurantCount: number }) {
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
    <>
      <SEO 
        title="Contact Tables - Authentische Begegnungen am Restauranttisch" 
        description="Contact Tables verbindet Menschen anonym am Restauranttisch – für authentische Gespräche und neue Begegnungen in entspannter Atmosphäre."
        image="/images/og-image.jpg"
      />
      <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow">
      
      {/* Hero-Sektion mit hellem Design und Hintergrundbild */}
      <div className="relative overflow-hidden">
        {/* Hintergrundbild */}
        <div className="absolute inset-0 z-0">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2 }}
            src="/images/hero/menschen am restaranttisch.webp"
            alt="Menschen am Restauranttisch"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Heller Overlay für Lesbarkeit */}
        <div className="absolute inset-0 z-10 bg-white opacity-70"></div>

        <div className="container mx-auto px-4 relative z-20 pt-32 pb-20">
          {/* Haupttitel und Einleitung (mit dunklem Text) */}
          <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
              <motion.div 
                className="w-24 h-1 bg-primary-400 mx-auto mb-8"
                initial={{ width: 0 }}
                animate={{ width: 96 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              />
              <motion.h2 
                className="text-2xl md:text-4xl font-semibold text-gray-900 mb-8 tracking-wide"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                Alleine unterwegs – gemeinsam essen!
              </motion.h2>
              <motion.p 
                className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto font-bold leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                Egal ob auf Reisen, neu in der Stadt oder im Alltag – finde bei uns unkompliziert Gesellschaft für ein gemeinsames Essen.
              </motion.p>
              <motion.p 
                className="text-5xl md:text-6xl font-bold text-gray-900 mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              >
                <span className="block">Willkommen bei</span>
                <span className="block">contact-tables.org</span>
              </motion.p>
              
              {/* Sprachanimation im Hero-Bereich (angepasst für hellen Hintergrund) */}
              <LanguageSlider />
              
              {/* Vereinfachte Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-8 justify-center mt-10">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/restaurants')}
                  className="bg-primary-600 text-white font-medium py-4 px-10 rounded-full shadow-lg transition duration-300 flex items-center justify-center text-lg"
                >
                  <FiSearch className="mr-3 text-xl" /> Restaurant finden
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/contact-tables')}
                  className="bg-gray-200 text-gray-800 font-medium py-4 px-10 rounded-full shadow-lg transition duration-300 flex items-center justify-center text-lg"
                >
                  <FiUsers className="mr-3 text-xl" /> contact-table finden
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Vorteile-Sektion */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Warum contact-tables?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto" data-component-name="Home">Unsere Plattform verbindet Menschen – für echte Begegnungen<br />und inspirierende Gespräche.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
              <p className="text-gray-600">Lerne interessante Menschen in einer entspannten Atmosphäre kennen und erweitere dein Netzwerk.</p>
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
              <h3 className="text-lg font-bold text-gray-900 mb-2" data-component-name="Home">Genussvolle Momente teilen</h3>
              <p className="text-gray-600" data-component-name="Home">Entdecke gemütliche Restaurants und erlebe gute Gespräche und neue Verbindungen.</p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Wie es funktioniert Sektion */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-center text-secondary-800">Wie contact-tables funktioniert</h2>
            <div className="w-24 h-1 bg-primary-400 mx-auto mb-8"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">In drei einfachen Schritten zu neuen Gesprächen und Bekanntschaften</p>
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
              <p className="text-gray-600">Entdecke Restaurants mit contact-tables in deiner Stadt.</p>
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
              <p className="text-gray-600">Reserviere deinen Platz oder erstelle selbst einen neuen contact-table, um andere einzuladen.</p>
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
                Häufige Fragen <FiHelpCircle className="ml-2" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Verbesserte Suchsektion */}
      <div className="py-16 bg-gray-50 relative" style={{
        backgroundImage: 'url(/images/rustic-light-bulb-garden-lights-contact-tables.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">Finde deinen nächsten contact-table</h2>
              <p className="text-white max-w-2xl mx-auto drop-shadow-lg">Entdecke Restaurants in deiner Nähe, die contact-tables anbieten</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
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
            

          </div>
        </div>
      </div>

      
      {/* Statistik-Sektion */}
      <section className="py-16 bg-secondary-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">contact-tables in Zahlen</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Unsere wachsende Community verbindet dich mit Menschen an Tischen<br />in&nbsp;ganz&nbsp;Deutschland</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 justify-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.0 }}
              className="bg-white p-8 rounded-xl shadow-md text-center"
            >
              <div className="text-4xl font-bold text-primary-600 mb-2">{memberCount}+</div>
              <div className="text-gray-600">Aktive Mitglieder</div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white p-8 rounded-xl shadow-md text-center"
            >
              <div className="text-4xl font-bold text-primary-600 mb-2">{restaurantCount}+</div>
              <div className="text-gray-600">Teilnehmende Restaurants</div>
            </motion.div>
          </div>
        </div>
      </section>
      

      {/* CTA-Sektion für Kunden */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Bereit, neue Kontakte zu knüpfen?</h2>
          <p className="text-lg text-white mb-8 max-w-2xl mx-auto">Registriere dich jetzt und entdecke die Welt von contact-tables</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
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
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Für Restaurant-Partner</h2>
              <p className="text-base opacity-90 mb-6">Sie sind Restaurantbesitzer und möchten Teil von contact-tables werden? Melden Sie sich an oder erfahren Sie mehr über die Vorteile einer Partnerschaft.</p>
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
                src="/images/portrait-gastronom-contact-tables.webp" 
                alt="Ein Gastronom, Partner von contact-tables" 
                className="rounded-lg shadow-xl w-full" 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              />
              <div className="absolute -bottom-4 -right-4 bg-primary-600 text-white p-4 rounded-lg shadow-lg">
                <p className="font-bold">Platz für Ihren Tisch</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
    <LaunchPopup />
    </>
  );
}
