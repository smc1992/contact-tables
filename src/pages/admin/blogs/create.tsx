import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { withAuth } from '@/utils/withAuth';

interface CreateBlogPostPageProps {
  // user injected by withAuth, but not explicitly typed here
}

function CreateBlogPostPage(props: CreateBlogPostPageProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Titel und Inhalt sind erforderlich');
      return;
    }

    try {
      setSubmitting(true);
      const resp = await fetch('/api/admin/blogs/create', {
        method: 'POST',
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

      // go to edit page
      const id = data?.post?.id;
      if (id) router.push(`/admin/blogs/edit/${id}`);
      else router.push('/admin/blogs');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Fehler beim Erstellen');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="blogs" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Neuen Blog-Beitrag erstellen</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Titel des Beitrags"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (optional)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="automatisch aus Titel, falls leer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auszug</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full border rounded px-3 py-2 min-h-[80px]"
                  placeholder="Kurzer Teaser-Text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Inhalt</label>
                <RichTextEditor value={content} onChange={setContent} placeholder="Schreiben Sie Ihren Beitrag..." />
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
                <button type="button" className="px-4 py-2 border rounded" onClick={() => router.push('/admin/blogs')}>Abbrechen</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={submitting}>
                  {submitting ? 'Speichern...' : 'Erstellen'}
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

export default CreateBlogPostPage;
