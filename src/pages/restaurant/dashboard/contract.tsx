import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { createClient as createServerClient } from '../../../utils/supabase/server';
import { createClient as createBrowserClient } from '../../../utils/supabase/client';
import { FiDownload, FiFileText, FiCheck, FiAlertCircle, FiEye } from 'react-icons/fi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import RestaurantSidebar from '../../../components/restaurant/RestaurantSidebar';

interface Contract {
  id: string;
  title: string;
  content: string;
  version: string;
  status: string;
  created_at: string;
  signed_at?: string;
}

interface RestaurantData {
  id: string;
  name: string;
  address: string;
  city: string;
  contractStatus: string;
}

interface ContractPageProps {
  restaurant: RestaurantData;
  contracts: Contract[];
}

export default function ContractDashboard({ restaurant, contracts }: ContractPageProps) {
  const supabase = createBrowserClient();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(contracts[0] || null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAcceptContract = async () => {
    if (!selectedContract) return;
    
    setIsAccepting(true);
    setMessage(null);

    try {
      // Typsichere Wrapper-Funktion für den RPC-Call
      const updateContractSignature = async (params: {
        contract_id: string;
        restaurant_id: string;
        restaurant_name: string;
      }) => {
        const result = await (supabase.rpc as any)('update_contract_signature', params);
        return result;
      };

      const { error } = await updateContractSignature({
        contract_id: selectedContract.id,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Vertrag erfolgreich akzeptiert! Vielen Dank für Ihre Teilnahme.'
      });

      // Aktualisiere den lokalen Status
      setSelectedContract({
        ...selectedContract,
        status: 'SIGNED',
        signed_at: new Date().toISOString()
      });

    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Fehler beim Akzeptieren des Vertrags. Bitte versuchen Sie es später erneut.'
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDownloadContract = () => {
    if (!selectedContract) return;
    
    // Erstelle einen Download-Link für den Vertrag als Textdatei
    const blob = new Blob([selectedContract.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Teilnahmevertrag_${restaurant.name.replace(/\s+/g, '_')}_${selectedContract.version}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatContractContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('##')) {
        return <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-gray-800">{line.replace('##', '').trim()}</h3>;
      } else if (line.startsWith('#')) {
        return <h2 key={index} className="text-xl font-bold mt-8 mb-4 text-gray-900">{line.replace('#', '').trim()}</h2>;
      } else if (line.startsWith('-')) {
        return <li key={index} className="ml-6 mb-2 text-gray-700">{line.replace('-', '').trim()}</li>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <p key={index} className="mb-3 text-gray-700 leading-relaxed">{line}</p>;
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex flex-col md:flex-row">
        <RestaurantSidebar activeItem="contract" />
        
        <main className="flex-1 px-4 md:px-8 pb-12 mt-16">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="bg-white shadow-lg rounded-lg mb-6 overflow-hidden border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Verträge & Dokumente</h1>
                    <p className="text-gray-600 mt-2">
                      Verwalten Sie Ihre Teilnahmeverträge und rechtlichen Dokumente
                    </p>
                  </div>
                  <FiFileText className="text-gray-400" size={32} />
                </div>
              </div>
            </div>

            {/* Status Nachricht */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center">
                  {message.type === 'success' ? (
                    <FiCheck className="mr-2" size={20} />
                  ) : (
                    <FiAlertCircle className="mr-2" size={20} />
                  )}
                  <span>{message.text}</span>
                </div>
              </div>
            )}

            {/* Vertragsauswahl */}
            {contracts.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Verfügbare Verträge</h2>
                <div className="space-y-3">
                  {contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedContract?.id === contract.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedContract(contract)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-800">{contract.title}</h3>
                          <p className="text-sm text-gray-500">
                            Version {contract.version} • Status: {
                              contract.status === 'ACTIVE' ? 'Aktiv' :
                              contract.status === 'SIGNED' ? 'Unterzeichnet' :
                              contract.status === 'DRAFT' ? 'Entwurf' : contract.status
                            }
                          </p>
                          {contract.signed_at && (
                            <p className="text-sm text-gray-500">
                              Unterzeichnet am: {new Date(contract.signed_at).toLocaleDateString('de-DE')}
                            </p>
                          )}
                        </div>
                        <FiEye className="text-gray-400" size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vertragsdetails */}
            {selectedContract && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Vertrags-Header */}
                <div className="bg-primary-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{selectedContract.title}</h2>
                      <p className="text-primary-200 mt-1">
                        Version {selectedContract.version} • erstellt am {new Date(selectedContract.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadContract}
                      className="flex items-center px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-md font-medium transition-colors"
                    >
                      <FiDownload className="mr-2" size={16} />
                      Herunterladen
                    </button>
                  </div>
                </div>

                {/* Vertragsinhalt */}
                <div className="p-8 max-h-96 overflow-y-auto">
                  <div className="prose prose-neutral max-w-none">
                    {formatContractContent(selectedContract.content)}
                  </div>
                </div>

                {/* Vertrags-Aktionen */}
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  {selectedContract.status === 'SIGNED' ? (
                    <div className="flex items-center text-green-700">
                      <FiCheck className="mr-2" size={20} />
                      <span className="font-medium">Dieser Vertrag wurde bereits unterzeichnet.</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">
                        Nach dem Akzeptieren dieses Vertrags können Sie die vollständigen Funktionen der Plattform nutzen.
                      </p>
                      <button
                        onClick={handleAcceptContract}
                        disabled={isAccepting}
                        className={`px-6 py-3 rounded-md font-medium transition-colors ${
                          isAccepting
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        {isAccepting ? 'Wird verarbeitet...' : 'Vertrag akzeptieren'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hinweis */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <FiAlertCircle className="text-blue-600 mt-0.5 mr-3" size={18} />
                <div className="text-blue-800 text-sm">
                  <p className="font-medium mb-1">Wichtiger Hinweis</p>
                  <p>
                    Dieser Teilnahmevertrag ergänzt die Allgemeinen Geschäftsbedingungen für Restaurants. 
                    Mit der Unterzeichnung bestätigen Sie, beide Dokumente gelesen und akzeptiert zu haben.
                  </p>
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
  const supabase = createServerClient(context);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      redirect: {
        destination: '/auth/login?redirect=/restaurant/dashboard/contract',
        permanent: false,
      },
    };
  }
  
  const userRole = user.user_metadata?.role;
  if (userRole !== 'RESTAURANT') {
    return {
      redirect: {
        destination: '/', 
        permanent: false,
      },
    };
  }
  
  try {
    // Restaurant-Daten abrufen
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, address, city, contract_status')
      .eq('userId', user.id)
      .single();

    if (restaurantError || !restaurantData) {
      return {
        redirect: {
          destination: '/restaurant/register?error=not_found',
          permanent: false,
        },
      };
    }

    // Verträge abrufen
    const { data: contractsData, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .eq('restaurant_id', restaurantData.id)
      .order('created_at', { ascending: false });

    const contracts = contractsData || [];

    return {
      props: {
        restaurant: {
          id: restaurantData.id,
          name: restaurantData.name,
          address: restaurantData.address || '',
          city: restaurantData.city || '',
          contractStatus: restaurantData.contract_status || 'PENDING',
        },
        contracts,
      },
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Vertragsdaten:', error);
    return {
      props: {
        error: 'Fehler beim Abrufen der Vertragsdaten',
        restaurant: null,
        contracts: [],
      },
    };
  }
};
