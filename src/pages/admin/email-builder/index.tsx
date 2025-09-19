import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FiSend, FiUsers, FiRefreshCw, FiSave, FiCheckCircle, FiMail, FiPaperclip, FiTrash2 } from 'react-icons/fi';
import { GetServerSideProps } from 'next';
import { withAuth } from '@/utils/withAuth';
import { User } from '@supabase/supabase-js';
import { Select, Button, Input, message, Spin, Checkbox, Modal } from 'antd';

// Import rich text editor with dynamic import to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

// Define customer type
interface Customer {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

// Define customer group type
interface CustomerGroup {
  id: string;
  name: string;
  description?: string;
  count: number;
}

// Define user tag type
interface UserTag {
  id: string;
  name: string;
  description?: string;
  userCount: number;
}

// Define email template type
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

// Define attachment type
interface Attachment {
  id: string;
  filename: string;
  content: string; // Base64 encoded
  contentType: string;
  size: number;
}

interface EmailBuilderPageProps {
  user: User;
}

function EmailBuilderPage({ user }: EmailBuilderPageProps) {
  const router = useRouter();
  // Authentifizierung wird serverseitig durch withAuth gehandhabt
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewEmail, setPreviewEmail] = useState('');
  const [tags, setTags] = useState<UserTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [tagsLoading, setTagsLoading] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Load customers data
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Fetch users with CUSTOMER role from API route
      const response = await fetch('/api/admin/email-users');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Laden der Kunden');
      }
      
      if (!data.users) {
        throw new Error('Keine Benutzerdaten erhalten');
      }
      
      // Format customer data
      const customerUsers = data.users.map((user: any) => ({
        id: user.id,
        email: user.email || '',
        name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
        created_at: user.created_at
      }));
      
      setCustomers(customerUsers);
      
      // Create default customer groups
      setCustomerGroups([
        {
          id: 'all',
          name: 'Alle Kunden',
          description: 'Alle registrierten Kunden',
          count: customerUsers.length
        },
        {
          id: 'new',
          name: 'Neue Kunden',
          description: 'Kunden, die sich in den letzten 30 Tagen registriert haben',
          count: customerUsers.filter((c: any) => {
            const createdDate = new Date(c.created_at);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return createdDate >= thirtyDaysAgo;
          }).length
        }
      ]);
      
    } catch (error) {
      console.error('Fehler beim Laden der Kunden:', error);
      // Fallback to empty arrays
      setCustomers([]);
      setCustomerGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // Load email templates from database
  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const response = await fetch('/api/admin/emails/templates');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Vorlagen');
      }
      
      const result = await response.json();
      
      if (result.ok && Array.isArray(result.data)) {
        setTemplates(result.data);
      } else {
        // Fallback to empty array
        setTemplates([]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Vorlagen:', error);
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };
  
  // Load user tags from database
  const fetchTags = async () => {
    setTagsLoading(true);
    try {
      const response = await fetch('/api/admin/tags/list');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Tags');
      }
      
      const result = await response.json();
      
      if (Array.isArray(result.tags)) {
        setTags(result.tags);
      } else {
        // Fallback to empty array
        setTags([]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Tags:', error);
      setTags([]);
    } finally {
      setTagsLoading(false);
    }
  };
  
  // Handle tag selection
  const handleTagChange = async (value: string) => {
    console.log(`Tag-Auswahl geändert auf: ${value}`);
    setSelectedTag(value);
    setSelectedGroup('');
    setSearchTerm('');
    setLoading(true);

    try {
      let response;
      
      if (value === 'none') {
        // Benutzer ohne Tags abrufen
        console.log('Rufe Benutzer ohne Tags ab...');
        response = await fetch('/api/admin/users/without-tags');
      } else {
        // Benutzer mit dem ausgewählten Tag abrufen
        console.log(`Rufe Benutzer mit Tag ID ${value} ab...`);
        response = await fetch(`/api/admin/users/by-tag?tagId=${value}`);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API-Fehler (${response.status}):`, errorText);
        throw new Error(`Fehler beim Laden der Benutzer nach Tag: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API-Antwort erhalten:', data);
      
      if (data.error) {
        console.error('API-Fehler:', data.error);
        message.error(`Fehler: ${data.error}`);
      }
      
      if (Array.isArray(data.users)) {
        console.log(`${data.users.length} Benutzer mit diesem Tag gefunden`);
        setCustomers(data.users);
      } else {
        console.warn('Keine Benutzer in der API-Antwort gefunden oder ungültiges Format');
        setCustomers([]);
        message.warning('Keine Benutzer mit diesem Tag gefunden');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer nach Tag:', error);
      message.error(`Fehler beim Laden der Kunden nach Tag: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Lade Daten, wenn die Komponente gemountet wird
    fetchCustomers();
    fetchTemplates();
    fetchTags();
  }, []);

  // Handle template selection
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSubject(template.subject);
        setContent(template.content);
      }
    }
  };

  // Handle customer group selection
  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const groupId = e.target.value;
    setSelectedGroup(groupId);
    
    // Reset tag selection when group changes
    setSelectedTag('');
    
    if (groupId === 'all') {
      setSelectedCustomers(customers.map(c => c.id));
    } else if (groupId === 'new') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newCustomers = customers.filter(c => {
        const createdDate = new Date(c.created_at);
        return createdDate >= thirtyDaysAgo;
      });
      
      setSelectedCustomers(newCustomers.map(c => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  // Toggle customer selection
  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.email.toLowerCase().includes(searchLower) ||
      (customer.name && customer.name.toLowerCase().includes(searchLower))
    );
  });

  // Handle file upload for attachments
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Check total size of all attachments (limit to 10MB total)
    const totalCurrentSize = attachments.reduce((sum, att) => sum + att.size, 0);
    let totalNewSize = totalCurrentSize;
    
    // Process each file
    Array.from(files).forEach(file => {
      // Check file size (limit to 5MB per file)
      if (file.size > 5 * 1024 * 1024) {
        alert(`Die Datei ${file.name} ist zu groß (max. 5MB pro Datei).`);
        return;
      }
      
      totalNewSize += file.size;
      if (totalNewSize > 10 * 1024 * 1024) {
        alert('Die Gesamtgröße aller Anhänge überschreitet 10MB.');
        return;
      }
      
      // Read file as base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Content = e.target?.result as string;
        // Remove data:mimetype;base64, prefix
        const base64Data = base64Content.split(',')[1];
        
        setAttachments(prev => [
          ...prev,
          {
            id: `attachment-${Date.now()}-${file.name}`,
            filename: file.name,
            content: base64Data,
            contentType: file.type,
            size: file.size
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  // Send email to selected customers
  const handleSendEmail = async () => {
    if (!subject || !content) {
      alert('Bitte geben Sie einen Betreff und Inhalt ein.');
      return;
    }

    if (selectedCustomers.length === 0) {
      alert('Bitte wählen Sie mindestens einen Empfänger aus.');
      return;
    }

    if (!confirm(`Möchten Sie diese E-Mail an ${selectedCustomers.length} Empfänger senden?`)) {
      return;
    }

    setSending(true);
    let timeoutId;

    try {
      // Timeout-Handler für lange Anfragen
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Zeitüberschreitung bei der Anfrage. Die E-Mail-Kampagne wurde möglicherweise trotzdem geplant. Bitte überprüfen Sie den E-Mail-Verlauf.'));
        }, 30000); // 30 Sekunden Timeout
      });

      const selectedCustomerEmails = customers
        .filter(c => selectedCustomers.includes(c.id))
        .map(c => ({
          id: c.id,
          email: c.email,
          name: c.name || ''
        }));

      // Bereite Request-Daten vor
      const requestData = {
        subject,
        content,
        recipients: selectedCustomerEmails,
        templateId: selectedTemplate || undefined,
        // Enable batching and respect server limits
        allowBatching: true,
        batchSize: 200, // Angepasst auf 200 E-Mails pro Batch
        attachments: attachments.length > 0 ? attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        })) : undefined
      };

      // Race zwischen Fetch und Timeout
      const fetchPromise = fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      clearTimeout(timeoutId);

      // Prüfe auf Netzwerkfehler
      if (!response.ok && response.status !== 202) {
        let errorMessage = 'Unbekannter Fehler';
        
        try {
          const result = await response.json();
          errorMessage = result.message || `Server-Fehler: ${response.status}`;
        } catch (e) {
          errorMessage = `Server-Fehler: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Prüfe auf Batch-Scheduling (Status 202)
      if (response.status === 202 && result.batchScheduled) {
        // Erfolgreiche Batch-Planung
        Modal.success({
          title: 'E-Mail-Kampagne geplant',
          content: (
            <div>
              <p>{result.message}</p>
              <p>Erster Batch wird gesendet um: {new Date(result.estimatedSendTime).toLocaleString()}</p>
              {result.totalBatches > 1 && (
                <p>Voraussichtliche Fertigstellung: {new Date(result.estimatedCompletionTime).toLocaleString()}</p>
              )}
              <p>Sie können den Fortschritt im E-Mail-Verlauf verfolgen.</p>
            </div>
          ),
          okText: 'Verstanden',
        });
      } else {
        // Normale erfolgreiche Sendung
        message.success(`E-Mails wurden erfolgreich gesendet! Erfolgreich: ${result.sent || 0}, Fehlgeschlagen: ${result.failed || 0}`);
      }
      
      // Reset form after successful send
      setSubject('');
      setContent('');
      setSelectedCustomers([]);
      setSelectedTemplate('');
      setSelectedGroup('');
      setAttachments([]);
      
    } catch (error) {
      console.error('Fehler beim Senden der E-Mails:', error);
      clearTimeout(timeoutId);
      
      // Spezielle Behandlung für verschiedene Fehlertypen
      if (error instanceof Error) {
        if (error.message.includes('rate limit exceeded')) {
          // Rate-Limit-Fehler
          Modal.error({
            title: 'E-Mail-Versand-Limit erreicht',
            content: (
              <div>
                <p>Das E-Mail-Versand-Limit wurde erreicht. Dies dient zum Schutz vor Spam und zur Sicherstellung der Zustellbarkeit.</p>
                <p>Große E-Mail-Kampagnen werden automatisch in Batches von 200 E-Mails pro Stunde versendet.</p>
                <p>Bei 1500 Empfängern würde der Versand etwa 8 Stunden dauern (200 E-Mails pro Stunde).</p>
              </div>
            ),
            okText: 'Verstanden',
          });
        } else if (error.message.includes('Zeitüberschreitung')) {
          // Timeout-Fehler
          Modal.info({
            title: 'Anfrage dauert länger als erwartet',
            content: (
              <div>
                <p>Die Anfrage zur Verarbeitung Ihrer E-Mail-Kampagne dauert länger als erwartet.</p>
                <p>Bei großen E-Mail-Kampagnen ist dies normal. Die Kampagne wurde möglicherweise trotzdem erfolgreich geplant.</p>
                <p>Bitte überprüfen Sie den E-Mail-Verlauf, um den Status Ihrer Kampagne zu sehen.</p>
                <p>Sie müssen diese E-Mail nicht erneut senden.</p>
              </div>
            ),
            okText: 'Zum E-Mail-Verlauf',
            onOk: () => {
              // Optional: Weiterleitung zum E-Mail-Verlauf
              // window.location.href = '/admin/email-history';
            }
          });
        } else {
          // Standard-Fehlerbehandlung für andere Fehler
          Modal.error({
            title: 'Fehler beim Senden der E-Mails',
            content: error.message
          });
        }
      } else {
        // Unbekannter Fehlertyp
        Modal.error({
          title: 'Fehler beim Senden der E-Mails',
          content: 'Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
        });
      }
    } finally {
      setSending(false);
    }
  };

  // Send test email
  const handleSendTestEmail = async () => {
    if (!subject || !content) {
      alert('Bitte geben Sie einen Betreff und Inhalt ein.');
      return;
    }

    const testEmail = prompt('Bitte geben Sie eine Test-E-Mail-Adresse ein:');
    if (!testEmail) return;

    setPreviewEmail(testEmail);
    
    try {
      setSending(true);
      const response = await fetch('/api/admin/emails/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          content,
          to: testEmail,
          templateId: selectedTemplate || undefined,
          attachments: attachments.length > 0 ? attachments.map(att => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType
          })) : undefined
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Fehler beim Senden der Test-E-Mail');
      }

      alert('Test-E-Mail wurde erfolgreich gesendet!');
    } catch (error) {
      console.error('Fehler beim Senden der Test-E-Mail:', error);
      alert(`Fehler beim Senden der Test-E-Mail: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="email-builder" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">E-Mail-Builder</h1>
                <p className="text-sm text-gray-500">
                  Erstellen und versenden Sie E-Mails an ausgewählte Kunden
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/admin/email-builder/history"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <FiMail className="mr-2" />
                  E-Mail-Verlauf
                </Link>
                <button
                  onClick={fetchCustomers}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Email Composer */}
              <div className="lg:col-span-2">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">E-Mail erstellen</h2>
                  
                  <div className="mb-4">
                    <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                      Vorlage auswählen
                    </label>
                    <select
                      id="template"
                      value={selectedTemplate}
                      onChange={handleTemplateChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={templatesLoading}
                    >
                      <option value="">Keine Vorlage</option>
                      {templatesLoading ? (
                        <option value="" disabled>Vorlagen werden geladen...</option>
                      ) : templates.length === 0 ? (
                        <option value="" disabled>Keine Vorlagen verfügbar</option>
                      ) : (
                        templates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Betreff
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Betreff der E-Mail"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                      Inhalt
                    </label>
                    <div className="border rounded-md">
                      <ReactQuill
                        value={content}
                        onChange={setContent}
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'color': [] }, { 'background': [] }],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'align': [] }],
                            ['link', 'image'],
                            ['clean']
                          ]
                        }}
                        className="h-64 mb-4"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Verwenden Sie {'{name}'} als Platzhalter für den Namen des Empfängers.
                    </p>
                  </div>
                  
                  {/* Attachments */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anhänge
                    </label>
                    <div className="flex items-center mb-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        multiple
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center text-sm"
                      >
                        <FiPaperclip className="mr-2" />
                        Datei anhängen
                      </button>
                      <span className="ml-3 text-xs text-gray-500">
                        Max. 5MB pro Datei, 10MB insgesamt
                      </span>
                    </div>
                    
                    {attachments.length > 0 && (
                      <div className="mt-2 border rounded-md p-2">
                        <ul className="divide-y divide-gray-200">
                          {attachments.map(attachment => (
                            <li key={attachment.id} className="py-2 flex justify-between items-center">
                              <div className="flex items-center">
                                <FiPaperclip className="text-gray-400 mr-2" />
                                <span className="text-sm">{attachment.filename}</span>
                                <span className="ml-2 text-xs text-gray-500">
                                  ({Math.round(attachment.size / 1024)} KB)
                                </span>
                              </div>
                              <button
                                onClick={() => removeAttachment(attachment.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FiTrash2 />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <button
                      onClick={handleSendTestEmail}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <FiSend className="mr-2" />
                      Test-E-Mail senden
                    </button>
                    
                    <button
                      onClick={handleSendEmail}
                      disabled={sending || selectedCustomers.length === 0}
                      className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center ${(sending || selectedCustomers.length === 0) ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {sending ? (
                        <>
                          <FiRefreshCw className="animate-spin mr-2" />
                          Wird gesendet...
                        </>
                      ) : selectedCustomers.length > 200 ? (
                        <>
                          <FiSend className="mr-2" />
                          {selectedCustomers.length} Empfänger in Batches senden
                          <span className="ml-1 bg-white text-indigo-600 text-xs rounded-full px-2 py-0.5">
                            {Math.ceil(selectedCustomers.length / 200)} Std.
                          </span>
                        </>
                      ) : (
                        <>
                          <FiSend className="mr-2" />
                          An {selectedCustomers.length} Empfänger senden
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer Selection */}
              <div className="lg:col-span-1">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Empfänger auswählen</h2>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nach Tag filtern
                    </label>
                    <Select
                      placeholder="Tag auswählen"
                      value={selectedTag}
                      onChange={handleTagChange}
                      style={{ width: '100%' }}
                      allowClear
                    >
                      <Select.Option value="none">Keine Tags</Select.Option>
                      {tagsLoading ? (
                        <Select.Option value="" disabled>Tags werden geladen...</Select.Option>
                      ) : tags.length === 0 ? (
                        <Select.Option value="" disabled>Keine Tags verfügbar</Select.Option>
                      ) : (
                        tags.map(tag => (
                          <Select.Option key={tag.id} value={tag.id}>
                            {tag.name} ({tag.userCount})
                          </Select.Option>
                        ))
                      )}
                    </Select>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
                      Kundengruppe
                    </label>
                    <select
                      id="group"
                      value={selectedGroup}
                      onChange={handleGroupChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={!!selectedTag}
                    >
                      <option value="">Bitte wählen</option>
                      {customerGroups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({group.count})
                        </option>
                      ))}
                    </select>
                    {selectedTag && (
                      <p className="text-xs text-gray-500 mt-1">
                        Bitte deaktivieren Sie zuerst die Tag-Auswahl, um eine Kundengruppe auszuwählen.
                      </p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                      Kunden suchen
                    </label>
                    <input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="E-Mail oder Name"
                    />
                  </div>
                  
                  <div className="mt-4">
                    {selectedCustomers.length > 200 && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              <span className="font-bold">Batch-Verarbeitung aktiv:</span> Sie haben {selectedCustomers.length} Empfänger ausgewählt.
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              Die E-Mails werden in Batches von 200 E-Mails pro Stunde versendet.
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              Geschätzte Versanddauer: {Math.ceil(selectedCustomers.length / 200)} Stunden
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Kunden ({filteredCustomers.length})
                      </span>
                      <span className="text-sm text-indigo-600">
                        {selectedCustomers.length} ausgewählt
                      </span>
                    </div>
                    
                    <div className="border rounded-md overflow-y-auto h-64">
                      {loading ? (
                        <div className="flex justify-center items-center h-full">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                      ) : filteredCustomers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Keine Kunden gefunden
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-200">
                          {filteredCustomers.map(customer => (
                            <li key={customer.id} className="p-3 hover:bg-gray-50">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`customer-${customer.id}`}
                                  checked={selectedCustomers.includes(customer.id)}
                                  onChange={() => toggleCustomerSelection(customer.id)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`customer-${customer.id}`} className="ml-3 block">
                                  <span className="block text-sm font-medium text-gray-900">
                                    {customer.name || 'Kein Name'}
                                  </span>
                                  <span className="block text-sm text-gray-500">
                                    {customer.email}
                                  </span>
                                </label>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    
                    <div className="mt-3 flex justify-between">
                      <button
                        onClick={() => setSelectedCustomers([])}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Auswahl aufheben
                      </button>
                      <button
                        onClick={() => setSelectedCustomers(customers.map(c => c.id))}
                        className="text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        Alle auswählen
                      </button>
                    </div>
                  </div>
                </div>
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

export default EmailBuilderPage;
