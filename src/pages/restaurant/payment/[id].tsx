import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiCreditCard, FiFileText, FiArrowRight, FiCheck } from 'react-icons/fi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { PrismaClient } from '@prisma/client';

// Abonnement-Optionen
const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 49,
    billingPeriod: 'monatlich',
    features: [
      'Ein Contact-Table',
      'Grundlegende Restaurant-Profilseite',
      'E-Mail-Support',
      'Monatlich kündbar'
    ],
    recommended: false
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 89,
    billingPeriod: 'monatlich',
    features: [
      'Bis zu drei Contact-Tables',
      'Erweiterte Restaurant-Profilseite',
      'Vorrangige Platzierung in Suchergebnissen',
      'Telefon-Support',
      'Monatlich kündbar'
    ],
    recommended: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 149,
    billingPeriod: 'monatlich',
    features: [
      'Unbegrenzte Contact-Tables',
      'Premium Restaurant-Profilseite',
      'Top-Platzierung in Suchergebnissen',
      'Dedizierter Account Manager',
      'Marketing-Unterstützung',
      'Monatlich kündbar'
    ],
    recommended: false
  }
];

interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  contractStatus: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface PaymentPageProps {
  restaurant: Restaurant;
}

export default function RestaurantPayment({ restaurant }: PaymentPageProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [paymentStep, setPaymentStep] = useState(1);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Zahlungsformular-Handler
  const handleCardDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  // Zahlungsabwicklung
  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    // Validierung
    if (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiryDate || !cardDetails.cvv) {
      setError('Bitte füllen Sie alle Zahlungsfelder aus');
      setIsProcessing(false);
      return;
    }

    if (!acceptedTerms) {
      setError('Bitte akzeptieren Sie die Nutzungsbedingungen und den Vertrag');
      setIsProcessing(false);
      return;
    }

    try {
      // In einer echten Anwendung würde hier die Stripe-Integration erfolgen
      // Simuliere API-Aufruf für die Zahlung
      const paymentResponse = await fetch('/api/restaurant/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          planId: selectedPlan,
          // In einer echten Anwendung würden hier die Stripe-Token oder ähnliches übergeben werden
        })
      });

      if (!paymentResponse.ok) {
        throw new Error('Zahlungsfehler');
      }

      // Simuliere API-Aufruf für den Vertragsabschluss
      const contractResponse = await fetch('/api/restaurant/contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          planId: selectedPlan,
          acceptedTerms
        })
      });

      if (!contractResponse.ok) {
        throw new Error('Vertragsfehler');
      }

      // Erfolgreiche Zahlung und Vertragsabschluss
      setSuccess(true);
      
      // Nach 3 Sekunden zum Restaurant-Dashboard weiterleiten
      setTimeout(() => {
        router.push('/restaurant/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Fehler bei der Zahlungsabwicklung:', error);
      setError('Bei der Zahlungsabwicklung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Schritte der Zahlungsabwicklung
  const nextStep = () => {
    if (paymentStep === 1 && !selectedPlan) {
      setError('Bitte wählen Sie einen Tarif aus');
      return;
    }
    setError('');
    setPaymentStep(paymentStep + 1);
  };

  const prevStep = () => {
    setError('');
    setPaymentStep(paymentStep - 1);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Aktivieren Sie Ihr Restaurant auf Contact Tables
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nur noch wenige Schritte, um {restaurant.name} für Gäste sichtbar zu machen
            </p>
          </div>
          
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex justify-center items-center max-w-3xl mx-auto">
              <div className={`flex flex-col items-center ${paymentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  paymentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  1
                </div>
                <span className="mt-2 text-sm font-medium">Tarif wählen</span>
              </div>
              
              <div className={`w-16 md:w-32 h-1 ${paymentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'} mx-2 md:mx-4`}></div>
              
              <div className={`flex flex-col items-center ${paymentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  paymentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <span className="mt-2 text-sm font-medium">Zahlung</span>
              </div>
              
              <div className={`w-16 md:w-32 h-1 ${paymentStep >= 3 ? 'bg-primary-600' : 'bg-gray-200'} mx-2 md:mx-4`}></div>
              
              <div className={`flex flex-col items-center ${paymentStep >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  paymentStep >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </div>
                <span className="mt-2 text-sm font-medium">Vertrag</span>
              </div>
            </div>
          </div>
          
          {/* Success Message */}
          {success ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle className="text-green-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Zahlung erfolgreich!</h2>
              <p className="text-gray-600 mb-6">
                Vielen Dank für Ihre Zahlung. Ihr Restaurant {restaurant.name} ist jetzt auf Contact Tables aktiviert.
                Sie werden in Kürze zum Restaurant-Dashboard weitergeleitet.
              </p>
              <div className="animate-pulse h-2 w-32 bg-gray-200 rounded-full mx-auto"></div>
            </motion.div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg max-w-3xl mx-auto">
                  <div className="flex items-center">
                    <FiAlertCircle className="mr-2" />
                    <p>{error}</p>
                  </div>
                </div>
              )}
              
              {/* Step 1: Plan Selection */}
              {paymentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
                >
                  {subscriptionPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`bg-white rounded-xl shadow-md overflow-hidden relative ${
                        selectedPlan === plan.id ? 'ring-2 ring-primary-500' : ''
                      } ${plan.recommended ? 'transform md:-translate-y-4' : ''}`}
                    >
                      {plan.recommended && (
                        <div className="absolute top-0 left-0 right-0 bg-primary-500 text-white text-center py-1 text-sm font-medium">
                          Empfohlen
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-gray-900">{plan.price} €</span>
                          <span className="text-gray-500">/{plan.billingPeriod}</span>
                        </div>
                        <ul className="space-y-3 mb-6">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                              <span className="text-gray-600">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => setSelectedPlan(plan.id)}
                          className={`w-full py-3 rounded-lg font-medium transition-colors ${
                            selectedPlan === plan.id
                              ? 'bg-primary-600 text-white'
                              : 'bg-white border border-primary-500 text-primary-600 hover:bg-primary-50'
                          }`}
                        >
                          {selectedPlan === plan.id ? 'Ausgewählt' : 'Auswählen'}
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
              
              {/* Step 2: Payment */}
              {paymentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden"
                >
                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                      <FiCreditCard className="mr-3 text-primary-500" />
                      Zahlungsinformationen
                    </h2>
                    
                    <div className="mb-6">
                      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg mb-4">
                        <div>
                          <p className="font-medium text-gray-800">
                            {subscriptionPlans.find(p => p.id === selectedPlan)?.name} Tarif
                          </p>
                          <p className="text-gray-500">
                            {subscriptionPlans.find(p => p.id === selectedPlan)?.billingPeriod}
                          </p>
                        </div>
                        <p className="font-bold text-xl text-gray-800">
                          {subscriptionPlans.find(p => p.id === selectedPlan)?.price} €
                        </p>
                      </div>
                    </div>
                    
                    <form>
                      <div className="space-y-4 mb-6">
                        <div>
                          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Kartennummer
                          </label>
                          <input
                            type="text"
                            id="cardNumber"
                            name="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={cardDetails.cardNumber}
                            onChange={handleCardDetailsChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                            Name auf der Karte
                          </label>
                          <input
                            type="text"
                            id="cardName"
                            name="cardName"
                            placeholder="Max Mustermann"
                            value={cardDetails.cardName}
                            onChange={handleCardDetailsChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                              Ablaufdatum
                            </label>
                            <input
                              type="text"
                              id="expiryDate"
                              name="expiryDate"
                              placeholder="MM/YY"
                              value={cardDetails.expiryDate}
                              onChange={handleCardDetailsChange}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                              Sicherheitscode
                            </label>
                            <input
                              type="text"
                              id="cvv"
                              name="cvv"
                              placeholder="123"
                              value={cardDetails.cvv}
                              onChange={handleCardDetailsChange}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
              
              {/* Step 3: Contract */}
              {paymentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden"
                >
                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                      <FiFileText className="mr-3 text-primary-500" />
                      Vertrag und Nutzungsbedingungen
                    </h2>
                    
                    <div className="mb-6 h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
                      <h3 className="font-bold mb-2">Partnervertrag für Contact Tables</h3>
                      <p className="mb-4">
                        Dieser Vertrag wird geschlossen zwischen Contact Tables GmbH (nachfolgend "Contact Tables") und dem Restaurant {restaurant.name} (nachfolgend "Partner").
                      </p>
                      
                      <h4 className="font-bold mt-4 mb-2">1. Vertragsgegenstand</h4>
                      <p className="mb-2">
                        Contact Tables stellt dem Partner eine Plattform zur Verfügung, auf der der Partner sein Restaurant präsentieren und "Contact Tables" für Gäste anbieten kann.
                      </p>
                      
                      <h4 className="font-bold mt-4 mb-2">2. Leistungen von Contact Tables</h4>
                      <p className="mb-2">
                        Contact Tables stellt dem Partner folgende Leistungen zur Verfügung:
                      </p>
                      <ul className="list-disc pl-5 mb-2">
                        <li>Präsentation des Restaurants auf der Contact Tables Plattform</li>
                        <li>Verwaltung von Reservierungen für Contact Tables</li>
                        <li>Marketing für das Konzept der Contact Tables</li>
                        <li>Technischer Support</li>
                      </ul>
                      
                      <h4 className="font-bold mt-4 mb-2">3. Pflichten des Partners</h4>
                      <p className="mb-2">
                        Der Partner verpflichtet sich:
                      </p>
                      <ul className="list-disc pl-5 mb-2">
                        <li>Mindestens einen Tisch als "Contact Table" zur Verfügung zu stellen</li>
                        <li>Den "Contact Table" entsprechend zu kennzeichnen</li>
                        <li>Reservierungen über die Plattform anzunehmen</li>
                        <li>Das Konzept der "Contact Tables" den Gästen zu erklären</li>
                      </ul>
                      
                      <h4 className="font-bold mt-4 mb-2">4. Vergütung</h4>
                      <p className="mb-2">
                        Der Partner zahlt an Contact Tables eine monatliche Gebühr gemäß dem gewählten Tarif. Die Zahlung erfolgt monatlich im Voraus.
                      </p>
                      
                      <h4 className="font-bold mt-4 mb-2">5. Vertragslaufzeit</h4>
                      <p className="mb-2">
                        Der Vertrag hat eine Mindestlaufzeit von einem Monat und verlängert sich automatisch um jeweils einen weiteren Monat, wenn er nicht mit einer Frist von 14 Tagen zum Ende der Laufzeit gekündigt wird.
                      </p>
                      
                      <h4 className="font-bold mt-4 mb-2">6. Datenschutz</h4>
                      <p className="mb-2">
                        Beide Parteien verpflichten sich zur Einhaltung der geltenden Datenschutzbestimmungen.
                      </p>
                      
                      <h4 className="font-bold mt-4 mb-2">7. Schlussbestimmungen</h4>
                      <p>
                        Dieser Vertrag unterliegt deutschem Recht. Gerichtsstand ist Berlin.
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={() => setAcceptedTerms(!acceptedTerms)}
                          className="mt-1 mr-3"
                        />
                        <span className="text-gray-700">
                          Ich akzeptiere die <a href="/terms" className="text-primary-600 hover:underline">Nutzungsbedingungen</a> und den Partnervertrag und stimme zu, dass mein Restaurant auf Contact Tables gelistet wird.
                        </span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 max-w-2xl mx-auto">
                {paymentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Zurück
                  </button>
                )}
                
                {paymentStep < 3 ? (
                  <button
                    onClick={nextStep}
                    className="ml-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                  >
                    Weiter <FiArrowRight className="ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={processPayment}
                    disabled={isProcessing || !acceptedTerms}
                    className={`ml-auto px-6 py-3 rounded-lg text-white flex items-center ${
                      isProcessing || !acceptedTerms ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                        Verarbeitung...
                      </>
                    ) : (
                      <>
                        Zahlung abschließen <FiCheckCircle className="ml-2" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
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
    // Restaurant finden
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!restaurant) {
      return {
        notFound: true,
      };
    }
    
    // Überprüfen, ob der Benutzer berechtigt ist, auf diese Seite zuzugreifen
    if (restaurant.user.id !== session.user.id && session.user.role !== 'ADMIN') {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }
    
    // Überprüfen, ob das Restaurant den richtigen Status hat
    // Hier sollte PENDING oder ACTIVE verwendet werden, je nach Workflow
    if (restaurant.contractStatus !== 'PENDING') {
      return {
        redirect: {
          destination: '/restaurant/dashboard',
          permanent: false,
        },
      };
    }
    
    return {
      props: {
        restaurant: JSON.parse(JSON.stringify(restaurant)), // Serialisieren für SSR
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
