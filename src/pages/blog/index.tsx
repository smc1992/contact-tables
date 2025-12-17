import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { GetServerSideProps } from 'next';
import { createClient as createServerClient } from '@/utils/supabase/server';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
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

interface BlogPageProps {
  initialBlogPosts: BlogPost[];
  error?: string;
}

export default function BlogPage({ initialBlogPosts, error }: BlogPageProps) {
  const router = useRouter();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts || []);
  const [loading, setLoading] = useState(!initialBlogPosts);
  const supabase = createClient();

  useEffect(() => {
    // Wenn wir bereits Daten vom Server haben, müssen wir nicht erneut laden
    if (initialBlogPosts && initialBlogPosts.length > 0) return;
    
    const fetchBlogPosts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select(`
            id,
            title,
            slug,
            excerpt,
            author_id,
            published,
            featured_image,
            created_at,
            updated_at,
            view_count,
            profiles (first_name, last_name)
          `)
          .eq('published', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const postsWithAuthorNames = data.map(post => {
            const profiles = post.profiles as unknown as { first_name: string | null; last_name: string | null };
            return {
              ...post,
              profiles: profiles,
              author_name: profiles ? `${profiles.first_name || ''} ${profiles.last_name || ''}`.trim() : 'Unbekannt'
            };
          });
          setBlogPosts(postsWithAuthorNames);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Blog-Beiträge:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, [initialBlogPosts, supabase]);

  // Formatierung des Datums
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  const handleBlogPostClick = (slug: string) => {
    router.push(`/blog/${slug}`);
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-6xl mx-auto bg-white shadow-sm rounded-lg p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Fehler</h1>
            <p className="text-gray-700">{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Blog</h1>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="bg-white shadow-sm rounded-lg p-8 text-center">
              <p className="text-gray-700">Keine Blog-Beiträge gefunden.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <div 
                  key={post.id} 
                  className="bg-white shadow-sm rounded-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
                  onClick={() => handleBlogPostClick(post.slug)}
                >
                  {post.featured_image && (
                    <div className="relative h-48 w-full">
                      <Image 
                        src={post.featured_image} 
                        alt={post.title}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <span>{post.author_name}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                    <p className="text-gray-700 mb-4 line-clamp-3">{post.excerpt}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{post.view_count} {post.view_count === 1 ? 'Aufruf' : 'Aufrufe'}</span>
                      <span className="text-indigo-600 font-medium">Weiterlesen</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createServerClient(context);

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        author_id,
        published,
        featured_image,
        created_at,
        updated_at,
        view_count,
        profiles (first_name, last_name)
      `)
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fehler beim Laden der Blog-Beiträge:', error);
      return {
        props: {
          initialBlogPosts: [],
          error: 'Die Blog-Beiträge konnten nicht geladen werden.'
        }
      };
    }

    const postsWithAuthorNames = data.map(post => {
      const profiles = post.profiles as unknown as { first_name: string | null; last_name: string | null };
      return {
        ...post,
        profiles: profiles,
        author_name: profiles ? `${profiles.first_name || ''} ${profiles.last_name || ''}`.trim() : 'Unbekannt'
      };
    });

    return {
      props: {
        initialBlogPosts: postsWithAuthorNames
      }
    };
  } catch (error) {
    console.error('Fehler beim Laden der Blog-Beiträge:', error);
    return {
      props: {
        initialBlogPosts: [],
        error: 'Ein unerwarteter Fehler ist aufgetreten.'
      }
    };
  }
};
