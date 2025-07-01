import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { createClient } from '../../utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiAlertCircle, FiEye, FiDownload, FiDollarSign, FiFileText, FiMapPin, FiPhone, FiMail, FiClock, FiUsers } from 'react-icons/fi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
// Import mit explizitem Pfad
import AdminSidebar from '../../components/AdminSidebar';
// Import mit explizitem Pfad
import { formatDate } from '../../utils/dateUtils';

// Typdefinitionen
interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  country: string;
  description?: string;
  imageUrl?: string;
  cuisine?: string;
  capacity?: number;
  contractStatus: 'PENDING' | 'ACTIVE' | 'CANCELLED';
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function PartnerRequests() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });

  // Partneranfragen abrufen
  useEffect(() => {
    const fetchPartnerRequests = async () => {
      try {
        const response = await fetch('/api/admin/partner-requests');
        if (!response.ok) throw new Error('Fehler beim Laden der Partneranfragen');
        
        const data = await response.json();
        setRestaurants(data.restaurants);
      } catch (error) {
        console.error('Fehler:', error);
        setStatusMessage({ 
          type: 'error', 
          message: 'Partneranfragen konnten nicht geladen werden.' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartnerRequests();
  }, []);

  // Restaurant-Anfrage genehmigen
  const approveRequest = async (id: string) => {
    setProcessingId(id);
    try {
      const response = await fetch('/api/admin/partner-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: id })
      });

      if (!response.ok) throw new Error('Fehler bei der Genehmigung');
      
      // Restaurant-Status aktualisieren
      setRestaurants(prevRestaurants => 
        prevRestaurants.filter(restaurant => restaurant.id !== id)
      );
      
      setStatusMessage({ 
        type: 'success', 
        message: 'Restaurant erfolgreich genehmigt. Ein Zahlungslink wurde an das Restaurant gesendet.' 
      });
    } catch (error) {
      console.error('Fehler:', error);
      setStatusMessage({ 
        type: 'error', 
        message: 'Restaurant konnte nicht genehmigt werden.' 
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Restaurant-Anfrage ablehnen
  const rejectRequest = async (id: string) => {
    setProcessingId(id);
    try {
      const response = await fetch('/api/admin/partner-requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: id })
      });

      if (!response.ok) throw new Error('Fehler bei der Ablehnung');
      
      // Restaurant-Status aktualisieren
      setRestaurants(prevRestaurants => 
        prevRestaurants.filter(restaurant => restaurant.id !== id)
      );
      
      setStatusMessage({ 
        type: 'success', 
        message: 'Restaurant-Anfrage erfolgreich abgelehnt.' 
      });
    } catch (error) {
      console.error('Fehler:', error);
      setStatusMessage({ 
        type: 'error', 
        message: 'Restaurant-Anfrage konnte nicht abgelehnt werden.' 
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Restaurant-Details anzeigen
  const viewRestaurantDetails = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDetailModal(true);
  };

  // Modal schließen
  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedRestaurant(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="flex flex-col md:flex-row pt-20">
        {/* Admin Sidebar */}
        <AdminSidebar activeItem="partner-requests" />
        
        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Partneranfragen</h1>
            <p className="text-gray-600">Verwalten Sie neue Restaurant-Partneranfragen</p>
          </div>
          
          {/* Status Message */}
          {statusMessage.message && (
            <div className={`mb-6 p-4 rounded-lg ${
              statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className="flex items-center">
                {statusMessage.type === 'success' ? (
                  <FiCheck className="mr-2" />
                ) : (
                  <FiAlertCircle className="mr-2" />
                )}
                <p>{statusMessage.message}</p>
              </div>
            </div>
          )}
          
          {/* Restaurant List */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-4"></div>
                <p>Partneranfragen werden geladen...</p>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Keine ausstehenden Partneranfragen vorhanden.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Standort</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {restaurants.map((restaurant) => (
                      <tr key={restaurant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 mr-3">
                              {restaurant.imageUrl ? (
                                <img 
                                  src={restaurant.imageUrl} 
                                  alt={restaurant.name} 
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                  <FiMapPin />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{restaurant.name}</div>
                              <div className="text-sm text-gray-500">{restaurant.cuisine || 'Keine Angabe'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{restaurant.address}</div>
                          <div className="text-sm text-gray-500">{restaurant.city}, {restaurant.country}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{restaurant.email}</div>
                          <div className="text-sm text-gray-500">{restaurant.phone || 'Keine Angabe'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(restaurant.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewRestaurantDetails(restaurant)}
                              className="text-primary-600 hover:text-primary-900 p-1 rounded-full hover:bg-primary-50"
                              title="Details anzeigen"
                            >
                              <FiEye size={18} />
                            </button>
                            <button
                              onClick={() => approveRequest(restaurant.id)}
                              disabled={processingId === restaurant.id}
                              className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 disabled:opacity-50"
                              title="Anfrage genehmigen"
                            >
                              <FiCheck size={18} />
                            </button>
                            <button
                              onClick={() => rejectRequest(restaurant.id)}
                              disabled={processingId === restaurant.id}
                              className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 disabled:opacity-50"
                              title="Anfrage ablehnen"
                            >
                              <FiX size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Restaurant Detail Modal */}
      {showDetailModal && selectedRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{selectedRestaurant.name}</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Restaurant-Informationen</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Name</p>
                      <p className="font-medium">{selectedRestaurant.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Adresse</p>
                      <p className="font-medium">
                        {selectedRestaurant.address}, {selectedRestaurant.postalCode} {selectedRestaurant.city}, {selectedRestaurant.country}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Küche</p>
                      <p className="font-medium">{selectedRestaurant.cuisine || 'Keine Angabe'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Kapazität</p>
                      <p className="font-medium">{selectedRestaurant.capacity || 'Keine Angabe'} Plätze</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Öffnungszeiten</p>
                      <p className="font-medium whitespace-pre-line">{selectedRestaurant.openingHours || 'Keine Angabe'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Kontaktinformationen</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Kontaktperson</p>
                      <p className="font-medium">{selectedRestaurant.user.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">E-Mail</p>
                      <p className="font-medium">{selectedRestaurant.email || selectedRestaurant.user.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Telefon</p>
                      <p className="font-medium">{selectedRestaurant.phone || 'Keine Angabe'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Website</p>
                      <p className="font-medium">
                        {selectedRestaurant.website ? (
                          <a 
                            href={selectedRestaurant.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline"
                          >
                            {selectedRestaurant.website}
                          </a>
                        ) : (
                          'Keine Angabe'
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Anfrage eingegangen am</p>
                      <p className="font-medium">{new Date(selectedRestaurant.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedRestaurant.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">Beschreibung</h3>
                  <p className="text-gray-700 whitespace-pre-line">{selectedRestaurant.description}</p>
                </div>
              )}
              
              <div className="mt-8 border-t border-gray-200 pt-6 flex justify-between">
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      closeModal();
                      rejectRequest(selectedRestaurant.id);
                    }}
                    disabled={processingId === selectedRestaurant.id}
                    className="px-4 py-2 bg-white border border-red-500 text-red-600 rounded-lg hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <FiX size={18} />
                    <span>Ablehnen</span>
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    closeModal();
                    approveRequest(selectedRestaurant.id);
                  }}
                  disabled={processingId === selectedRestaurant.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
                >
                  <FiCheck size={18} />
                  <span>Genehmigen & Zahlungslink senden</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Supabase-Client erstellen
  const supabase = createClient(context);
  
  // Authentifizierung prüfen
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  
  // Get role from Supabase session
  const userRole = session.user.user_metadata?.role;

  // Check if the user is an Admin
  if (userRole !== 'ADMIN') {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      session,
    },
  };
};
