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
  const [bulkSelectCount, setBulkSelectCount] = useState<number>(50);
  // Segment: Noch keine E-Mail erhalten
  const [nrTemplateId, setNrTemplateId] = useState<string>('');
  const [nrSubjectContains, setNrSubjectContains] = useState<string>('');
  const [nrSegmentName, setNrSegmentName] = useState<string>('Noch keine E-Mail zu Thema/Vorlage');
  const [nrSegmentDescription, setNrSegmentDescription] = useState<string>('');
  const [savingSegment, setSavingSegment] = useState<boolean>(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const campaignPollingRef = useRef<number | null>(null);
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

  // Speichere dynamisches Segment „noch keine E-Mail erhalten“
  const saveNotReceivedSegment = async () => {
    try {
      setSavingSegment(true);
      const templateName = templates.find(t => t.id === nrTemplateId)?.name;
      const resolvedName = nrSegmentName || `Nicht erhalten: ${nrSubjectContains || templateName || 'Thema/Vorlage'}`;
      const body = {
        name: resolvedName,
        description: nrSegmentDescription,
        is_dynamic: true,
        criteria: {
          email_not_received: {
            ...(nrTemplateId ? { template_id: nrTemplateId } : {}),
            ...(nrSubjectContains ? { subject_contains: nrSubjectContains } : {})
          }
        }
      };
      const response = await fetch('/api/admin/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Segment konnte nicht erstellt werden');
      }
      message.success('Segment gespeichert und Mitglieder aktualisiert');
    } catch (error) {
      console.error('Fehler beim Speichern des Segments:', error);
      message.error(error instanceof Error ? error.message : 'Unbekannter Fehler beim Speichern');
    } finally {
      setSavingSegment(false);
    }
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

  // Starte Status-Polling für eine geplante Kampagne
  const startCampaignPolling = (campaignId: string) => {
    // Vorheriges Polling beenden
    if (campaignPollingRef.current) {
      clearInterval(campaignPollingRef.current);
      campaignPollingRef.current = null;
    }

    // Sofortige Info anzeigen
    message.open({
      key: 'campaign-progress',
      type: 'loading',
      content: 'Kampagne geplant. Fortschritt wird überwacht...',
      duration: 0
    });

    // Alle 15 Sekunden Status abrufen
    campaignPollingRef.current = window.setInterval(async () => {
      try {
        const resp = await fetch(`/api/admin/emails/campaign-status?campaignId=${campaignId}`);
        if (!resp.ok) return;
        const data = await resp.json();
        if (!data.ok || !data.campaign) return;

        const status = data.campaign.status;
        const sent = data.campaign.sent_count || 0;
        const failed = data.campaign.failed_count || 0;
        const total = data.campaign.total_recipients || 0;
        const processed = sent + failed;

        message.open({
          key: 'campaign-progress',
          type: 'loading',
          content: `Status: ${status} • Fortschritt: ${processed}/${total}`,
          duration: 0
        });

        // Terminalzustände: sent/partial/failed (Groß- und Kleinschreibung tolerieren)
        const terminalStatuses = ['sent', 'partial', 'failed', 'SENT', 'PARTIAL', 'FAILED'];
        if (terminalStatuses.includes(status)) {
          if (campaignPollingRef.current) {
            clearInterval(campaignPollingRef.current);
            campaignPollingRef.current = null;
          }

          const finalType = status.toLowerCase() === 'failed' ? 'error' : 'success';
          message.open({
            key: 'campaign-progress',
            type: finalType,
            content: `Kampagne abgeschlossen: ${sent} gesendet, ${failed} fehlgeschlagen`,
            duration: 4
          });
        }
      } catch (e) {
        // Bei Fehlern weiter versuchen; UI nicht spammen
        console.warn('Fehler beim Kampagnen-Polling', e);
      }
    }, 15000);
  };

  // Load email templates from database
  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      console.log('Frontend: Starte Abruf der E-Mail-Vorlagen...');
      
      const response = await fetch('/api/admin/emails/templates', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Frontend: API-Antwort erhalten, Status:', response.status);
      
      if (!response.ok) {
        console.error('Frontend: API-Fehler:', response.status, response.statusText);
        throw new Error(`Fehler beim Laden der Vorlagen: ${response.status} ${response.statusText}`);
      }
      
      let result;
      try {
        result = await response.json();
        console.log('Frontend: API-Antwort erfolgreich geparst');
      } catch (jsonError) {
        console.error('Frontend: Fehler beim Parsen der JSON-Antwort:', jsonError);
        throw new Error('Die API-Antwort enthält kein gültiges JSON');
      }
      
      console.log('Frontend: API-Antwort:', result);
      
      if (result.ok && Array.isArray(result.data)) {
        console.log('Frontend: Setze', result.data.length, 'Vorlagen');
        setTemplates(result.data);
        message.success('Vorlagen erfolgreich geladen');
      } else {
        // Fallback to empty array
        console.warn('Frontend: Keine Vorlagen in der Antwort oder ungültiges Format');
        setTemplates([]);
        message.warning(result.message || 'Keine Vorlagen verfügbar');
      }
    } catch (error) {
      console.error('Frontend: Fehler beim Laden der Vorlagen:', error);
      message.error(`Fehler beim Laden der Vorlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
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

    // Cleanup bei Unmount: Polling beenden
    return () => {
      if (campaignPollingRef.current) {
        clearInterval(campaignPollingRef.current);
        campaignPollingRef.current = null;
      }
    };
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
  
  // Speichern einer neuen Vorlage
  const saveTemplate = async () => {
    if (!subject || !content) {
      message.error('Bitte geben Sie einen Betreff und Inhalt ein.');
      return;
    }
    
    const templateName = prompt('Bitte geben Sie einen Namen für die Vorlage ein:');
    if (!templateName) return;
    
    try {
      setSending(true);
      message.loading('Vorlage wird gespeichert...');
      
      const response = await fetch('/api/admin/emails/templates/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          subject,
          content
        })
      });
      
      if (!response.ok) {
        throw new Error(`Fehler beim Speichern der Vorlage: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.ok && result.data && result.data.length > 0) {
        message.success('Vorlage erfolgreich gespeichert');
        
        // Aktualisiere die Vorlagen-Liste
        await fetchTemplates();
        
        // Wähle die neue Vorlage aus
        const newTemplate = result.data[0];
        setSelectedTemplate(newTemplate.id);
      } else {
        throw new Error(result.message || 'Unbekannter Fehler beim Speichern der Vorlage');
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Vorlage:', error);
      message.error(`Fehler beim Speichern der Vorlage: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setSending(false);
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

  // Bulk select first N customers from filtered list
  const bulkSelectCustomers = (count: number, fromAllPages: boolean = false) => {
    const sourceCustomers = fromAllPages ? filteredCustomers : paginatedCustomers;
    const availableCustomers = sourceCustomers.slice(0, count);
    const customerIds = availableCustomers.map(customer => customer.id);
    setSelectedCustomers(prev => {
      // Merge with existing selection, avoiding duplicates
      const newSelection = Array.from(new Set([...prev, ...customerIds]));
      return newSelection;
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

  // Pagination calculations
  const totalCustomers = filteredCustomers.length;
  const totalPages = Math.ceil(totalCustomers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGroup, selectedTag]);

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

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
        // Automatically enable batching for more than 10 emails to avoid Netlify timeout
        allowBatching: selectedCustomerEmails.length > 10,
        batchSize: selectedCustomerEmails.length > 10 ? 200 : selectedCustomerEmails.length,
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

        // Status-Polling starten
        if (result.campaignId) {
          startCampaignPolling(result.campaignId);
        }
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
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSendTestEmail}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <FiSend className="mr-2" />
                        Test-E-Mail senden
                      </button>
                      
                      <button
                        onClick={saveTemplate}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        disabled={sending || !subject || !content}
                      >
                        <FiSave className="mr-2" />
                        Als Vorlage speichern
                      </button>
                    </div>
                    
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
                      ) : selectedCustomers.length > 10 ? (
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
                          An {selectedCustomers.length} Empfänger sofort senden
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
                  {/* Dynamisches Segment: Kunden, die noch keine E-Mail zu Vorlage/Betreff erhalten haben */}
                  <div className="mb-4 p-4 bg-yellow-50 rounded-md border border-yellow-200">
                    <h3 className="text-sm font-semibold text-yellow-800 mb-2">Nicht erhalten – Segment erstellen</h3>
                    <p className="text-xs text-yellow-700 mb-3">Wähle eine Vorlage oder gib einen Betreff ein, um eine Kundengruppe zu speichern, die hierzu noch keine gesendete E-Mail erhalten hat. Diese Gruppe aktualisiert sich automatisch bei neuen Sendungen.</p>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vorlage</label>
                        <select
                          value={nrTemplateId}
                          onChange={(e) => setNrTemplateId(e.target.value)}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                          <option value="">Keine Vorlage</option>
                          {templatesLoading ? (
                            <option value="" disabled>Vorlagen werden geladen…</option>
                          ) : templates.length === 0 ? (
                            <option value="" disabled>Keine Vorlagen verfügbar</option>
                          ) : (
                            templates.map(t => (
                              <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Betreff enthält</label>
                        <input
                          type="text"
                          value={nrSubjectContains}
                          onChange={(e) => setNrSubjectContains(e.target.value)}
                          placeholder="z.B. Gutschein, Herbstaktion"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Segmentname</label>
                        <input
                          type="text"
                          value={nrSegmentName}
                          onChange={(e) => setNrSegmentName(e.target.value)}
                          placeholder="Noch keine E-Mail zu Thema/Vorlage"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung (optional)</label>
                        <input
                          type="text"
                          value={nrSegmentDescription}
                          onChange={(e) => setNrSegmentDescription(e.target.value)}
                          placeholder="z.B. Kunden ohne Mailing ‚Herbstaktion‘"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={saveNotReceivedSegment}
                          disabled={savingSegment || (!nrTemplateId && !nrSubjectContains)}
                          className={`px-3 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 ${savingSegment || (!nrTemplateId && !nrSubjectContains) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {savingSegment ? 'Speichern…' : 'Segment speichern'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
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
                    {selectedCustomers.length > 10 && (
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
                              Die E-Mails werden in Batches von 200 E-Mails pro Stunde versendet, um Server-Timeouts zu vermeiden.
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
                        Kunden ({totalCustomers} gesamt, Seite {currentPage} von {totalPages})
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
                          {paginatedCustomers.map(customer => (
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
                    
                    {/* Bulk Selection Controls */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-md border">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bulk-Auswahl
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max={filteredCustomers.length}
                          value={bulkSelectCount}
                          onChange={(e) => setBulkSelectCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="50"
                        />
                        <button
                          onClick={() => bulkSelectCustomers(bulkSelectCount, false)}
                          disabled={paginatedCustomers.length === 0}
                          className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Erste {Math.min(bulkSelectCount, paginatedCustomers.length)} auf dieser Seite
                        </button>
                        <button
                          onClick={() => bulkSelectCustomers(bulkSelectCount, true)}
                          disabled={filteredCustomers.length === 0}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Erste {Math.min(bulkSelectCount, filteredCustomers.length)} insgesamt
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Wählt Kontakte entweder von der aktuellen Seite oder aus allen gefilterten Ergebnissen aus
                      </p>
                    </div>

                    {/* Page Size Selector */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-md border">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ergebnisse pro Seite
                      </label>
                      <div className="flex items-center space-x-2">
                        <select
                          value={itemsPerPage}
                          onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                          className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                          <option value={25}>25 pro Seite</option>
                          <option value={50}>50 pro Seite</option>
                          <option value={100}>100 pro Seite</option>
                          <option value={200}>200 pro Seite</option>
                        </select>
                      </div>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-4 p-3 bg-white rounded-md border">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            Vorherige
                          </button>
                          
                          <div className="flex items-center space-x-1">
                            {/* Page Numbers */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`px-2 py-1 text-sm rounded ${
                                    currentPage === pageNum
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            Nächste
                          </button>
                        </div>
                        
                        <div className="mt-2 text-center">
                          <span className="text-xs text-gray-500">
                            Zeige {startIndex + 1}-{Math.min(endIndex, totalCustomers)} von {totalCustomers} Kunden
                          </span>
                        </div>
                      </div>
                    )}
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
