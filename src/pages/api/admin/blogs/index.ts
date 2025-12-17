import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { withAdminAuth } from '../../middleware/withAdminAuth';

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {

    const admin = createAdminClient();

    const { data, error } = await admin
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts:', error);
      return res.status(500).json({ message: 'Fehler beim Laden der Beiträge' });
    }

    const posts = (data || []).map((post: any) => {
      const profiles = post.profiles as { first_name: string | null; last_name: string | null } | null;
      return {
        ...post,
        profiles,
        author_name: profiles ? `${profiles.first_name || ''} ${profiles.last_name || ''}`.trim() : 'Unbekannt',
      };
    });

    return res.status(200).json({ posts });
  } catch (err) {
    console.error('API error /api/admin/blogs:', err);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
