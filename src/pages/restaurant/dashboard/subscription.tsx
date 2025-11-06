import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import { motion } from 'framer-motion';
import { FiCreditCard, FiAlertCircle, FiCheckCircle, FiArrowRight, FiClock, FiFileText } from 'react-icons/fi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import RestaurantSidebar from '../../../components/restaurant/RestaurantSidebar';

interface ContractData {
  id: string;
  plan: string;
  status: string;
  startDate: string;
  trialEndDate: string | null;
  createdAt: string;
}

interface InvoiceData {
  id: string;
  amount: number;
  currency: string;
  date: string;
  downloadUrl: string;
}

interface RestaurantData {
  id: string;
  name: string;
  isActive: boolean;
  contractStatus: string;
  plan: string | null;
  contract: ContractData | null;
  invoices: InvoiceData[];
}

interface SubscriptionPageProps {
  restaurant: RestaurantData;
}

export default function RestaurantSubscription({ restaurant }: SubscriptionPageProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(restaurant.plan || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Digistore24: zwei Zahlungspläne direkt verknüpfen (custom = Restaurant-ID)
  // Bevorzugt PLAN-URLs, fällt auf PRODUCT-URLs zurück
  const DIGISTORE_MONTHLY_URL =
    process.env.NEXT_PUBLIC_DIGISTORE_PLAN_MONTHLY_URL ||
    process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_MONTHLY_URL ||
    process.env.NEXT_PUBLIC_DIGISTORE_PLAN_BASIC_URL ||
    process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_BASIC_URL;
  const DIGISTORE_YEARLY_URL =
    process.env.NEXT_PUBLIC_DIGISTORE_PLAN_YEARLY_URL ||
    process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_YEARLY_URL ||
    process.env.NEXT_PUBLIC_DIGISTORE_PLAN_PREMIUM_URL ||
    process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_PREMIUM_URL;
  // Optionale Preis-ENV-Variablen für Tooltips
  const MONTHLY_PRICE = process.env.NEXT_PUBLIC_DIGISTORE_PLAN_MONTHLY_PRICE;
  const YEARLY_PRICE = process.env.NEXT_PUBLIC_DIGISTORE_PLAN_YEARLY_PRICE;
  const formatPrice = (price?: string) => {
    if (!price) return undefined;
    const p = Number(price);
    if (Number.isFinite(p)) {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);
    }
    return price; // Falls kein numerischer Wert, zeige den Rohwert
  };
  const appendCustom = (url?: string) => {
    if (!url) return undefined;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}custom=${encodeURIComponent(restaurant.id)}`;
  };
  const dsPlans = [
    ...(DIGISTORE_MONTHLY_URL ? [{ id: 'monthly', name: 'Monatlich', url: String(appendCustom(DIGISTORE_MONTHLY_URL)) }] : []),
    ...(DIGISTORE_YEARLY_URL ? [{ id: 'yearly', name: 'Jährlich', url: String(appendCustom(DIGISTORE_YEARLY_URL)) }] : []),
  ];

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29.99,
      features: [
        'Grundlegende Restaurant-Präsenz',
        'Bis zu 3 Contact Tables pro Monat',
        'E-Mail-Support'
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 49.99,
      features: [
        'Erweiterte Restaurant-Präsenz',
        'Bis zu 10 Contact Tables pro Monat',
        'Hervorgehobene Platzierung in Suchergebnissen',
        'Prioritäts-E-Mail-Support'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 99.99,
      features: [
        'Premium Restaurant-Präsenz',
        'Unbegrenzte Contact Tables',
        'Höchste Platzierung in Suchergebnissen',
        'Dedizierter Kundenservice',
        'Monatliche Statistiken und Berichte'
      ]
    }
  ];
  
  const handleUpgradeClick = () => {
    setIsUpgrading(true);
  };
  
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };
  
  const handleUpgradeSubmit = async () => {
    if (!selectedPlan) {
      setError('Bitte wählen Sie einen Tarif aus');
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/restaurant/upgrade-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          planId: selectedPlan
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Aktualisieren des Abonnements');
      }
      
      setSuccess('Abonnement erfolgreich aktualisiert');
      setIsUpgrading(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Abonnements:', error);
      setError(error.message || 'Ein unerwarteter Fehler ist aufgetreten');
    }
  };
  
  const handleCancelSubscription = async () => {
    if (!confirm('Sind Sie sicher, dass Sie Ihr Abonnement kündigen möchten? Ihr Restaurant wird dann nicht mehr auf der Plattform sichtbar sein.')) {
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/restaurant/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          restaurantId: restaurant.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Kündigen des Abonnements');
      }
      
      setSuccess('Abonnement erfolgreich gekündigt. Es bleibt bis zum Ende der Laufzeit aktiv.');
      
      // In einer echten Implementierung würden wir hier die Seite neu laden oder die Daten aktualisieren
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Fehler beim Kündigen des Abonnements:', error);
      setError(error.message || 'Ein unerwarteter Fehler ist aufgetreten');
    }
  };
  
  // Hilfsfunktion zum Formatieren des Datums
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
  };
  
  // Hilfsfunktion zum Formatieren des Betrags
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
  };
  
  // Digistore24: Pläne werden über ENV eingebunden (siehe dsPlans oben)
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="flex flex-col md:flex-row">
        <RestaurantSidebar activeItem="subscription" />
        
        <main className="flex-1 pt-20 px-4 md:px-8 pb-12">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Abonnement</h1>
              <p className="text-gray-600 mt-2">
                Verwalten Sie Ihr Contact Tables Abonnement und sehen Sie Ihre Rechnungen ein.
              </p>
            </div>

            {/* Digistore24 Zahlungspläne */}
            {dsPlans.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Zahlungspläne über Digistore24</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dsPlans.map((p) => (
                    <div key={p.id} className="border rounded-xl p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          {p.name}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border">
                            {p.id === 'monthly' ? 'Monat' : p.id === 'yearly' ? 'Jahr' : 'Plan'}
                          </span>
                        </h3>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Bezahlen Sie sicher über Digistore24. Ihr Restaurant wird nach Zahlung automatisch freigeschaltet.
                      </p>
                      {p.id === 'monthly' && (
                        <p className="text-sm text-neutral-600 mb-2">{formatPrice(MONTHLY_PRICE) ? `Preis: ${formatPrice(MONTHLY_PRICE)} pro Monat` : 'Preis wird im Checkout angezeigt.'}</p>
                      )}
                      {p.id === 'yearly' && (
                        <p className="text-sm text-neutral-600 mb-2">{formatPrice(YEARLY_PRICE) ? `Preis: ${formatPrice(YEARLY_PRICE)} pro Jahr` : 'Preis wird im Checkout angezeigt.'}</p>
                      )}
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors"
                        title={p.id === 'monthly' ? (formatPrice(MONTHLY_PRICE) ? `Monatlich zahlen – ${formatPrice(MONTHLY_PRICE)}` : 'Monatlich zahlen') : (p.id === 'yearly' ? (formatPrice(YEARLY_PRICE) ? `Jährlich zahlen – ${formatPrice(YEARLY_PRICE)}` : 'Jährlich zahlen') : 'Zahlung abschließen')}
                      >
                        {p.id === 'monthly' ? 'Monatlich zahlen' : p.id === 'yearly' ? 'Jährlich zahlen' : 'Zahlung abschließen'}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
            
            {/* Aktuelles Abonnement */}
            {restaurant.isActive && restaurant.contract && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Aktuelles Abonnement</h2>
                
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center mb-2">
                      <FiCreditCard className="text-primary-500 mr-2" size={20} />
                      <h3 className="text-lg font-medium text-gray-800">
                        {restaurant.plan === 'monthly' && 'Monatlich'}
                        {restaurant.plan === 'yearly' && 'Jährlich'}
                        {!['monthly','yearly'].includes(restaurant.plan || '') && 'Mitgliedschaft'}
                      </h3>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-1">
                      <FiClock className="mr-2" size={16} />
                      <p>
                        Aktiv bis: {restaurant.contract.trialEndDate ? formatDate(restaurant.contract.trialEndDate) : 'Unbefristet'}
                      </p>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <FiFileText className="mr-2" size={16} />
                      <p>
                        Status: {restaurant.contract.status === 'ACTIVE' ? 'Aktiv' : 'Inaktiv'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex space-x-3">
                    <button
                      onClick={handleUpgradeClick}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Tarif ändern
                    </button>
                    
                    <button
                      onClick={handleCancelSubscription}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Kündigen
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tarifänderung */}
            {isUpgrading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-xl shadow-sm p-6 mb-8 overflow-hidden"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Tarif ändern</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {DIGISTORE_MONTHLY_URL && (
                    <a
                      href={String(appendCustom(DIGISTORE_MONTHLY_URL))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border rounded-xl p-6 flex items-center justify-between hover:border-primary-500 transition-colors"
                    >
                      <span className="text-lg font-semibold text-gray-800">Monatlich</span>
                      <span className="px-4 py-2 bg-primary-600 text-white rounded-lg">Zur Zahlung</span>
                    </a>
                  )}
                  {DIGISTORE_YEARLY_URL && (
                    <a
                      href={String(appendCustom(DIGISTORE_YEARLY_URL))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border rounded-xl p-6 flex items-center justify-between hover:border-primary-500 transition-colors"
                    >
                      <span className="text-lg font-semibold text-gray-800">Jährlich</span>
                      <span className="px-4 py-2 bg-primary-600 text-white rounded-lg">Zur Zahlung</span>
                    </a>
                  )}
                </div>

              </motion.div>
            )}
            
            {/* Rechnungen */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Rechnungen</h2>
              
              {restaurant.invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FiFileText className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-700">Keine Rechnungen vorhanden</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktion</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {restaurant.invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(invoice.date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatAmount(invoice.amount, invoice.currency)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a 
                              href={invoice.downloadUrl}
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
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createClient(context);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata.role !== 'RESTAURANT') {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  const prisma = new PrismaClient();

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        contractStatus: true,
        plan: true,
        contract: {
          select: {
            id: true,
            status: true,
            startDate: true,
            trialEndDate: true,
            createdAt: true,
          }
        },
        invoices: {
          select: {
            id: true,
            amount: true,
            currency: true,
            date: true,
            downloadUrl: true,
          },
          orderBy: {
            date: 'desc',
          }
        }
      }
    });

    if (!restaurant) {
      return {
        notFound: true,
      };
    }

    // Serialize date fields
    const serializedRestaurant = {
      ...restaurant,
      contract: restaurant.contract ? {
        ...restaurant.contract,
        startDate: restaurant.contract.startDate.toISOString(),
        trialEndDate: restaurant.contract.trialEndDate?.toISOString() || null,
        createdAt: restaurant.contract.createdAt.toISOString(),
      } : null,
      invoices: restaurant.invoices.map(invoice => ({
        ...invoice,
        date: invoice.date.toISOString(),
      })),
    };

    return {
      props: {
        restaurant: serializedRestaurant,
      },
    };
  } catch (error) {
    console.error('Error fetching restaurant subscription data:', error);
    return {
      notFound: true,
    };
  } finally {
    await prisma.$disconnect();
  }
};
