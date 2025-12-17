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

interface BlogPostPageProps {
  initialBlogPost: BlogPost | null;
  error?: string;
}

export default function BlogPostPage({ initialBlogPost, error }: BlogPostPageProps) {
  const router = useRouter();
  const { slug } = router.query;
  const [blogPost, setBlogPost] = useState<BlogPost | null>(initialBlogPost);
  const [loading, setLoading] = useState(!initialBlogPost);
  const supabase = createClient();

  useEffect(() => {
    // Wenn wir bereits Daten vom Server haben, müssen wir nicht erneut laden
    if (initialBlogPost) return;
    
    const fetchBlogPost = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        // Erhöhe den View Count
        await supabase.rpc('increment_blog_view_count', { post_slug: slug });
        
        const { data, error } = await supabase
          .from('blog_posts')
          .select(`
            id,
            title,
            slug,
            excerpt,
            content,
            author_id,
            published,
            featured_image,
            created_at,
            updated_at,
            view_count,
            profiles (first_name, last_name)
          `)
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (error) throw error;

        if (data) {
          const profiles = data.profiles as unknown as { first_name: string | null; last_name: string | null };
          setBlogPost({
            ...data,
            profiles: profiles,
            author_name: profiles ? `${profiles.first_name || ''} ${profiles.last_name || ''}`.trim() : 'Unbekannt'
          });
        } else {
          router.push('/404');
        }
      } catch (error) {
        console.error('Fehler beim Laden des Blog-Beitrags:', error);
        router.push('/404');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [slug, initialBlogPost, router, supabase]);

  // Formatierung des Datums
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Fehler</h1>
            <p className="text-gray-700">{error}</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Zurück zur Startseite
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading || !blogPost) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-6 bg-gray-50">
        <article className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden">
          {blogPost.featured_image && (
            <div className="relative h-64 w-full">
              <Image 
                src={blogPost.featured_image} 
                alt={blogPost.title}
                layout="fill"
                objectFit="cover"
                priority
              />
            </div>
          )}
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{blogPost.title}</h1>
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <span>Von {blogPost.author_name}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(blogPost.created_at)}</span>
              <span className="mx-2">•</span>
              <span>{blogPost.view_count} {blogPost.view_count === 1 ? 'Aufruf' : 'Aufrufe'}</span>
            </div>
            <div className="prose prose-indigo max-w-none">
              <p className="text-lg font-medium text-gray-700 mb-6">{blogPost.excerpt}</p>
              <div dangerouslySetInnerHTML={{ __html: blogPost.content }} />
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button 
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Zurück
              </button>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };
  const supabase = createServerClient(context);

  try {
    // Erhöhe den View Count
    await supabase.rpc('increment_blog_view_count', { post_slug: slug });
    
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        author_id,
        published,
        featured_image,
        created_at,
        updated_at,
        view_count,
        profiles (first_name, last_name)
      `)
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error) {
      console.error('Fehler beim Laden des Blog-Beitrags:', error);
      return {
        props: {
          initialBlogPost: null,
          error: 'Der Blog-Beitrag konnte nicht geladen werden.'
        }
      };
    }

    if (!data) {
      return {
        notFound: true
      };
    }

    const profiles = data.profiles as unknown as { first_name: string | null; last_name: string | null };
    const blogPost = {
      ...data,
      profiles: profiles,
      author_name: profiles ? `${profiles.first_name || ''} ${profiles.last_name || ''}`.trim() : 'Unbekannt'
    };

    return {
      props: {
        initialBlogPost: blogPost
      }
    };
  } catch (error) {
    console.error('Fehler beim Laden des Blog-Beitrags:', error);
    return {
      props: {
        initialBlogPost: null,
        error: 'Ein unerwarteter Fehler ist aufgetreten.'
      }
    };
  }
};
