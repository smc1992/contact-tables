import { useState, useRef } from 'react';
import { GetServerSideProps } from 'next';
// import { getSession } from 'next-auth/react'; // Ersetzt durch Supabase
// import { PrismaClient } from '@prisma/client'; // Ersetzt durch Supabase
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { FiUpload, FiTrash2, FiImage, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import RestaurantSidebar from '../../../components/restaurant/RestaurantSidebar';

interface RestaurantData {
  id: string;
  name: string;
  imageUrl: string | null;
  images: {
    id: string;
    url: string;
    isPrimary: boolean;
  }[];
}

interface ImagesPageProps {
  restaurant: RestaurantData;
}

export default function RestaurantImages({ restaurant }: ImagesPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [images, setImages] = useState(restaurant.images || []);
  const [primaryImageId, setPrimaryImageId] = useState(
    restaurant.images?.find(img => img.isPrimary)?.id || null
  );

  // Simulierte Bildupload-Funktion (in der Produktion würde hier ein echter Upload zu einem Speicherdienst stattfinden)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    setSuccess('');

    try {
      // Simuliere Upload-Fortschritt
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      // Hier würde der eigentliche Upload zu einem Speicherdienst wie AWS S3 oder Cloudinary erfolgen
      // Für dieses Beispiel simulieren wir den Upload mit einer Verzögerung

      // Erstelle FormData für den Upload
      const formData = new FormData();
      formData.append('restaurantId', restaurant.id);
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      // API-Aufruf zum Hochladen der Bilder
      const response = await fetch('/api/restaurant/upload-images', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Hochladen der Bilder');
      }

      const data = await response.json();
      setUploadProgress(100);
      
      // Aktualisiere die Bilderliste
      setImages(prev => [...prev, ...data.images]);
      setSuccess('Bilder erfolgreich hochgeladen');

      // Formular zurücksetzen
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: unknown) {
      console.error('Fehler beim Hochladen der Bilder:', error);
      setError(
        error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten'
      );
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie dieses Bild löschen möchten?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/restaurant/delete-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageId,
          restaurantId: restaurant.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Löschen des Bildes');
      }

      // Entferne das Bild aus der lokalen Bilderliste
      setImages(prev => prev.filter(img => img.id !== imageId));
      
      // Falls das primäre Bild gelöscht wurde, setze primaryImageId zurück
      if (primaryImageId === imageId) {
        setPrimaryImageId(null);
      }
      
      setSuccess('Bild erfolgreich gelöscht');
    } catch (error: unknown) {
      console.error('Fehler beim Löschen des Bildes:', error);
      setError(
        error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten'
      );
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    if (primaryImageId === imageId) return;

    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/restaurant/set-primary-image', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageId,
          restaurantId: restaurant.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Festlegen des Hauptbildes');
      }

      // Aktualisiere den primaryImageId
      setPrimaryImageId(imageId);
      
      // Aktualisiere die isPrimary-Eigenschaft in der lokalen Bilderliste
      setImages(prev => 
        prev.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        }))
      );
      
      setSuccess('Hauptbild erfolgreich festgelegt');
    } catch (error: unknown) {
      console.error('Fehler beim Festlegen des Hauptbildes:', error);
      setError(
        error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten'
      );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="flex flex-col md:flex-row">
        <RestaurantSidebar activeItem="images" />
        
        <main className="flex-1 pt-20 px-4 md:px-8 pb-12">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-secondary-500">Bilder verwalten</h1>
              <p className="text-secondary-400 mt-2">
                Laden Sie Bilder Ihres Restaurants hoch, um Ihren Gästen einen authentischen Eindruck zu vermitteln.
              </p>
            </div>
            
            {/* Erfolgs- oder Fehlermeldung */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-primary-50 text-primary-700 rounded-lg shadow-sm border border-primary-200"
              >
                <div className="flex items-center">
                  <FiCheckCircle className="mr-3 text-primary-500" size={20} />
                  <p className="font-medium">{success}</p>
                </div>
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg shadow-sm border border-red-200"
              >
                <div className="flex items-center">
                  <FiAlertCircle className="mr-3 text-red-500" size={20} />
                  <p className="font-medium">{error}</p>
                </div>
              </motion.div>
            )}
            
            {/* Upload-Bereich */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-primary-100">
              <h2 className="text-xl font-semibold text-secondary-500 mb-4">Bilder hochladen</h2>
              
              <div className="border-2 border-dashed border-primary-200 rounded-lg p-8 text-center bg-primary-50 hover:bg-primary-100 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                />
                
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <FiUpload className="text-primary-400 mb-4" size={48} />
                  <p className="text-secondary-600 font-medium mb-2">Bilder hier ablegen oder klicken zum Hochladen</p>
                  <p className="text-secondary-400 text-sm">JPG, PNG oder GIF, maximal 5 MB pro Bild</p>
                </label>
                
                {isUploading && (
                  <div className="mt-6">
                    <div className="w-full bg-secondary-100 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                      <div 
                        className="bg-primary-500 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm font-medium text-secondary-500">{uploadProgress}% hochgeladen</p>
                  </div>
                )}
              </div>
              
              <p className="mt-4 text-sm text-secondary-500 bg-primary-50 p-3 rounded-lg border border-primary-100">
                <span className="font-medium">Tipp:</span> Wählen Sie Bilder, die Ihr Restaurant authentisch repräsentieren. Hochwertige Bilder von Innenraum, Außenbereich und Speisen helfen potenziellen Gästen, sich einen Eindruck zu verschaffen und fördern das Interesse an Contact Tables-Veranstaltungen in Ihrem Restaurant.
              </p>
            </div>
            
            {/* Bildergalerie */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-primary-100">
              <h2 className="text-xl font-semibold text-secondary-500 mb-4">Ihre Bilder</h2>
              
              {images.length === 0 ? (
                <div className="text-center py-10 bg-primary-50 rounded-lg border border-primary-100">
                  <FiImage className="mx-auto text-primary-300 mb-4" size={56} />
                  <p className="text-secondary-600 font-medium text-lg">Keine Bilder vorhanden</p>
                  <p className="text-secondary-400 mt-2">
                    Laden Sie Bilder hoch, um Ihr Restaurant ansprechend zu präsentieren
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {images.map((image) => (
                    <div 
                      key={image.id} 
                      className={`relative group rounded-lg overflow-hidden shadow-sm border ${
                        image.isPrimary ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-200'
                      }`}
                    >
                      <div className="aspect-w-16 aspect-h-9">
                        <img 
                          src={image.url} 
                          alt={`Bild von ${restaurant.name}`}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        {!image.isPrimary && (
                          <button
                            onClick={() => handleSetPrimaryImage(image.id)}
                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                            title="Als Hauptbild festlegen"
                          >
                            <FiImage size={18} />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                          title="Bild löschen"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                      
                      {image.isPrimary && (
                        <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                          Hauptbild
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {images.length > 0 && (
                <p className="mt-6 text-sm text-gray-600">
                  Tipp: Das Hauptbild wird in der Restaurantübersicht und in Suchergebnissen angezeigt. Klicken Sie auf ein Bild und wählen Sie "Als Hauptbild festlegen", um es zu ändern.
                </p>
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
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return context.req.cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          context.res.setHeader('Set-Cookie', `${name}=${value}; ${Object.entries(options).map(([k,v]) => `${k}=${v}`).join('; ')}`);
        },
        remove(name: string, options: CookieOptions) {
          context.res.setHeader('Set-Cookie', `${name}=; ${Object.entries(options).map(([k,v]) => `${k}=${v}`).join('; ')}`);
        },
      },
      cookieOptions: {
        name: 'contact-tables-auth',
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log('getServerSideProps (images): No user or error, redirecting to login.');
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  const userRole = user.user_metadata?.data?.role as string || user.user_metadata?.role as string || 'CUSTOMER';
  if (userRole !== 'RESTAURANT') {
    console.log(`getServerSideProps (images): User role ${userRole} not RESTAURANT, redirecting to /.`);
    return { redirect: { destination: '/', permanent: false } };
  }

  let restaurantData;
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        id,
        name,
        image_url
      `)
      .eq('userId', user.id)
      .single();

    if (error) throw error;
    if (!data) {
      console.error('Kein Restaurant gefunden für Supabase Benutzer:', user.id);
      return { notFound: true };
    }
    // Map Supabase data to RestaurantData interface
    restaurantData = {
      id: data.id,
      name: data.name,
      imageUrl: data.image_url,
      images: [], // Temporär, da die Bildtabelle fehlt
    };

  } catch (error) {
    console.error('Fehler beim Laden der Restaurantdaten (images) in getServerSideProps:', error);
    // Optional: spezifischere Fehlerbehandlung oder Props.error setzen
    return { notFound: true }; 
  }

  return {
    props: {
      restaurant: restaurantData,
    },
  };
};
