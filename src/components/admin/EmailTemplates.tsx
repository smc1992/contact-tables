import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { FiEdit, FiTrash2, FiPlus, FiRefreshCw, FiSave, FiX } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Import rich text editor with dynamic import to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

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

  // Load templates
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/emails/templates');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Fehler beim Laden der Vorlagen');
      }
      
      setTemplates(result.data || []);
    } catch (error) {
      console.error('Fehler beim Laden der E-Mail-Vorlagen:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Create new template
  const createTemplate = async () => {
    if (!editingTemplate) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/emails/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTemplate.name,
          subject: editingTemplate.subject,
          content: editingTemplate.content
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Fehler beim Erstellen der Vorlage');
      }
      
      setTemplates(prev => [...prev, result.data[0]]);
      setIsCreating(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Fehler beim Erstellen der E-Mail-Vorlage:', error);
      alert(`Fehler beim Erstellen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setSaving(false);
    }
  };

  // Update template
  const updateTemplate = async () => {
    if (!editingTemplate) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/emails/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTemplate.name,
          subject: editingTemplate.subject,
          content: editingTemplate.content
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Fehler beim Aktualisieren der Vorlage');
      }
      
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? result.data : t));
      setEditingTemplate(null);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der E-Mail-Vorlage:', error);
      alert(`Fehler beim Aktualisieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete template
  const deleteTemplate = async (id: string) => {
    if (!confirm('Möchten Sie diese Vorlage wirklich löschen?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/emails/templates/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Fehler beim Löschen der Vorlage');
      }
      
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Fehler beim Löschen der E-Mail-Vorlage:', error);
      alert(`Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  };

  // Start creating new template
  const startCreating = () => {
    setEditingTemplate({
      id: '',
      name: '',
      subject: '',
      content: ''
    });
    setIsCreating(true);
  };

  // Start editing template
  const startEditing = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setIsCreating(false);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTemplate(null);
    setIsCreating(false);
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingTemplate) return;
    
    const { name, value } = e.target;
    setEditingTemplate(prev => ({
      ...prev!,
      [name]: value
    }));
  };

  // Handle rich text editor content change
  const handleContentChange = (content: string) => {
    if (!editingTemplate) return;
    
    setEditingTemplate(prev => ({
      ...prev!,
      content
    }));
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
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
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">E-Mail-Vorlagen</h2>
        <div className="flex space-x-3">
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className={`px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <FiRefreshCw className="animate-spin mr-1" />
                Wird aktualisiert...
              </>
            ) : (
              <>
                <FiRefreshCw className="mr-1" />
                Aktualisieren
              </>
            )}
          </button>
          <button
            onClick={startCreating}
            disabled={!!editingTemplate}
            className={`px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center text-sm ${editingTemplate ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <FiPlus className="mr-1" />
            Neue Vorlage
          </button>
        </div>
      </div>
      
      {editingTemplate ? (
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            {isCreating ? 'Neue Vorlage erstellen' : 'Vorlage bearbeiten'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={editingTemplate.name}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Name der Vorlage"
                required
              />
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Betreff
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={editingTemplate.subject}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Betreff der E-Mail"
                required
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Inhalt
              </label>
              <div className="border rounded-md">
                <ReactQuill
                  value={editingTemplate.content}
                  onChange={handleContentChange}
                  modules={modules}
                  className="h-64 mb-4"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Verwenden Sie {'{name}'} als Platzhalter für den Namen des Empfängers.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={cancelEditing}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Abbrechen
              </button>
              <button
                onClick={isCreating ? createTemplate : updateTemplate}
                disabled={saving}
                className={`px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {saving ? (
                  <>
                    <FiRefreshCw className="animate-spin inline mr-1" />
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <FiSave className="inline mr-1" />
                    {isCreating ? 'Erstellen' : 'Speichern'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Keine E-Mail-Vorlagen gefunden. Erstellen Sie eine neue Vorlage, um zu beginnen.
        </div>
      ) : (
        <div className="overflow-hidden border rounded-lg">
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
                  Zuletzt aktualisiert
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {template.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {template.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(template.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => startEditing(template)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <FiEdit className="inline" /> Bearbeiten
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 className="inline" /> Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
