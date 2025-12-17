import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../../components/PageLayout';
import { userApi } from '../../utils/api';
import { FiEdit2, FiUser, FiPhone, FiMail } from 'react-icons/fi';

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Echten API-Aufruf verwenden
        const { data, error } = await userApi.getProfile();

        if (error) {
          console.error('Fehler beim Laden des Profils:', error);
          setError('Profilinformationen konnten nicht geladen werden.');
        } else {
          setProfile(data.profile);
        }
      } catch (err) {
        console.error('Fehler beim Laden des Profils:', err);
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, router]);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Mein Profil">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        {error ? (
          <div className="text-center py-8">
            <FiUser className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => router.reload()}
              className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
            >
              Erneut versuchen
            </button>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                {profile.name ? (
                  <span className="text-3xl font-bold text-gray-500">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <span className="text-3xl font-bold text-gray-500">U</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{profile.name || 'Benutzer'}</h2>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Rolle: {profile.role || 'Kunde'}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Persönliche Informationen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <FiUser className="mt-1 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{profile.name || 'Nicht angegeben'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FiMail className="mt-1 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">E-Mail</p>
                    <p className="font-medium">{user?.email}</p>
                    <p className="text-xs text-gray-500 mt-1">Die E-Mail-Adresse kann nicht geändert werden.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FiPhone className="mt-1 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-medium">{profile.phone || 'Nicht angegeben'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => router.push('/profile/edit')}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition flex items-center"
              >
                <FiEdit2 className="mr-2" /> Profil bearbeiten
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FiUser className="mx-auto text-4xl text-gray-300 mb-4" />
            <p>Profilinformationen konnten nicht geladen werden.</p>
            <button
              onClick={() => router.reload()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
            >
              Erneut versuchen
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
