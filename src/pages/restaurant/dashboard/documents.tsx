import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { motion } from 'framer-motion';
import { FiFileText, FiDownload, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import RestaurantSidebar from '../../../components/restaurant/RestaurantSidebar';

interface DocumentData {
  id: string;
  title: string;
  type: string;
  url: string;
  createdAt: string;
}

interface ContractData {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  planId: string;
  signedAt: string | null;
}

interface RestaurantData {
  id: string;
  name: string;
  isActive: boolean;
  contractStatus: string;
  contract: ContractData | null;
  documents: DocumentData[];
}

interface DocumentsPageProps {
  restaurant: RestaurantData;
}

export default function RestaurantDocuments({ restaurant }: DocumentsPageProps) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Hilfsfunktion zum Formatieren des Datums
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="flex flex-col md:flex-row">
        <RestaurantSidebar activeItem="documents" />
        
        <main className="flex-1 pt-20 px-4 md:px-8 pb-12">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Vertrag & Dokumente</h1>
              <p className="text-gray-600 mt-2">
                Verwalten Sie Ihren Vertrag und wichtige Dokumente für Ihr Restaurant.
              </p>
            </div>
            
            {/* Erfolgs- oder Fehlermeldung */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg"
              >
                <div className="flex items-center">
                  <FiCheckCircle className="mr-2" />
                  <p>{success}</p>
                </div>
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg"
              >
                <div className="flex items-center">
                  <FiAlertCircle className="mr-2" />
                  <p>{error}</p>
                </div>
              </motion.div>
            )}
            
            {/* Status-Banner */}
            {!restaurant.isActive && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-lg"
              >
                <div className="flex items-start">
                  <FiAlertCircle className="text-amber-500 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-medium text-amber-800">Ihr Restaurant ist noch nicht aktiv</h3>
                    <p className="text-amber-700 mt-1">
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
                        className="inline-block mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                      >
                        Zahlung abschließen
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Vertragsdetails */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Vertragsdetails</h2>
              
              {restaurant.contract ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Vertragsstatus</p>
                      <p className="font-medium text-gray-800">
                        {restaurant.contract.status === 'ACTIVE' ? 'Aktiv' : 'Inaktiv'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tarif</p>
                      <p className="font-medium text-gray-800">
                        {restaurant.contract.planId === 'basic' && 'Basic'}
                        {restaurant.contract.planId === 'standard' && 'Standard'}
                        {restaurant.contract.planId === 'premium' && 'Premium'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Vertragsbeginn</p>
                      <p className="font-medium text-gray-800">{formatDate(restaurant.contract.startDate)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Vertragsende</p>
                      <p className="font-medium text-gray-800">{formatDate(restaurant.contract.endDate)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Unterzeichnet am</p>
                      <p className="font-medium text-gray-800">
                        {restaurant.contract.signedAt ? formatDate(restaurant.contract.signedAt) : 'Nicht unterzeichnet'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <a 
                      href="/api/restaurant/download-contract"
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FiDownload className="mr-2" />
                      Vertrag herunterladen
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiFileText className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-700 mb-2">Kein aktiver Vertrag vorhanden</p>
                  {restaurant.contractStatus === 'APPROVED' && (
                    <a 
                      href={`/restaurant/payment/${restaurant.id}`}
                      className="inline-block mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Vertrag abschließen
                    </a>
                  )}
                </div>
              )}
            </div>
            
            {/* Dokumente */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Dokumente</h2>
              
              {restaurant.documents.length === 0 ? (
                <div className="text-center py-8">
                  <FiFileText className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-700">Keine Dokumente vorhanden</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktion</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {restaurant.documents.map((document) => (
                        <tr key={document.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{document.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{document.type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(document.createdAt)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a 
                              href={document.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Herunterladen
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Informationsbox */}
              <div className="mt-8 bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <FiInfo className="text-blue-500 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-medium text-blue-800">Wichtige Hinweise zu Ihren Dokumenten</h3>
                    <p className="text-blue-700 mt-1">
                      Alle Dokumente werden sicher aufbewahrt und sind nur für Sie und autorisierte Mitarbeiter von Contact Tables zugänglich.
                      Bei Fragen zu Ihren Dokumenten oder Ihrem Vertrag kontaktieren Sie bitte unseren Kundenservice.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  
  const prisma = new PrismaClient();
  
  try {
    // Restaurant des eingeloggten Benutzers finden
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        contractStatus: true,
        contract: true
      }
    });
    
    if (!restaurant) {
      return {
        redirect: {
          destination: '/restaurant/register',
          permanent: false,
        },
      };
    }
    
    // In einer echten Implementierung würden wir hier die Dokumente aus der Datenbank abrufen
    // Für dieses Beispiel verwenden wir Beispieldaten
    const documents = [
      {
        id: '1',
        title: 'Vertrag - Contact Tables',
        type: 'PDF',
        url: '/api/restaurant/download-contract',
        createdAt: '2025-05-01T12:00:00Z'
      },
      {
        id: '2',
        title: 'AGB - Contact Tables',
        type: 'PDF',
        url: '/api/restaurant/download-terms',
        createdAt: '2025-05-01T12:00:00Z'
      },
      {
        id: '3',
        title: 'Datenschutzerklärung',
        type: 'PDF',
        url: '/api/restaurant/download-privacy',
        createdAt: '2025-05-01T12:00:00Z'
      }
    ];
    
    return {
      props: {
        restaurant: {
          ...restaurant,
          documents
        },
      },
    };
  } catch (error) {
    console.error('Fehler beim Abrufen des Restaurants:', error);
    
    return {
      redirect: {
        destination: '/error',
        permanent: false,
      },
    };
  } finally {
    await prisma.$disconnect();
  }
};
