import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { requireAuth } from '../../utils/serverSideAuth';
import { motion } from 'framer-motion';
import { FiCalendar, FiUsers, FiMapPin, FiClock, FiSearch, FiMessageCircle } from 'react-icons/fi';
import PageLayout from '../../components/PageLayout';
import { contactApi, restaurantApi } from '../../utils/api';

// Typdefinitionen
interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  imageUrl?: string;
}

export default function CreateContactTable() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    partySize: '4',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Suche nach Restaurants
  const searchRestaurants = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setIsSearching(true);
      const response = await restaurantApi.search({ searchTerm });
      setSearchResults(response.restaurants || []);
    } catch (error) {
      console.error('Fehler bei der Restaurantsuche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Restaurant auswählen
  const selectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setSearchResults([]);
    setSearchTerm('');
  };

  // Formular-Änderungen verarbeiten
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Fehler zurücksetzen, wenn Feld bearbeitet wird
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  // Formular validieren
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedRestaurant) {
      newErrors.restaurant = 'Bitte wähle ein Restaurant aus';
    }
    
    if (!formData.date) {
      newErrors.date = 'Bitte wähle ein Datum aus';
    } else {
      const selectedDate = new Date(`${formData.date}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'Das Datum darf nicht in der Vergangenheit liegen';
      }
    }
    
    if (!formData.time) {
      newErrors.time = 'Bitte wähle eine Uhrzeit aus';
    }
    
    if (!formData.partySize) {
      newErrors.partySize = 'Bitte gib die Anzahl der Personen an';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Kontakttisch erstellen
  const createContactTable = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      const response = await contactApi.createRequest({
        restaurantId: selectedRestaurant!.id,
        date: formData.date,
        time: formData.time,
        partySize: parseInt(formData.partySize),
        message: formData.message,
      });
      
      // Zur Detailseite des erstellten Kontakttisches navigieren
      router.push(`/contact-tables/${response.contactRequest.id}`);
    } catch (error) {
      console.error('Fehler beim Erstellen des Kontakttisches:', error);
      setErrors({
        submit: 'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
      });
      setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="bg-secondary-600 text-white py-16 -mt-8 rounded-b-3xl relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Kontakttisch erstellen</h1>
            <p className="text-xl max-w-2xl mx-auto">
              Erstelle einen Kontakttisch und lade andere ein, mit dir gemeinsam zu essen und neue Kontakte zu knüpfen.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Formular */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-md p-6 max-w-3xl mx-auto"
        >
          <form onSubmit={createContactTable}>
            {/* Restaurant-Auswahl */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-secondary-600 mb-4">1. Restaurant auswählen</h2>
              
              {selectedRestaurant ? (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-700">{selectedRestaurant.name}</h3>
                      <p className="text-gray-600">{selectedRestaurant.address}</p>
                      <p className="text-gray-600">{selectedRestaurant.postalCode} {selectedRestaurant.city}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRestaurant(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Ändern
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative mb-4">
                    <div className="flex">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Restaurant suchen..."
                        className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <button
                        type="button"
                        onClick={searchRestaurants}
                        disabled={isSearching || !searchTerm.trim()}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-r-md transition-colors disabled:bg-gray-400"
                      >
                        {isSearching ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <FiSearch />
                        )}
                      </button>
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                        <ul>
                          {searchResults.map((restaurant) => (
                            <li 
                              key={restaurant.id}
                              onClick={() => selectRestaurant(restaurant)}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="font-semibold">{restaurant.name}</div>
                              <div className="text-sm text-gray-600">{restaurant.address}, {restaurant.city}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {errors.restaurant && (
                    <p className="text-red-500 text-sm mt-1">{errors.restaurant}</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Datum und Uhrzeit */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-secondary-600 mb-4">2. Datum und Uhrzeit</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Datum
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  {errors.date && (
                    <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                    Uhrzeit
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiClock className="text-gray-400" />
                    </div>
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  {errors.time && (
                    <p className="text-red-500 text-sm mt-1">{errors.time}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Teilnehmeranzahl */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-secondary-600 mb-4">3. Teilnehmeranzahl</h2>
              
              <div>
                <label htmlFor="partySize" className="block text-sm font-medium text-gray-700 mb-1">
                  Wie viele Personen insgesamt (dich eingeschlossen)?
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUsers className="text-gray-400" />
                  </div>
                  <select
                    id="partySize"
                    name="partySize"
                    value={formData.partySize}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="2">2 Personen</option>
                    <option value="3">3 Personen</option>
                    <option value="4">4 Personen</option>
                    <option value="5">5 Personen</option>
                    <option value="6">6 Personen</option>
                    <option value="7">7 Personen</option>
                    <option value="8">8 Personen</option>
                  </select>
                </div>
                {errors.partySize && (
                  <p className="text-red-500 text-sm mt-1">{errors.partySize}</p>
                )}
              </div>
            </div>
            
            {/* Nachricht */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-secondary-600 mb-4">4. Zusätzliche Informationen</h2>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Nachricht für potenzielle Teilnehmer (optional)
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3">
                    <FiMessageCircle className="text-gray-400" />
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Stell dich kurz vor oder teile mit, worauf du dich freust..."
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Hinweis */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-blue-700 text-sm">
                <strong>Wichtiger Hinweis:</strong> Contact Tables ist eine Vermittlungsplattform. Bitte reserviere deinen Platz 
                direkt beim Restaurant, nachdem du den Kontakttisch erstellt hast.
              </p>
            </div>
            
            {/* Submit-Button */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => router.push('/contact-tables')}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg transition-colors disabled:bg-gray-400"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Wird erstellt...</span>
                  </div>
                ) : (
                  'Kontakttisch erstellen'
                )}
              </button>
            </div>
            
            {errors.submit && (
              <p className="text-red-500 text-sm mt-4 text-center">{errors.submit}</p>
            )}
          </form>
        </motion.div>
      </div>

    </PageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const authResult = await requireAuth(context, '/contact-tables/create');
  
  // Wenn der Benutzer nicht authentifiziert ist, wird er bereits umgeleitet
  if ('redirect' in authResult) {
    return authResult;
  }
  
  const user = authResult.props.user;

  // Prisma-Client importieren und initialisieren
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Überprüfen, ob der Benutzer bezahlt hat
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser || (!dbUser.isPaying && dbUser.role !== 'ADMIN')) {
      return {
        redirect: {
          destination: '/pricing?callbackUrl=/contact-tables/create',
          permanent: false,
        },
      };
    }

    return {
      props: {
        userId: user.id,
        userEmail: user.email,
        userRole: user.user_metadata?.role || 'CUSTOMER'
      },
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzerdaten:', error);
    return {
      props: {
        userId: user.id,
        userEmail: user.email,
        userRole: user.user_metadata?.role || 'CUSTOMER'
      },
    };
  } finally {
    await prisma.$disconnect();
  }
};
