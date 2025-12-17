import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { withAuth } from '@/utils/withAuth';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import Link from 'next/link';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiRefreshCw } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Import rich text editor with dynamic import to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

interface EmailTemplatesPageProps {
  user: User;
}

function EmailTemplatesPage({ user }: EmailTemplatesPageProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<EmailTemplate>>({
    name: '',
    subject: '',
    content: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Rich text editor modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  // Fetch email templates
  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/emails/templates');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Vorlagen');
      }
      
      const result = await response.json();
      
      if (result.ok && Array.isArray(result.data)) {
        setTemplates(result.data);
      } else {
        throw new Error(result.message || 'Fehler beim Laden der Vorlagen');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Vorlagen:', error);
      setError(`Fehler beim Laden der Vorlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Handle creating a new template
  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/emails/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplate.name,
          subject: newTemplate.subject,
          content: newTemplate.content
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Fehler beim Erstellen der Vorlage');
      }

      setSuccess('Vorlage erfolgreich erstellt');
      setIsCreating(false);
      setNewTemplate({ name: '', subject: '', content: '' });
      fetchTemplates();
    } catch (error) {
      console.error('Fehler beim Erstellen der Vorlage:', error);
      setError(`Fehler beim Erstellen der Vorlage: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle updating an existing template
  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !editingTemplate.name || !editingTemplate.subject || !editingTemplate.content) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/emails/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTemplate.name,
          subject: editingTemplate.subject,
          content: editingTemplate.content
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Fehler beim Aktualisieren der Vorlage');
      }

      setSuccess('Vorlage erfolgreich aktualisiert');
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Vorlage:', error);
      setError(`Fehler beim Aktualisieren der Vorlage: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle deleting a template
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Vorlage löschen möchten?')) {
      return;
    }

    setError(null);
    try {
      const response = await fetch(`/api/admin/emails/templates/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Fehler beim Löschen der Vorlage');
      }

      setSuccess('Vorlage erfolgreich gelöscht');
      fetchTemplates();
    } catch (error) {
      console.error('Fehler beim Löschen der Vorlage:', error);
      setError(`Fehler beim Löschen der Vorlage: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unbekannt';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="email-templates" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">E-Mail-Vorlagen</h1>
                <p className="text-sm text-gray-500">
                  Verwalten Sie Ihre E-Mail-Vorlagen für verschiedene Zwecke, einschließlich Willkommens-E-Mails
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setIsCreating(true);
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  disabled={isCreating}
                >
                  <FiPlus className="mr-2" />
                  Neue Vorlage
                </button>
                <button
                  onClick={fetchTemplates}
                  disabled={loading}
                  className={`px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2" />
                      Wird aktualisiert...
                    </>
                  ) : (
                    <>
                      <FiRefreshCw className="mr-2" />
                      Aktualisieren
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                {success}
              </div>
            )}

            {/* Create New Template Form */}
            {isCreating && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Neue Vorlage erstellen</h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="mb-4">
                  <label htmlFor="new-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="new-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="z.B. Willkommen bei Contact Tables"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="new-subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Betreff
                  </label>
                  <input
                    type="text"
                    id="new-subject"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="z.B. Willkommen bei Contact Tables - Ihre Registrierung war erfolgreich"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="new-content" className="block text-sm font-medium text-gray-700 mb-1">
                    Inhalt
                  </label>
                  <div className="border rounded-md">
                    <ReactQuill
                      value={newTemplate.content}
                      onChange={(content) => setNewTemplate({ ...newTemplate, content })}
                      modules={modules}
                      className="h-64 mb-4"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Verwenden Sie {'{name}'} als Platzhalter für den Namen des Empfängers.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors mr-3"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleCreateTemplate}
                    disabled={saving}
                    className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {saving ? (
                      <>
                        <FiRefreshCw className="animate-spin mr-2" />
                        Wird gespeichert...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2" />
                        Speichern
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Edit Template Form */}
            {editingTemplate && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Vorlage bearbeiten</h2>
                  <button
                    onClick={() => setEditingTemplate(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="mb-4">
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="edit-subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Betreff
                  </label>
                  <input
                    type="text"
                    id="edit-subject"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-1">
                    Inhalt
                  </label>
                  <div className="border rounded-md">
                    <ReactQuill
                      value={editingTemplate.content}
                      onChange={(content) => setEditingTemplate({ ...editingTemplate, content })}
                      modules={modules}
                      className="h-64 mb-4"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Verwenden Sie {'{name}'} als Platzhalter für den Namen des Empfängers.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setEditingTemplate(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors mr-3"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleUpdateTemplate}
                    disabled={saving}
                    className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {saving ? (
                      <>
                        <FiRefreshCw className="animate-spin mr-2" />
                        Wird gespeichert...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2" />
                        Aktualisieren
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Templates List */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Betreff
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Erstellt am
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktualisiert am
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                          </div>
                        </td>
                      </tr>
                    ) : templates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          Keine Vorlagen gefunden
                        </td>
                      </tr>
                    ) : (
                      templates.map((template) => (
                        <tr key={template.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{template.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 truncate max-w-xs">{template.subject}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(template.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(template.updated_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setEditingTemplate(template)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              <FiEdit className="inline" /> Bearbeiten
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
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
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = withAuth(
  ['admin', 'ADMIN'],
  async (context, user) => {
    return {
      props: {}
    };
  }
);

// Konfiguration für Next.js, um statische Exporte zu verhindern
export const config = {
  unstable_runtimeJS: true,
  runtime: 'nodejs'
};

export default EmailTemplatesPage;
