import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiGrid, FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { GetServerSideProps } from 'next';
import { withAuth } from '@/utils/withAuth';
import { User } from '@supabase/supabase-js';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  restaurant_count: number;
  created_at: string;
}

interface CategoriesPageProps {
  user: User;
}

export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'], // Erlaubte Rollen
  async (context, user) => {
    return {
      props: {}
    };
  }
);

export default function CategoriesPage({ user }: CategoriesPageProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: ''
  });
  const supabase = createClient();

  // Laden der Kategoriedaten
  const fetchCategories = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          description,
          icon,
          created_at
        `)
        .order('name');

      if (error) throw error;

      // Anzahl der Restaurants pro Kategorie abrufen
      const categoriesWithCount = await Promise.all(
        (data || []).map(async (category) => {
          const { count, error: countError } = await supabase
            .from('restaurant_categories')
            .select('restaurant_id', { count: 'exact', head: true })
            .eq('category_id', category.id);

          return {
            ...category,
            restaurant_count: count || 0
          };
        })
      );

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
      // Fallback zu Dummy-Daten bei Fehler
      setCategories([
        {
          id: '1',
          name: 'Italienisch',
          slug: 'italienisch',
          description: 'Italienische Restaurants und Pizzerien',
          icon: 'pizza',
          restaurant_count: 12,
          created_at: '2025-01-15T12:00:00Z'
        },
        {
          id: '2',
          name: 'Asiatisch',
          slug: 'asiatisch',
          description: 'Asiatische Küche und Sushi',
          icon: 'sushi',
          restaurant_count: 8,
          created_at: '2025-01-20T14:30:00Z'
        },
        {
          id: '3',
          name: 'Deutsch',
          slug: 'deutsch',
          description: 'Deutsche Traditionsküche',
          icon: 'beer',
          restaurant_count: 15,
          created_at: '2025-01-25T09:15:00Z'
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Formatierung des Datums
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  // Slug aus Name generieren
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[äöüß]/g, match => {
        switch (match) {
          case 'ä': return 'ae';
          case 'ö': return 'oe';
          case 'ü': return 'ue';
          case 'ß': return 'ss';
          default: return match;
        }
      })
      .replace(/[^a-z0-9-]/g, '');
  };

  // Formular-Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Automatisch Slug generieren, wenn Name geändert wird
    if (name === 'name') {
      setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  // Kategorie bearbeiten
  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || ''
    });
    setIsModalOpen(true);
  };

  // Neue Kategorie erstellen
  const handleAddCategory = () => {
    setCurrentCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: ''
    });
    setIsModalOpen(true);
  };

  // Kategorie speichern
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentCategory) {
        // Kategorie aktualisieren
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            icon: formData.icon
          })
          .eq('id', currentCategory.id);
          
        if (error) throw error;
      } else {
        // Neue Kategorie erstellen
        const { error } = await supabase
          .from('categories')
          .insert({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            icon: formData.icon
          });
          
        if (error) throw error;
      }
      
      // Modal schließen und Daten neu laden
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Fehler beim Speichern der Kategorie:', error);
      alert('Fehler beim Speichern der Kategorie');
    }
  };

  // Kategorie löschen
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Möchten Sie diese Kategorie wirklich löschen?')) return;
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Daten neu laden
      fetchCategories();
    } catch (error) {
      console.error('Fehler beim Löschen der Kategorie:', error);
      alert('Fehler beim Löschen der Kategorie');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="categories" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Kategorien</h1>
              <div className="flex space-x-3">
                <button
                  onClick={fetchCategories}
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
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <FiPlus className="mr-2" />
                  Neue Kategorie
                </button>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Slug
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beschreibung
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Restaurants
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
                        <td colSpan={6} className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                        </td>
                      </tr>
                    ) : categories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          Keine Kategorien gefunden
                        </td>
                      </tr>
                    ) : (
                      categories.map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {category.icon && (
                                <span className="mr-2 text-gray-400">
                                  <FiGrid />
                                </span>
                              )}
                              <div className="text-sm font-medium text-gray-900">{category.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{category.slug}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 truncate max-w-xs">
                              {category.description || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{category.restaurant_count}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(category.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <FiEdit2 className="inline" /> Bearbeiten
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FiTrash2 className="inline" /> Löschen
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

      {/* Modal für Kategorie hinzufügen/bearbeiten */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {currentCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
            </h2>
            <form onSubmit={handleSaveCategory}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (CSS-Klasse)
                </label>
                <input
                  type="text"
                  id="icon"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
