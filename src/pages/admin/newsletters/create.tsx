import { useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { createClient as createBrowserSupabase } from '@/utils/supabase/client';
import { createClient as createServerSupabase } from '@/utils/supabase/server';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    const supabase = createServerSupabase(ctx);
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      return {
        redirect: { destination: '/auth/login', permanent: false },
      };
    }

    const role = (user.user_metadata as any)?.role;
    if (role !== 'admin' && role !== 'ADMIN') {
      return {
        redirect: { destination: '/', permanent: false },
      };
    }

    return { props: {} };
  } catch {
    return { redirect: { destination: '/auth/login', permanent: false } } as any;
  }
};

export default function CreateNewsletterPage() {
  const router = useRouter();
  const supabase = createBrowserSupabase();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      alert('Bitte Betreff eingeben.');
      return;
    }
    if (!content || content === '<p></p>') {
      if (!confirm('Kein Inhalt vorhanden. Trotzdem als Entwurf speichern?')) return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('newsletters')
        .insert({ subject, content, status: 'draft', recipient_count: 0, open_count: 0, click_count: 0 })
        .select('id')
        .single();

      if (error) throw error;

      // Zurück zur Übersicht
      router.push('/admin/newsletters');
    } catch (err) {
      console.error('Fehler beim Erstellen des Newsletters:', err);
      alert('Fehler beim Erstellen des Newsletters');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="newsletters" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Newsletter erstellen</h1>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Betreff
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Willkommen bei Contact Tables"
                    required
                  />
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inhalt</label>
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Schreiben Sie Ihren Newsletter-Inhalt…"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/newsletters')}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {saving ? 'Speichern…' : 'Als Entwurf speichern'}
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
