import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';
import { motion } from 'framer-motion';
import { useAuth } from '../../../../contexts/AuthContext';
import AdminSidebar from '../../../../components/AdminSidebar';
import { FiArrowLeft, FiCheck, FiX, FiFlag, FiTrash2, FiUser, FiCalendar, FiAlertTriangle, FiFileText } from 'react-icons/fi';

interface Comment {
  id: string;
  content: string;
  status: string;
  contentType: string;
  contentId: string;
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
  relatedContent?: any;
}

export default function AdminCommentDetailPage() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [comment, setComment] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Kommentar laden
  useEffect(() => {
    const fetchComment = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/moderation/comments/${id}`);
        
        if (!response.ok) {
          throw new Error('Fehler beim Laden des Kommentars');
        }
        
        const data = await response.json();
        setComment(data);
        setAdminComment(data.adminComment || '');
      } catch (err) {
        console.error('Fehler beim Laden des Kommentars:', err);
        setError('Der Kommentar konnte nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchComment();
    }
  }, [id]);
  
  // Authentifizierung prüfen
  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push('/auth/login');
      } else if (user && user.user_metadata?.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [authLoading, session, router, user]);
  
  // Kommentarstatus aktualisieren
  const updateCommentStatus = async (status: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/moderation/comments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, adminComment })
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren des Status');
      }
      
      const updatedComment = await response.json();
      setComment(updatedComment);
      
      // Erfolgsmeldung anzeigen
      alert(`Kommentarstatus wurde auf "${status}" aktualisiert.`);
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Status:', err);
      setError('Der Status konnte nicht aktualisiert werden.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Kommentar löschen
  const deleteComment = async () => {
    if (!confirm('Möchten Sie diesen Kommentar wirklich löschen?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/moderation/comments/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Kommentars');
      }
      
      // Zurück zur Übersicht
      router.push('/admin/moderation/comments');
    } catch (err) {
      console.error('Fehler beim Löschen des Kommentars:', err);
      setError('Der Kommentar konnte nicht gelöscht werden.');
    } finally {
      setActionLoading(false);
    }
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
  
  // Inhaltstyp-Badge anzeigen
  const renderContentTypeBadge = (contentType: string) => {
    let badgeClass = '';
    let typeText = '';
    
    switch (contentType) {
      case 'REVIEW':
        badgeClass = 'bg-blue-100 text-blue-800';
        typeText = 'Bewertung';
        break;
      case 'BLOG':
        badgeClass = 'bg-purple-100 text-purple-800';
        typeText = 'Blog';
        break;
      case 'FORUM':
        badgeClass = 'bg-indigo-100 text-indigo-800';
        typeText = 'Forum';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800';
        typeText = contentType;
    }
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>
        {typeText}
      </span>
    );
  };
  
  if (loading || authLoading) {
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
                  onClick={() => router.push('/admin/moderation/comments')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <FiArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Kommentardetails</h1>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => updateCommentStatus('APPROVED')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <FiCheck className="mr-2 h-4 w-4" />
                  Genehmigen
                </button>
                <button 
                  onClick={() => updateCommentStatus('REJECTED')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <FiX className="mr-2 h-4 w-4" />
                  Ablehnen
                </button>
                <button 
                  onClick={() => updateCommentStatus('FLAGGED')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  <FiFlag className="mr-2 h-4 w-4" />
                  Markieren
                </button>
                <button 
                  onClick={deleteComment}
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
            
            {comment ? (
              <div className="space-y-6">
                {/* Kommentardetails */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Kommentardetails</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Details und Inhalt des Kommentars
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {renderContentTypeBadge(comment.contentType)}
                      {renderStatusBadge(comment.status)}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Inhalt</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {comment.content}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Erstellt am</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {new Date(comment.createdAt).toLocaleString('de-DE')}
                        </dd>
                      </div>
                      {comment.moderatedAt && (
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Moderiert am</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {new Date(comment.moderatedAt).toLocaleString('de-DE')}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
                
                {/* Zugehöriger Inhalt */}
                {comment.relatedContent && (
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Zugehöriger Inhalt</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Details zum Inhalt, zu dem der Kommentar gehört
                      </p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                      <dl className="sm:divide-y sm:divide-gray-200">
                        {comment.contentType === 'REVIEW' && (
                          <>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Bewertung für</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                                <FiFileText className="mr-1 h-4 w-4 text-gray-400" />
                                {comment.relatedContent.restaurant?.name || 'Unbekanntes Restaurant'}
                              </dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Aktionen</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                <button
                                  onClick={() => router.push(`/admin/moderation/reviews/${comment.contentId}`)}
                                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  Bewertung anzeigen
                                </button>
                              </dd>
                            </div>
                          </>
                        )}
                        
                        {comment.contentType === 'BLOG' && (
                          <>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Blog-Titel</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                                <FiFileText className="mr-1 h-4 w-4 text-gray-400" />
                                {comment.relatedContent.title || 'Unbekannter Blog-Beitrag'}
                              </dd>
                            </div>
                          </>
                        )}
                      </dl>
                    </div>
                  </div>
                )}
                
                {/* Benutzerinformationen */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Benutzer</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Details zum Benutzer, der den Kommentar verfasst hat
                    </p>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Name</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                          <FiUser className="mr-1 h-4 w-4 text-gray-400" />
                          {comment.user.firstName} {comment.user.lastName}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {comment.user.email}
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Registriert seit</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                          <FiCalendar className="mr-1 h-4 w-4 text-gray-400" />
                          {new Date(comment.user.createdAt).toLocaleDateString('de-DE')}
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
                      Meldungen zu diesem Kommentar
                    </p>
                  </div>
                  <div className="border-t border-gray-200">
                    {comment.reports.length === 0 ? (
                      <div className="px-4 py-5 sm:px-6 text-sm text-gray-500">
                        Keine Meldungen vorhanden
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {comment.reports.map((report) => (
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
                      placeholder="Interner Kommentar zum Kommentar..."
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-500">Kommentar nicht gefunden</p>
              </div>
            )}
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
