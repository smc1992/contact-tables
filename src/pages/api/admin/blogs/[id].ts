import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient, createAdminClient } from '@/utils/supabase/server';

function slugify(input: string): string {
  return input
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 96);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (!id) return res.status(400).json({ message: 'ID ist erforderlich' });

  try {
    const supabase = createClient({ req, res });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ message: 'Nicht authentifiziert' });

    const role = user.user_metadata?.role;
    if (role !== 'ADMIN' && role !== 'admin') {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    const admin = createAdminClient();

    if (req.method === 'GET') {
      const { data, error } = await admin
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return res.status(404).json({ message: 'Beitrag nicht gefunden' });
      return res.status(200).json({ post: data });
    }

    if (req.method === 'PUT') {
      const { title, slug: bodySlug, excerpt, content, featured_image, published } = req.body || {};

      const update: Record<string, any> = {};
      if (typeof title === 'string') update.title = title;
      if (typeof excerpt === 'string') update.excerpt = excerpt;
      if (typeof content === 'string') update.content = content;
      if (typeof featured_image === 'string' || featured_image === null) update.featured_image = featured_image;
      if (typeof published === 'boolean') update.published = published;

      if (typeof bodySlug === 'string') {
        let s = bodySlug.trim() ? slugify(bodySlug) : undefined;
        if (!s && title) s = slugify(title);
        if (s) {
          // ensure unique slug if changed
          const { data: existingById } = await admin
            .from('blog_posts')
            .select('slug')
            .eq('id', id)
            .single();
          const currentSlug = existingById?.slug;
          if (s !== currentSlug) {
            let candidate = s;
            let counter = 1;
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const { data: exists } = await admin
                .from('blog_posts')
                .select('id')
                .eq('slug', candidate)
                .neq('id', id)
                .limit(1)
                .maybeSingle();
              if (!exists) break;
              counter += 1;
              candidate = `${s}-${counter}`;
              if (counter > 100) break;
            }
            update.slug = candidate;
          }
        }
      }

      const { data, error } = await admin
        .from('blog_posts')
        .update(update)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating blog post:', error);
        return res.status(500).json({ message: 'Fehler beim Aktualisieren des Beitrags' });
      }
      return res.status(200).json({ message: 'Beitrag aktualisiert', post: data });
    }

    if (req.method === 'DELETE') {
      const { error } = await admin
        .from('blog_posts')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Error deleting blog post:', error);
        return res.status(500).json({ message: 'Fehler beim Löschen des Beitrags' });
      }
      return res.status(200).json({ message: 'Beitrag gelöscht' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    console.error('API error /api/admin/blogs/[id]:', err);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
