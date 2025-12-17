import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';
import { motion } from 'framer-motion';
import { useAuth } from '../../../../contexts/AuthContext';
import AdminSidebar from '../../../../components/AdminSidebar';
import { FiArrowLeft, FiCheck, FiX, FiFlag, FiTrash2, FiUser, FiMapPin, FiCalendar, FiAlertTriangle } from 'react-icons/fi';
import { withAuth } from '../../../../utils/withAuth';
import { GetServerSideProps } from 'next';

interface Review {
  id: string;
  rating: number;
  content: string;
  status: string;
  createdAt: string;
  adminComment?: string;
  moderatedAt?: string;
  moderatedBy?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
  };
  restaurant: {
    id: string;
    name: string;
    address: string;
  };
  reports: Array<{
    id: string;
    reason: string;
    description: string;
    createdAt: string;
    reportedBy: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

const AdminReviewDetailPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<Review | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState('');

  useEffect(() => {
    const fetchReview = async (reviewId: string) => {
      try {
        const response = await fetch(`/api/admin/moderation/reviews/${reviewId}`);
        
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Bewertung');
        }
        
        const data = await response.json();
        setReview(data);
        setAdminComment(data.adminComment || '');
      } catch (err) {
        console.error('Fehler beim Laden der Bewertung:', err);
        setError('Die Bewertung konnte nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchReview(id as string);
    }
  }, [id]);
  
  // Authentifizierung wird jetzt serverseitig über withAuth gehandhabt
  
  // Bewertungsstatus aktualisieren
  const updateReviewStatus = async (status: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/moderation/reviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, adminComment })
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren des Status');
      }
      
      const updatedReview = await response.json();
      setReview(updatedReview);
      
      // Erfolgsmeldung anzeigen
      alert(`Bewertungsstatus wurde auf "${status}" aktualisiert.`);
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Status:', err);
      setError('Der Status konnte nicht aktualisiert werden.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Bewertung löschen
  const deleteReview = async () => {
    if (!confirm('Möchten Sie diese Bewertung wirklich löschen?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/moderation/reviews/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Löschen der Bewertung');
      }
      
      // Zurück zur Übersicht
      router.push('/admin/moderation/reviews');
    } catch (err) {
      console.error('Fehler beim Löschen der Bewertung:', err);
      setError('Die Bewertung konnte nicht gelöscht werden.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Sternbewertung anzeigen
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`h-5 w-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };
  
  // Status-Badge anzeigen
  const renderStatusBadge = (status: string) => {
    let badgeClass = '';
    let statusText = '';
    
    switch (status) {
      case 'APPROVED':
        badgeClass = 'bg-green-100 text-green-800';
        statusText = 'Genehmigt';
        break;
      case 'REJECTED':
        badgeClass = 'bg-red-100 text-red-800';
        statusText = 'Abgelehnt';
        break;
      case 'PENDING':
        badgeClass = 'bg-yellow-100 text-yellow-800';
        statusText = 'Ausstehend';
        break;
      case 'FLAGGED':
        badgeClass = 'bg-orange-100 text-orange-800';
        statusText = 'Markiert';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800';
        statusText = status;
    }
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>
        {statusText}
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-lg">Laden...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-col md:flex-row flex-grow">
        <AdminSidebar activeItem="moderation" />
        
        <main className="flex-grow bg-gray-50 py-6 px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <button 
                  onClick={() => router.push('/admin/moderation/reviews')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <FiArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Bewertungsdetails</h1>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => updateReviewStatus('APPROVED')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <FiCheck className="mr-2 h-4 w-4" />
                  Genehmigen
                </button>
                <button 
                  onClick={() => updateReviewStatus('REJECTED')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <FiX className="mr-2 h-4 w-4" />
                  Ablehnen
                </button>
                <button 
                  onClick={() => updateReviewStatus('FLAGGED')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  <FiFlag className="mr-2 h-4 w-4" />
                  Markieren
                </button>
                <button 
                  onClick={deleteReview}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <FiTrash2 className="mr-2 h-4 w-4" />
                  Löschen
                </button>
              </div>
            </div>
            
            {/* Fehlermeldung */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiX className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {review ? (
              <div className="space-y-6">
                {/* Bewertungsdetails */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Bewertungsdetails</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Details und Inhalt der Bewertung
                      </p>
                    </div>
                    <div>
                      {renderStatusBadge(review.status)}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Bewertung</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {renderStars(review.rating)}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Inhalt</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {review.content}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Erstellt am</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {new Date(review.createdAt).toLocaleString('de-DE')}
                        </dd>
                      </div>
                      {review.moderatedAt && (
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Moderiert am</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {new Date(review.moderatedAt).toLocaleString('de-DE')}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
                
                {/* Restaurant-Informationen */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Restaurant</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Details zum bewerteten Restaurant
                    </p>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Name</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {review.restaurant.name}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                          <FiMapPin className="mr-1 h-4 w-4 text-gray-400" />
                          {review.restaurant.address}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                {/* Benutzerinformationen */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Benutzer</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Details zum Benutzer, der die Bewertung verfasst hat
                    </p>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Name</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                          <FiUser className="mr-1 h-4 w-4 text-gray-400" />
                          {review.user.firstName} {review.user.lastName}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {review.user.email}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Registriert seit</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                          <FiCalendar className="mr-1 h-4 w-4 text-gray-400" />
                          {new Date(review.user.createdAt).toLocaleDateString('de-DE')}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                {/* Meldungen */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Meldungen</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Meldungen zu dieser Bewertung
                    </p>
                  </div>
                  <div className="border-t border-gray-200">
                    {review.reports.length === 0 ? (
                      <div className="px-4 py-5 sm:px-6 text-sm text-gray-500">
                        Keine Meldungen vorhanden
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {review.reports.map((report) => (
                          <li key={report.id} className="px-4 py-4 sm:px-6">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 pt-0.5">
                                <FiAlertTriangle className="h-5 w-5 text-red-500" />
                              </div>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {report.reason}
                                </p>
                                <p className="mt-1 text-sm text-gray-600">
                                  {report.description}
                                </p>
                                <div className="mt-2 text-sm text-gray-500 flex justify-between">
                                  <span>
                                    Gemeldet von: {report.reportedBy.firstName} {report.reportedBy.lastName}
                                  </span>
                                  <span>
                                    {new Date(report.createdAt).toLocaleString('de-DE')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                
                {/* Admin-Kommentar */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Admin-Kommentar</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Interner Kommentar zur Moderation
                    </p>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      rows={4}
                      className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Interner Kommentar zur Bewertung..."
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-500">Bewertung nicht gefunden</p>
              </div>
            )}
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'],
  async (context, user) => {
    return {
      props: {}
    };
  }
);

export default AdminReviewDetailPage;
