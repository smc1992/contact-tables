import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiFileText, FiDownload, FiCheck } from 'react-icons/fi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  contractStatus: string;
  plan: string | null;
  profile: {
    id: string;
    name: string;
    email: string;
  };
}

interface ContractPageProps {
  restaurant: Restaurant;
  token: string;
}

export default function RestaurantContract({ restaurant, token }: ContractPageProps) {
  const router = useRouter();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Vertrag akzeptieren
  const acceptContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      // API-Aufruf zum Akzeptieren des Vertrags
      const response = await fetch('/api/restaurant/accept-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          token
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ein Fehler ist aufgetreten');
      }

      // Erfolg anzeigen
      setSuccess(true);
      
      // Nach kurzer Verzögerung zum Dashboard weiterleiten
      setTimeout(() => {
        router.push('/restaurant/dashboard');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsProcessing(false);
    }
  };

  // Vertrag herunterladen
  const downloadContract = () => {
    // Hier würde normalerweise ein Download des Vertrags als PDF erfolgen
    // Für dieses Beispiel zeigen wir nur eine Meldung an
    alert('Der Vertrag wird als PDF heruntergeladen.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header-Bereich */}
            <div className="bg-primary-600 p-6 md:p-8 text-white">
              <h1 className="text-2xl md:text-3xl font-bold">Vertrag für {restaurant.name}</h1>
              <p className="mt-2 opacity-90">Bitte lesen Sie den Vertrag sorgfältig durch und akzeptieren Sie die Bedingungen.</p>
            </div>
            
            {/* Erfolgs- oder Fehlermeldung */}
            {success ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-6 bg-green-50 border-l-4 border-green-500"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiCheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Vertrag erfolgreich akzeptiert! Sie werden zum Dashboard weitergeleitet...
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-6 bg-red-50 border-l-4 border-red-500"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </motion.div>
            ) : null}
            
            {/* Vertragsinformationen */}
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Vertragsdetails</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Vertragsnummer: CT-{restaurant.id.substring(0, 8).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={downloadContract}
                  className="flex items-center text-primary-600 hover:text-primary-700"
                >
                  <FiDownload className="mr-1" />
                  <span>PDF herunterladen</span>
                </button>
              </div>
              
              {/* Vertragsdetails */}
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="font-semibold mb-4">Vertragsinformationen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Restaurant</p>
                    <p className="font-medium">{restaurant.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="font-medium">{restaurant.address}, {restaurant.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kontaktperson</p>
                    <p className="font-medium">{restaurant.profile.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">E-Mail</p>
                    <p className="font-medium">{restaurant.profile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gewählter Tarif</p>
                    <p className="font-medium">{restaurant.plan || 'Standard'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vertragsstatus</p>
                    <p className="font-medium">Ausstehend</p>
                  </div>
                </div>
              </div>
              
              {/* Vertragstext */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <div className="h-64 overflow-y-auto text-sm text-gray-700 p-2">
                  <h3 className="font-bold mb-2">Nutzungsbedingungen für Contact Tables</h3>
                  
                  <p className="mb-4">
                    Diese Nutzungsbedingungen regeln die Nutzung der Contact Tables-Plattform durch das Restaurant {restaurant.name}.
                  </p>
                  
                  <h4 className="font-semibold mt-4 mb-2">1. Vertragsgegenstand</h4>
                  <p className="mb-2">
                    Contact Tables stellt dem Restaurant eine Online-Plattform zur Verfügung, über die das Restaurant seine Kontakttische präsentieren und verwalten kann.
                  </p>
                  
                  <h4 className="font-semibold mt-4 mb-2">2. Laufzeit und Kündigung</h4>
                  <p className="mb-2">
                    Der Vertrag hat eine Mindestlaufzeit von einem Monat und verlängert sich automatisch um jeweils einen weiteren Monat, wenn er nicht mit einer Frist von 14 Tagen zum Ende der jeweiligen Laufzeit gekündigt wird.
                  </p>
                  
                  <h4 className="font-semibold mt-4 mb-2">3. Gebühren und Zahlungsbedingungen</h4>
                  <p className="mb-2">
                    Die Gebühren richten sich nach dem gewählten Tarif. Die Zahlung erfolgt monatlich im Voraus.
                  </p>
                  
                  <h4 className="font-semibold mt-4 mb-2">4. Pflichten des Restaurants</h4>
                  <p className="mb-2">
                    Das Restaurant verpflichtet sich, wahrheitsgemäße und aktuelle Informationen bereitzustellen und die Plattform nicht missbräuchlich zu nutzen.
                  </p>
                  
                  <h4 className="font-semibold mt-4 mb-2">5. Datenschutz</h4>
                  <p className="mb-2">
                    Das Restaurant erklärt sich damit einverstanden, dass Contact Tables personenbezogene Daten gemäß der Datenschutzerklärung verarbeitet.
                  </p>
                  
                  <h4 className="font-semibold mt-4 mb-2">6. Haftung</h4>
                  <p className="mb-2">
                    Contact Tables haftet nicht für Schäden, die durch die Nutzung der Plattform entstehen, es sei denn, diese beruhen auf Vorsatz oder grober Fahrlässigkeit.
                  </p>
                  
                  <h4 className="font-semibold mt-4 mb-2">7. Schlussbestimmungen</h4>
                  <p className="mb-2">
                    Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Berlin.
                  </p>
                </div>
              </div>
              
              {/* Vertragsannahme */}
              <form onSubmit={acceptContract}>
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      required
                    />
                    <span className="ml-2 text-gray-700">
                      Ich habe die Nutzungsbedingungen gelesen und akzeptiere sie
                    </span>
                  </label>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!acceptedTerms || isProcessing}
                    className={`flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                      (!acceptedTerms || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Wird verarbeitet...
                      </>
                    ) : (
                      <>
                        <FiCheck className="mr-2" />
                        Vertrag akzeptieren
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id, token } = context.query;

  if (!id || !token) {
    return { redirect: { destination: '/', permanent: false } };
  }

  const prisma = new PrismaClient();
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const restaurantData = await prisma.restaurant.findUnique({
      where: { id: id as string },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        contractStatus: true,
        plan: true,
        profile: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!restaurantData || !restaurantData.profile) {
      return { redirect: { destination: '/404', permanent: false } };
    }

    // Überprüfen, ob der Vertragsstatus "APPROVED" ist
    if (restaurantData.contractStatus !== 'APPROVED') {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    // Fetch email from Supabase Auth
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(restaurantData.profile.id);

    if (userError || !user) {
      console.error(`Error fetching user ${restaurantData.profile.id} for contract page:`, userError);
      return { redirect: { destination: '/500', permanent: false } };
    }

    // Augment the restaurant object with the email
    const restaurant = {
      ...restaurantData,
      profile: {
        ...restaurantData.profile,
        email: user.email || '',
      },
    };

    return {
      props: {
        restaurant,
        token: token as string,
      },
    };
  } catch (error) {
    console.error('Fehler beim Abrufen des Restaurants:', error);
    return {
      redirect: {
        destination: '/500',
        permanent: false,
      },
    };
  } finally {
    await prisma.$disconnect();
  }
};
