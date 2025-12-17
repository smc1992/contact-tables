import { useState, useCallback, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { PrismaClient } from '@prisma/client';
import type { Contract } from '@prisma/client';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { FiFileText, FiDownload, FiAlertCircle, FiCheckCircle, FiInfo, FiUpload, FiTrash2, FiLoader } from 'react-icons/fi';
import axios from 'axios';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import RestaurantSidebar from '../../../components/restaurant/RestaurantSidebar';
import { createClient } from '@/utils/supabase/server';

// Manually define DocumentData to circumvent TS server caching issues
interface DocumentData {
  id: string;
  title: string;
  url: string;
  storagePath: string;
  fileType: string;
  fileSize: number;
  restaurantId: string;
  createdAt: string; // Dates from API are strings
  updatedAt: string; // Dates from API are strings
}

interface RestaurantData {
  id: string;
  name: string;
  isActive: boolean;
  contractStatus: string;
  contract: Contract | null;
  contractAcceptedAt: string | null; // Dates are serialized to strings
}

interface DocumentsPageProps {
  restaurant: RestaurantData;
}

export default function RestaurantDocuments({ restaurant }: DocumentsPageProps) {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/restaurant/documents');
      setDocuments(response.data);
    } catch (err) {
      setError('Fehler beim Laden der Dokumente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setSuccess('');
    setError('');

    try {
      await axios.post('/api/restaurant/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Datei erfolgreich hochgeladen.');
      fetchDocuments(); // Refresh the list
    } catch (err) {
      setError('Fehler beim Hochladen der Datei.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  }, [fetchDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    disabled: isUploading 
  });

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Möchten Sie dieses Dokument wirklich löschen?')) return;

    setSuccess('');
    setError('');

    try {
      await axios.delete(`/api/restaurant/documents?id=${docId}`);
      setSuccess('Dokument erfolgreich gelöscht.');
      setDocuments(docs => docs.filter(doc => doc.id !== docId)); // Optimistic update
    } catch (err) {
      setError('Fehler beim Löschen des Dokuments.');
      console.error(err);
    }
  };

  const formatDate = (dateString: string | Date | null) => {
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
              <p className="text-gray-600 mt-2">Verwalten Sie Ihren Vertrag und wichtige Dokumente für Ihr Restaurant.</p>
            </div>

            {success && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center">
                <FiCheckCircle className="mr-2" /> <p>{success}</p>
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg flex items-center">
                <FiAlertCircle className="mr-2" /> <p>{error}</p>
              </motion.div>
            )}

            {/* Vertragsinformationen (simplified as documents are the focus) */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Vertragsdetails</h2>
              {restaurant.contract ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div><p className="text-sm text-gray-500">Status</p><p className={`font-medium ${restaurant.contract.status === 'ACTIVE' ? 'text-green-600' : 'text-amber-600'}`}>{restaurant.contract.status}</p></div>
                   <div><p className="text-sm text-gray-500">Startdatum</p><p className="font-medium">{formatDate(restaurant.contract.startDate)}</p></div>
                   <div><p className="text-sm text-gray-500">Probezeitende</p><p className="font-medium">{formatDate(restaurant.contract.trialEndDate)}</p></div>
                   <div><p className="text-sm text-gray-500">Unterzeichnet am</p><p className="font-medium">{formatDate(restaurant.contractAcceptedAt)}</p></div>
                </div>
              ) : (
                <p className="text-gray-500">Keine Vertragsinformationen verfügbar.</p>
              )}
            </div>

            {/* Dokumenten-Upload */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Dokumente hochladen</h2>
              <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'} ${isUploading ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                <input {...getInputProps()} />
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <FiLoader className="animate-spin text-4xl text-gray-400 mb-2" />
                    <p className="text-gray-600">Wird hochgeladen...</p>
                  </div>
                ) : (
                  <>
                    <FiUpload className="mx-auto text-4xl text-gray-400 mb-2" />
                    {isDragActive ? <p className="text-blue-600">Dateien hier ablegen...</p> : <p className="text-gray-500">Dateien hierher ziehen oder klicken, um sie auszuwählen.</p>}
                  </>
                )}
              </div>
            </div>

            {/* Dokumentenliste */}
            <div className="bg-white shadow-md rounded-lg">
              <h2 className="text-xl font-semibold text-gray-700 p-6">Ihre Dokumente</h2>
              {isLoading ? (
                <div className="text-center p-6"><FiLoader className="animate-spin mx-auto text-gray-400" size={24} /></div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <li key={doc.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center">
                          <FiFileText className="text-gray-500 mr-4 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-800 break-all">{doc.title}</p>
                            <p className="text-sm text-gray-500">Hochgeladen am: {formatDate(doc.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 ml-4">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-gray-100"><FiDownload /></a>
                          <button onClick={() => handleDelete(doc.id)} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-gray-100"><FiTrash2 /></button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-6 py-4 text-center text-gray-500">Keine Dokumente gefunden.</li>
                  )}
                </ul>
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
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  const prisma = new PrismaClient();
  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        isActive: true,
        contractStatus: true,
        contract: true,
        contractAcceptedAt: true,
      },
    });

    if (!restaurant) {
      return { redirect: { destination: '/restaurant/register', permanent: false } };
    }

    // Documents are now fetched on the client-side
    return {
      props: {
        restaurant: JSON.parse(JSON.stringify(restaurant)), // Serialize date objects
      },
    };
  } catch (error) {
    console.error('Error fetching restaurant in documents page:', error);
    return { redirect: { destination: '/error', permanent: false } };
  } finally {
    await prisma.$disconnect();
  }
};
