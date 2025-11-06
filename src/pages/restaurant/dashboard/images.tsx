import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { createClient } from '../../../utils/supabase/server';
import { motion } from 'framer-motion';
import { FiUpload, FiTrash2, FiImage, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import RestaurantSidebar from '../../../components/restaurant/RestaurantSidebar';
import { useAuth } from '../../../contexts/AuthContext';

// Type definitions
interface Image {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface RestaurantData {
  id: string;
  name: string;
  imageUrl: string | null;
  images: Image[];
}

interface ImagesPageProps {
  restaurant: RestaurantData | null;
  error?: string;
}

const RestaurantImages = ({ restaurant: initialRestaurant, error: initialError }: ImagesPageProps) => {
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [images, setImages] = useState<Image[]>(initialRestaurant?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(initialError || '');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (initialRestaurant) {
        setImages(initialRestaurant.images);
    }
  }, [initialRestaurant]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!session || !initialRestaurant) {
      setError('Nicht authentifiziert oder Restaurant nicht gefunden.');
      return;
    }
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('restaurantId', initialRestaurant.id);
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch('/api/restaurant/upload-images', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Hochladen der Bilder');
      }

      const newImages = await response.json();
      setUploadProgress(100);
      setImages(prev => [...prev, ...newImages]);
      setSuccess(`${newImages.length} Bild(er) erfolgreich hochgeladen.`);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1500);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!session || !initialRestaurant) {
      setError('Nicht authentifiziert oder Restaurant nicht gefunden.');
      return;
    }
    if (!confirm('Sind Sie sicher, dass Sie dieses Bild löschen möchten?')) {
      return;
    }

    const originalImages = images;
    setError('');
    setSuccess('');

    // Optimistic UI update
    setImages(prev => prev.filter(img => img.id !== imageId));

    try {
      const response = await fetch('/api/restaurant/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageId, restaurantId: initialRestaurant.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Löschen des Bildes');
      }

      setSuccess('Bild erfolgreich gelöscht.');

    } catch (err: any) {
      setError(err.message);
      // Revert on error
      setImages(originalImages);
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    if (!session || !initialRestaurant) {
      setError('Nicht authentifiziert oder Restaurant nicht gefunden.');
      return;
    }
    
    const currentPrimary = images.find(img => img.isPrimary);
    if (currentPrimary?.id === imageId) return;

    const originalImages = images;
    setError('');
    setSuccess('');

    // Optimistic UI update
    setImages(prev => 
      prev.map(img => ({
        ...img,
        isPrimary: img.id === imageId
      }))
    );

    try {
      const response = await fetch('/api/restaurant/images', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageId, 
          restaurantId: initialRestaurant.id,
          imageUrl: images.find(img => img.id === imageId)?.url
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Festlegen des Hauptbildes');
      }

      setSuccess('Hauptbild erfolgreich festgelegt.');

    } catch (err: any) {
      setError(err.message);
      // Revert on error
      setImages(originalImages);
    }
  };

  if (!initialRestaurant) {
    return (
        <div className="min-h-screen bg-neutral-50">
            <Header />
            <div className="flex flex-col md:flex-row">
                <RestaurantSidebar activeItem="images" />
                <main className="flex-1 pt-20 px-4 md:px-8 pb-12">
                    <div className="max-w-5xl mx-auto text-center">
                        <FiAlertCircle className="mx-auto text-red-500 mb-4" size={56} />
                        <h1 className="text-2xl font-bold text-secondary-600">Fehler</h1>
                        <p className="text-secondary-500 mt-2">{error || 'Restaurant nicht gefunden oder Sie haben keine Berechtigung.'}</p>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
  }

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
            
            <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-primary-100">
              <h2 className="text-xl font-semibold text-secondary-500 mb-4">Bilder hochladen</h2>
              
              <div className="border-2 border-dashed border-primary-200 rounded-lg p-8 text-center bg-primary-50 hover:bg-primary-100 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/jpeg,image/png,image/gif"
                  className="hidden"
                  id="image-upload"
                  disabled={isUploading}
                />
                
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer flex flex-col items-center justify-center ${isUploading ? 'cursor-not-allowed' : ''}`}
                >
                  <FiUpload className="text-primary-400 mb-4" size={48} />
                  <p className="text-secondary-600 font-medium mb-2">Bilder hier ablegen oder klicken</p>
                  <p className="text-secondary-400 text-sm">JPG, PNG, GIF - max 5MB</p>
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
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border border-primary-100">
              <h2 className="text-xl font-semibold text-secondary-500 mb-4">Ihre Bilder</h2>
              
              {images.length === 0 ? (
                <div className="text-center py-10 bg-primary-50 rounded-lg border border-primary-100">
                  <FiImage className="mx-auto text-primary-300 mb-4" size={56} />
                  <p className="text-secondary-600 font-medium text-lg">Keine Bilder vorhanden</p>
                  <p className="text-secondary-400 mt-2">
                    Laden Sie Bilder hoch, um Ihr Restaurant ansprechend zu präsentieren.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {images.map((image) => (
                    <div 
                      key={image.id} 
                      className={`relative group rounded-lg overflow-hidden shadow-sm border ${image.isPrimary ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-200'}`}>
                      <img 
                        src={image.url} 
                        alt={`Bild von ${initialRestaurant.name}`}
                        className="object-cover w-full h-full aspect-video"
                      />
                      
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center space-x-2">
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
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

export default RestaurantImages;

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  const supabase = createClient(context);

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('[GSSP images.tsx] User not found or error, redirecting to login.', userError);
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      image_url,
      restaurant_images ( id, url, is_primary )
    `)
    .eq('user_id', user.id)
    .single();

  if (error || !restaurant) {
    console.error(`[GSSP images.tsx] Failed to fetch restaurant for user ${user.id}. Error:`, error);
    return {
      props: {
        restaurant: null,
        error: 'Restaurant-Profil nicht gefunden. Bitte erstellen Sie zuerst ein Profil.',
      },
    };
  }

  const formattedRestaurant = {
    id: restaurant.id,
    name: restaurant.name,
    imageUrl: restaurant.image_url,
    images: restaurant.restaurant_images.map(img => ({
      id: img.id,
      url: img.url,
      isPrimary: img.is_primary,
    })),
  };

  return {
    props: {
      restaurant: formattedRestaurant,
    },
  };
};