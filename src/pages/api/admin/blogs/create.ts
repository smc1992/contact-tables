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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createClient({ req, res });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ message: 'Nicht authentifiziert' });

    const role = user.user_metadata?.role;
    if (role !== 'ADMIN' && role !== 'admin') {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    const { title, slug: providedSlug, excerpt, content, featured_image, published } = req.body || {};
    if (!title || !content) {
      return res.status(400).json({ message: 'Titel und Inhalt sind erforderlich' });
    }

    const admin = createAdminClient();

    // Ensure unique slug
    let slug = (providedSlug && typeof providedSlug === 'string' ? providedSlug : slugify(title));
    if (!slug) slug = slugify(title);

    // Suffix with number if exists
    let candidate = slug;
    let counter = 1;
    // limit attempts to avoid infinite loop
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: existing } = await admin
        .from('blog_posts')
        .select('id')
        .eq('slug', candidate)
        .limit(1)
        .maybeSingle();
      if (!existing) break;
      counter += 1;
      candidate = `${slug}-${counter}`;
      if (counter > 100) break;
    }
    slug = candidate;

    const { data, error } = await admin
      .from('blog_posts')
      .insert({
        title,
        slug,
        excerpt: excerpt || '',
        content,
        featured_image: featured_image || null,
        published: !!published,
        author_id: user.id,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error inserting blog post:', error);
      return res.status(500).json({ message: 'Fehler beim Erstellen des Beitrags' });
    }

    return res.status(201).json({ message: 'Beitrag erstellt', post: data });
  } catch (err) {
    console.error('API error /api/admin/blogs/create:', err);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
