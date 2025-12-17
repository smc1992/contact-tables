import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { withAuth } from '@/utils/withAuth';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

function EditBlogPostPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      try {
        setLoading(true);
        const resp = await fetch(`/api/admin/blogs/${id}`);
        const data = await resp.json();
        if (!resp.ok) throw new Error(data?.message || 'Laden fehlgeschlagen');
        const post: BlogPost = data.post;
        setTitle(post.title || '');
        setSlug(post.slug || '');
        setExcerpt(post.excerpt || '');
        setContent(post.content || '');
        setFeaturedImage(post.featured_image || null);
        setPublished(!!post.published);
      } catch (err: any) {
        console.error(err);
        alert(err?.message || 'Fehler beim Laden');
        router.push('/admin/blogs');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, router]);

  const handleFeaturedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFeatured(true);
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch('/api/upload/image', { method: 'POST', body: fd });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setFeaturedImage(data.url);
    } catch (err) {
      console.error('Featured upload failed', err);
      alert('Fehler beim Hochladen des Titelbildes');
    } finally {
      setUploadingFeatured(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      const resp = await fetch(`/api/admin/blogs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          excerpt: excerpt.trim(),
          content,
          featured_image: featuredImage,
          published,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Fehler');
      alert('Beitrag gespeichert');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Möchten Sie diesen Beitrag wirklich löschen?')) return;
    try {
      setDeleting(true);
      const resp = await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Fehler');
      router.push('/admin/blogs');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Fehler beim Löschen');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
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
      <div className="flex flex-1">
        <AdminSidebar activeItem="blogs" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Blog-Beitrag bearbeiten</h1>
              <div className="flex gap-2">
                <button className="px-3 py-2 border rounded" onClick={() => router.push('/admin/blogs')}>Zurück</button>
                <button className="px-3 py-2 border rounded text-red-600" onClick={handleDelete} disabled={deleting}>{deleting ? 'Löschen...' : 'Löschen'}</button>
              </div>
            </div>

            <form onSubmit={handleSave} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auszug</label>
                <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="w-full border rounded px-3 py-2 min-h-[80px]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Inhalt</label>
                <RichTextEditor value={content} onChange={setContent} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titelbild</label>
                  <div className="flex items-center gap-3">
                    <button type="button" className="px-3 py-2 border rounded" onClick={() => fileInputRef.current?.click()} disabled={uploadingFeatured}>
                      {uploadingFeatured ? 'Wird hochgeladen...' : 'Bild hochladen'}
                    </button>
                    {featuredImage && (
                      <a href={featuredImage} target="_blank" rel="noreferrer" className="text-indigo-600 underline text-sm">Vorschau</a>
                    )}
                    <input hidden ref={fileInputRef} type="file" accept="image/*" onChange={handleFeaturedUpload} />
                  </div>
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                    <span className="text-sm text-gray-700">Veröffentlicht</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={saving}>
                  {saving ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export const getServerSideProps = withAuth(['ADMIN', 'admin'], async () => {
  return { props: {} as any };
});

export default EditBlogPostPage;
