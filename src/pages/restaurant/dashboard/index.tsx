import { useState, useEffect } from 'react';
import { createClient } from '../../../utils/supabase/server';
import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
// Keine Framer Motion-Animationen verwenden, um history.replaceState()-Fehler zu beheben
import { FiUsers, FiCalendar, FiClock, FiEdit, FiImage, FiAlertCircle, FiExternalLink, FiHelpCircle, FiHome, FiUser, FiBarChart2 } from 'react-icons/fi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import RestaurantSidebar from '../../../components/restaurant/RestaurantSidebar';

interface RestaurantData {
  id: string;
  name: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  cuisine: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  capacity: number | null;
  openingHours: string | null;
  imageUrl: string | null;
  isActive: boolean;
  contractStatus: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  contract?: {
    id: string;
    planId: string;
    status: string;
    startDate: string;
    endDate: string;
  } | null;
  _count?: {
    events: number;
  };
}

interface DashboardProps {
  restaurant: RestaurantData;
}

export default function RestaurantDashboard({ restaurant }: DashboardProps) {
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  
  useEffect(() => {
    // Berechne die Vollständigkeit des Profils
    const requiredFields = [
      'name', 'description', 'address', 'city', 'cuisine', 
      'phone', 'email', 'capacity', 'openingHours', 'imageUrl'
    ];
    
    const missing: string[] = [];
    let completedFields = 0;
    
    requiredFields.forEach(field => {
      if (restaurant[field as keyof RestaurantData]) {
        completedFields++;
      } else {
        missing.push(field);
      }
    });
    
    setProfileCompleteness(Math.round((completedFields / requiredFields.length) * 100));
    setMissingFields(missing);
  }, [restaurant]);
  
  // Formatiere fehlende Felder für die Anzeige
  const formatFieldName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      name: 'Name',
      description: 'Beschreibung',
      address: 'Adresse',
      city: 'Stadt',
      cuisine: 'Küche',
      phone: 'Telefon',
      email: 'E-Mail',
      capacity: 'Kapazität',
      openingHours: 'Öffnungszeiten',
      imageUrl: 'Bilder'
    };
    
    return fieldNames[field] || field;
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="flex flex-col md:flex-row">
        <RestaurantSidebar activeItem="dashboard" />
        
        <main className="flex-1 px-4 md:px-8 pb-12 mt-16">
          <div className="max-w-5xl mx-auto">
            {/* Dashboard Header mit Navigation */}
            <div className="bg-white shadow-lg rounded-lg mb-6 overflow-hidden border border-gray-200">
              <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Restaurant Dashboard</h1>
                  <p className="text-gray-600 mt-2">
                    Verwalten Sie Ihr Restaurant und Ihre Contact Tables
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-3">
                  <a href="/restaurant/dashboard/profile" className="text-gray-500 hover:text-gray-700 flex items-center">
                    <FiExternalLink className="mr-1" size={16} />
                    <span className="text-sm">Profil ansehen</span>
                  </a>
                  <a href="/help/restaurant" className="text-gray-500 hover:text-gray-700 flex items-center">
                    <FiHelpCircle className="mr-1" size={16} />
                    <span className="text-sm">Hilfe</span>
                  </a>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              <div className="border-t border-gray-200 px-4 md:px-6 py-2 bg-gray-50 flex flex-wrap">
                <a href="/restaurant/dashboard" className="mr-4 md:mr-6 py-3 px-1 border-b-2 border-primary-500 text-primary-600 font-medium flex items-center">
                  <FiHome className="mr-1.5" size={16} />
                  <span>Übersicht</span>
                </a>
                <a href="/restaurant/dashboard/profile" className="mr-4 md:mr-6 py-3 px-1 border-b-2 border-transparent hover:border-primary-300 hover:text-primary-500 text-gray-600 flex items-center">
                  <FiUser className="mr-1.5" size={16} />
                  <span>Profil bearbeiten</span>
                </a>
                <a href="/restaurant/dashboard/contact-tables" className="mr-4 md:mr-6 py-3 px-1 border-b-2 border-transparent hover:border-primary-300 hover:text-primary-500 text-gray-600 flex items-center">
                  <FiCalendar className="mr-1.5" size={16} />
                  <span>Contact Tables</span>
                </a>
                <a href="/restaurant/dashboard/images" className="mr-4 md:mr-6 py-3 px-1 border-b-2 border-transparent hover:border-primary-300 hover:text-primary-500 text-gray-600 flex items-center">
                  <FiImage className="mr-1.5" size={16} />
                  <span>Bilder</span>
                </a>
                <a href="/restaurant/dashboard/statistics" className="py-3 px-1 border-b-2 border-transparent hover:border-primary-300 hover:text-primary-500 text-gray-600 flex items-center">
                  <FiBarChart2 className="mr-1.5" size={16} />
                  <span>Statistiken</span>
                </a>
              </div>
            </div>
            
            {/* Willkommensbereich */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-md p-8 mb-8 text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">
                    Willkommen zurück, {restaurant?.name || 'Restaurant'}!
                  </h1>
                  <p className="text-primary-100 max-w-2xl">
                    Hier können Sie Ihr Restaurantprofil verwalten, Kontakttische erstellen und Ihre Statistiken einsehen. 
                    Ihr Dashboard zeigt Ihnen alle wichtigen Informationen auf einen Blick.
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <a 
                    href="/restaurant/dashboard/contact-tables/new" 
                    className="inline-flex items-center px-4 py-2 bg-white text-primary-600 rounded-md font-medium hover:bg-primary-50 transition-colors shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Neuen Kontakttisch erstellen
                  </a>
                </div>
              </div>
            </div>
            
            {/* Status-Banner */}
            {!restaurant.isActive && (
              <div className="bg-primary-100 border-l-4 border-primary-600 p-4 mb-8 rounded-r-lg">
                <div className="flex items-start">
                  <FiAlertCircle className="text-primary-600 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-medium text-secondary-700">Ihr Restaurant ist noch nicht aktiv</h3>
                    <p className="text-secondary-600 mt-1">
                      {restaurant.contractStatus === 'PENDING' && 
                        'Ihre Anfrage wird derzeit geprüft. Wir werden Sie benachrichtigen, sobald sie genehmigt wurde.'}
                      {restaurant.contractStatus === 'APPROVED' && 
                        'Ihre Anfrage wurde genehmigt! Bitte schließen Sie die Zahlung und den Vertragsabschluss ab, um Ihr Restaurant zu aktivieren.'}
                      {restaurant.contractStatus === 'REJECTED' && 
                        'Leider wurde Ihre Anfrage abgelehnt. Bitte kontaktieren Sie uns für weitere Informationen.'}
                    </p>
                    {restaurant.contractStatus === 'APPROVED' && (
                      <a 
                        href={`/restaurant/payment/${restaurant.id}`}
                        className="inline-block mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Zahlung abschließen
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Profil-Vollständigkeit */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Profil-Vollständigkeit</h2>
                <span className="text-sm font-medium px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
                  {profileCompleteness}% vollständig
                </span>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${profileCompleteness < 50 ? 'bg-red-500' : profileCompleteness < 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${profileCompleteness}%` }}
                    ></div>
                  </div>
                </div>
                
                {missingFields.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Fehlende Informationen:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {missingFields.map((field) => (
                        <div key={field} className="flex items-center text-sm text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {formatFieldName(field)}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-3">
                      <a 
                        href="/restaurant/dashboard/profile" 
                        className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors shadow-sm"
                      >
                        <FiEdit className="mr-2" size={16} /> Profil bearbeiten
                      </a>
                      <a 
                        href="/restaurant/dashboard/images" 
                        className="inline-flex items-center px-4 py-2 border border-primary-500 text-primary-600 rounded-md hover:bg-primary-50 transition-colors"
                      >
                        <FiImage className="mr-2" size={16} /> Bilder hochladen
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Ihr Profil ist vollständig! Gut gemacht.</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Statistik-Karten */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {/* Karte 1: Kontakttische heute */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex items-center">
                  <div className="bg-primary-500 p-4 flex items-center justify-center">
                    <FiClock className="text-white" size={24} />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600">Kontakttische heute</p>
                    <p className="text-3xl font-bold text-gray-800">3</p>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
                  <a href="/restaurant/dashboard/contact-tables" className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center">
                    <span>Alle Kontakttische anzeigen</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
              
              {/* Karte 2: Profilaufrufe */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex items-center">
                  <div className="bg-primary-500 p-4 flex items-center justify-center">
                    <FiUsers className="text-white" size={24} />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600">Profilaufrufe</p>
                    <p className="text-3xl font-bold text-gray-800">128</p>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
                  <a href="/restaurant/dashboard/statistics" className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center">
                    <span>Statistiken anzeigen</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
              
              {/* Karte 3: Abonnement */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex items-center">
                  <div className="bg-primary-500 p-4 flex items-center justify-center">
                    <FiCalendar className="text-white" size={24} />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600">Abonnement</p>
                    <p className="text-xl font-bold text-gray-800">Aktiv</p>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
                  <a href="/restaurant/dashboard/subscription" className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center">
                    <span>Abonnement verwalten</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Aktuelle Kontakttische */}
            <div className="bg-white rounded-lg shadow mb-8 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Aktuelle Kontakttische</h2>
                <a href="/restaurant/dashboard/contact-tables/new" className="inline-flex items-center px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Neuer Tisch
                </a>
              </div>
              
              {/* Kontakttisch-Liste */}
              <div className="divide-y divide-gray-100">
                {/* Kontakttisch 1 */}
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <a href="/restaurant/dashboard/contact-tables/edit/1" className="text-primary-600 hover:text-primary-800 font-medium">Gemeinsames Abendessen</a>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Heute</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Max Mustermann</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>4 Personen</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>19:00 Uhr</span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end space-x-2">
                    <a href="/restaurant/dashboard/contact-tables/edit/1" className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                      Bearbeiten
                    </a>
                    <button className="text-xs px-2 py-1 text-red-600 hover:text-red-800 border border-red-200 rounded hover:bg-red-50 transition-colors">
                      Entfernen
                    </button>
                  </div>
                </div>
                
                {/* Kontakttisch 2 */}
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <a href="/restaurant/dashboard/contact-tables/edit/2" className="text-primary-600 hover:text-primary-800 font-medium">Bierabend mit neuen Leuten</a>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Nächste Woche</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Maria Schmidt</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>6 Personen</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>20:00 Uhr</span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end space-x-2">
                    <a href="/restaurant/dashboard/contact-tables/edit/2" className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                      Bearbeiten
                    </a>
                    <button className="text-xs px-2 py-1 text-red-600 hover:text-red-800 border border-red-200 rounded hover:bg-red-50 transition-colors">
                      Entfernen
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-gray-600">2 Kontakttische gefunden</span>
                <a href="/restaurant/dashboard/contact-tables" className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center">
                  <span>Alle anzeigen</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Schnellzugriff */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Schnellzugriff & Aktionen</h2>
              </div>
              
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <a 
                  href="/restaurant/dashboard/profile" 
                  className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all group text-center"
                >
                  <div className="p-3 bg-primary-50 text-primary-500 rounded-full mb-3 group-hover:bg-primary-100 transition-colors">
                    <FiEdit size={24} />
                  </div>
                  <span className="font-medium text-gray-700 group-hover:text-primary-600">Profil bearbeiten</span>
                  <p className="text-xs text-gray-500 mt-1">Aktualisieren Sie Ihre Restaurantdaten</p>
                </a>
                
                <a 
                  href="/restaurant/dashboard/contact-tables/new" 
                  className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all group text-center"
                >
                  <div className="p-3 bg-primary-50 text-primary-500 rounded-full mb-3 group-hover:bg-primary-100 transition-colors">
                    <FiCalendar size={24} />
                  </div>
                  <span className="font-medium text-gray-700 group-hover:text-primary-600">Neuer Contact Table</span>
                  <p className="text-xs text-gray-500 mt-1">Erstellen Sie einen neuen Tisch</p>
                </a>
                
                <a 
                  href="/restaurant/dashboard/images" 
                  className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all group text-center"
                >
                  <div className="p-3 bg-primary-50 text-primary-500 rounded-full mb-3 group-hover:bg-primary-100 transition-colors">
                    <FiImage size={24} />
                  </div>
                  <span className="font-medium text-gray-700 group-hover:text-primary-600">Bilder hochladen</span>
                  <p className="text-xs text-gray-500 mt-1">Verwalten Sie Ihre Galerie</p>
                </a>
                
                <a 
                  href="/restaurant/dashboard/statistics" 
                  className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all group text-center"
                >
                  <div className="p-3 bg-primary-50 text-primary-500 rounded-full mb-3 group-hover:bg-primary-100 transition-colors">
                    <FiUsers size={24} />
                  </div>
                  <span className="font-medium text-gray-700 group-hover:text-primary-600">Statistiken</span>
                  <p className="text-xs text-gray-500 mt-1">Sehen Sie Ihre Besucherzahlen</p>
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
}

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  console.log("getServerSideProps für /restaurant/dashboard AUFGERUFEN");
  const supabase = createClient(context);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log("getServerSideProps: Kein Benutzer gefunden, Umleitung zum Login.");
    return { redirect: { destination: '/login', permanent: false } };
  }

  const userRole = user.user_metadata?.role || user.app_metadata?.role;
  if (userRole !== 'RESTAURANT') {
    console.log(`getServerSideProps: Benutzerrolle ist '${userRole}', nicht 'RESTAURANT'. Umleitung zur Homepage.`);
    return { redirect: { destination: '/', permanent: false } };
  }

  try {
    console.log(`getServerSideProps: Versuche Restaurantdaten zu laden für user.id: ${user.id}`);
    
    const { data: dbData, error } = await supabase
      .from('restaurants')
      .select(`
        id, name, description, address, city, cuisine, phone, email, website, capacity, opening_hours, is_active, created_at, updated_at, userId, contract_status,
        events:contact_tables(count)
      `)
      .eq('userId', user.id)
      .single();

    if (error) {
      console.error('Supabase-Fehler beim Laden der Restaurantdaten:', error);
      if (error.code === 'PGRST116') { 
        console.log(`getServerSideProps: Kein Restaurant für Benutzer ${user.id} gefunden. Umleitung zur Registrierung.`);
        return { redirect: { destination: '/restaurant/register', permanent: false } };
      }
      throw error;
    }

    if (!dbData) {
      console.log(`getServerSideProps: Kein Restaurant für Benutzer ${user.id} gefunden (Daten waren null). Umleitung zur Registrierung.`);
      return { redirect: { destination: '/restaurant/register', permanent: false } };
    }

    const restaurant: RestaurantData = {
      id: dbData.id,
      name: dbData.name,
      description: dbData.description,
      address: dbData.address,
      city: dbData.city,
      cuisine: dbData.cuisine,
      phone: dbData.phone,
      email: dbData.email,
      website: dbData.website,
      capacity: dbData.capacity,
      openingHours: dbData.opening_hours,
      imageUrl: null, // Explizit auf null setzen, da die Spalte in der DB fehlt
      isActive: dbData.is_active ?? false,
      contractStatus: dbData.contract_status,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at,
      userId: dbData.userId,
      contract: null, // Vertrag wird hier nicht mehr geladen
      _count: {
        events: dbData.events && dbData.events.length > 0 ? dbData.events[0].count : 0,
      },
    };

    return {
      props: {
        restaurant: JSON.parse(JSON.stringify(restaurant)),
      },
    };
  } catch (error) {
    console.error('getServerSideProps: Allgemeiner Fehler beim Laden der Daten: ', error);
    return { redirect: { destination: '/?error=dashboard-load-failed', permanent: false } };
  }
};


