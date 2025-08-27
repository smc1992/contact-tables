import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiEye } from 'react-icons/fi';
import { withAuth } from '@/utils/withAuth';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_id: string;
  author_name?: string;
  published: boolean;
  featured_image?: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export const getServerSideProps = withAuth(['ADMIN', 'admin'], async () => {
  return { props: {} as any };
});

export default function BlogsPage() {
  const router = useRouter();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Laden der Blog-Daten
  const fetchBlogPosts = async () => {
    setRefreshing(true);
    try {
      const resp = await fetch('/api/admin/blogs');
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.message || 'Fehler beim Laden');
      setBlogPosts(json.posts || []);
    } catch (error) {
      console.error('Fehler beim Laden der Blog-Beiträge:', error);
      // Fallback zu Dummy-Daten bei Fehler
      setBlogPosts([
        {
          id: '1',
          title: 'Die besten Restaurants in Berlin',
          slug: 'beste-restaurants-berlin',
          excerpt: 'Entdecken Sie die kulinarischen Highlights der Hauptstadt.',
          content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          author_id: '1',
          author_name: 'Max Mustermann',
          published: true,
          featured_image: '/images/blog/berlin-restaurants.jpg',
          created_at: '2025-07-15T12:00:00Z',
          updated_at: '2025-07-15T12:00:00Z',
          view_count: 1250
        },
        {
          id: '2',
          title: 'Vegetarische Küche im Trend',
          slug: 'vegetarische-kueche-trend',
          excerpt: 'Immer mehr Restaurants setzen auf vegetarische und vegane Optionen.',
          content: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
          author_id: '2',
          author_name: 'Anna Schmidt',
          published: true,
          featured_image: '/images/blog/vegetarische-kueche.jpg',
          created_at: '2025-07-10T09:30:00Z',
          updated_at: '2025-07-12T14:15:00Z',
          view_count: 980
        },
        {
          id: '3',
          title: 'Reservierungstipps für Restaurantbesuche',
          slug: 'reservierungstipps',
          excerpt: 'So sichern Sie sich den besten Tisch in Ihrem Lieblingsrestaurant.',
          content: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
          author_id: '1',
          author_name: 'Max Mustermann',
          published: false,
          featured_image: '/images/blog/reservierung.jpg',
          created_at: '2025-07-05T16:45:00Z',
          updated_at: '2025-07-05T16:45:00Z',
          view_count: 0
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Seite ist durch withAuth geschützt; einfach laden
    fetchBlogPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Formatierung des Datums
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  // Neuen Blog-Beitrag erstellen
  const handleCreatePost = () => {
    router.push('/admin/blogs/create');
  };

  // Blog-Beitrag bearbeiten
  const handleEditPost = (id: string) => {
    router.push(`/admin/blogs/edit/${id}`);
  };

  // Blog-Beitrag ansehen
  const handleViewPost = (slug: string) => {
    router.push(`/blog/${slug}`);
  };

  // Blog-Beitrag löschen
  const handleDeletePost = async (id: string) => {
    if (!confirm('Möchten Sie diesen Blog-Beitrag wirklich löschen?')) return;
    
    try {
      const resp = await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error((await resp.json())?.message || 'Fehler');
      
      // Daten neu laden
      fetchBlogPosts();
    } catch (error) {
      console.error('Fehler beim Löschen des Blog-Beitrags:', error);
      alert('Fehler beim Löschen des Blog-Beitrags');
    }
  };

  // Veröffentlichungsstatus ändern
  const togglePublishStatus = async (post: BlogPost) => {
    try {
      const resp = await fetch(`/api/admin/blogs/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !post.published }),
      });
      if (!resp.ok) throw new Error((await resp.json())?.message || 'Fehler');
      
      // Daten neu laden
      fetchBlogPosts();
    } catch (error) {
      console.error('Fehler beim Ändern des Veröffentlichungsstatus:', error);
      alert('Fehler beim Ändern des Veröffentlichungsstatus');
    }
  };

  // Kürzen des Textes
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="blogs" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Blog-Beiträge</h1>
              <div className="flex space-x-3">
                <button
                  onClick={fetchBlogPosts}
                  disabled={refreshing}
                  className={`px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {refreshing ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2" />
                      Wird aktualisiert...
                    </>
                  ) : (
                    'Aktualisieren'
                  )}
                </button>
                <button
                  onClick={handleCreatePost}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <FiPlus className="mr-2" />
                  Neuer Beitrag
                </button>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Titel
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Auszug
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Autor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aufrufe
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Erstellt am
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                        </td>
                      </tr>
                    ) : blogPosts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          Keine Blog-Beiträge gefunden
                        </td>
                      </tr>
                    ) : (
                      blogPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">{truncateText(post.title, 50)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{truncateText(post.excerpt, 60)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{post.author_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span 
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${post.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                              onClick={() => togglePublishStatus(post)}
                              style={{ cursor: 'pointer' }}
                            >
                              {post.published ? 'Veröffentlicht' : 'Entwurf'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{post.view_count}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(post.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewPost(post.slug)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              title="Ansehen"
                            >
                              <FiEye />
                            </button>
                            <button
                              onClick={() => handleEditPost(post.id)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                              title="Bearbeiten"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Löschen"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
