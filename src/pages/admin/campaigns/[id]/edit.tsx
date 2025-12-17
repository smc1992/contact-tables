import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { withAuth } from '@/utils/withAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { Form, Input, Button, Select, DatePicker, TimePicker, Tabs, message, Spin, Checkbox, Radio } from 'antd';
import { FiSave, FiSend, FiCalendar, FiUsers, FiMail, FiClock, FiArrowLeft } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import moment from 'moment';
import 'moment/locale/de';

interface Campaign {
  id: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'failed';
  schedule_type: 'immediate' | 'scheduled' | 'recurring';
  scheduled_at?: string;
  recurring_config?: any;
  target_config?: any;
  template_id?: string;
  created_at: string;
  updated_at: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
}

interface UserTag {
  id: string;
  name: string;
  userCount: number;
}

// Import rich text editor with dynamic import to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

const { TabPane } = Tabs;
const { Option } = Select;

function CampaignEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [scheduleType, setScheduleType] = useState('immediate');
  const [recurringFrequency, setRecurringFrequency] = useState('daily');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tags, setTags] = useState<UserTag[]>([]);
  const [targetType, setTargetType] = useState('all');
  const [externalEmails, setExternalEmails] = useState<string>('');
  const [content, setContent] = useState('');
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5]); // Mo, Mi, Fr
  const [monthdays, setMonthdays] = useState<number[]>([1, 15]); // 1. und 15. des Monats
  
  useEffect(() => {
    fetchTemplates();
    fetchTags();
    
    if (!isNew && id) {
      fetchCampaign();
    }
  }, [id]);
  
  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/admin/campaigns/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setCampaign(data);
        setContent(data.content || '');
        setScheduleType(data.schedule_type || 'immediate');
        
        // Wiederkehrende Konfiguration parsen
        let recurringConfig: any = null;
        if (data.schedule_type === 'recurring' && data.recurring_config) {
          recurringConfig = typeof data.recurring_config === 'string' 
            ? JSON.parse(data.recurring_config) 
            : data.recurring_config;
          
          setRecurringFrequency(recurringConfig.frequency || 'daily');
          
          if (recurringConfig.frequency === 'weekly' && Array.isArray(recurringConfig.days)) {
            setWeekdays(recurringConfig.days);
          } else if (recurringConfig.frequency === 'monthly' && Array.isArray(recurringConfig.days)) {
            setMonthdays(recurringConfig.days);
          }
        }
        
        // Zielgruppe setzen
        if (data.target_config) {
          let targetConfig: any = null;
          targetConfig = typeof data.target_config === 'string'
            ? JSON.parse(data.target_config)
            : data.target_config;
          
          setTargetType(targetConfig.segment_type || 'all');
          
          // Externe E-Mail-Adressen laden, falls vorhanden
          if (targetConfig.segment_type === 'external' && targetConfig.external_emails) {
            setExternalEmails(targetConfig.external_emails.join(', '));
          }
        }
        
        // Formularwerte setzen
        form.setFieldsValue({
          subject: data.subject,
          template_id: data.template_id || undefined,
          schedule_type: data.schedule_type || 'immediate',
          scheduled_at: data.scheduled_at ? moment(data.scheduled_at) : undefined,
          recurring_frequency: recurringConfig?.frequency || 'daily',
          recurring_time: recurringConfig?.time ? moment(recurringConfig.time, 'HH:mm') : undefined,
          recurring_start_date: recurringConfig?.start_date ? moment(recurringConfig.start_date) : undefined,
          recurring_end_date: recurringConfig?.end_date ? moment(recurringConfig.end_date) : undefined,
          target_type: data.target_config?.segment_type || 'all',
          tag_ids: data.target_config?.tag_ids || [],
        });
      } else {
        message.error(data.error || 'Fehler beim Laden der Kampagne');
        router.push('/admin/campaigns');
      }
    } catch (error: unknown) {
      console.error('Fehler beim Laden der Kampagne:', error);
      message.error('Fehler beim Laden der Kampagne');
      router.push('/admin/campaigns');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/emails/templates');
      const result = await response.json();
      
      if (result.ok && Array.isArray(result.data)) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Vorlagen:', error);
    }
  };
  
  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/tags/list');
      const result = await response.json();
      
      if (Array.isArray(result.tags)) {
        setTags(result.tags);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Tags:', error);
    }
  };
  
  const handleTemplateChange = (templateId: string) => {
    if (!templateId) return;
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      form.setFieldsValue({
        subject: template.subject
      });
      setContent(template.content);
    }
  };
  
  const handleSave = async (values: any) => {
    setSaving(true);
    
    try {
      // Kampagnendaten vorbereiten
      const campaignData: any = {
        subject: values.subject,
        content: content,
        schedule_type: values.schedule_type,
        template_id: values.template_id || undefined
      };
      
      // Zeitplanung basierend auf dem ausgewählten Typ
      if (values.schedule_type === 'scheduled') {
        campaignData.scheduled_at = values.scheduled_at?.toISOString();
      } else if (values.schedule_type === 'recurring') {
        const recurringConfig: any = {
          frequency: values.recurring_frequency,
          time: values.recurring_time?.format('HH:mm'),
          start_date: values.recurring_start_date?.toISOString()
        };
        
        if (values.recurring_end_date) {
          recurringConfig.end_date = values.recurring_end_date.toISOString();
        }
        
        if (values.recurring_frequency === 'weekly') {
          recurringConfig.days = weekdays;
        } else if (values.recurring_frequency === 'monthly') {
          recurringConfig.days = monthdays;
        }
        
        campaignData.recurring_config = recurringConfig;
      }
      
      // Zielgruppe
      campaignData.target_config = {
        segment_type: values.target_type
      };
      
      if (values.target_type === 'tag' && values.tag_ids) {
        campaignData.target_config.tag_ids = values.tag_ids;
      }
      
      // Externe E-Mail-Adressen verarbeiten
      if (values.target_type === 'external' && externalEmails) {
        // E-Mail-Adressen bereinigen und validieren
        const emailList = externalEmails
          .split(',')
          .map(email => email.trim())
          .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
        
        campaignData.target_config.external_emails = emailList;
      }
      
      // API-Aufruf
      const url = isNew ? '/api/admin/campaigns' : `/api/admin/campaigns/${id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        message.success(`Kampagne erfolgreich ${isNew ? 'erstellt' : 'aktualisiert'}`);
        
        if (isNew && result.campaign?.id) {
          router.push(`/admin/campaigns/${result.campaign.id}/edit`);
        } else {
          router.push('/admin/campaigns');
        }
      } else {
        throw new Error(result.error || 'Fehler beim Speichern der Kampagne');
      }
    } catch (error: unknown) {
      console.error('Fehler beim Speichern der Kampagne:', error);
      message.error(`Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setSaving(false);
    }
  };
  
  const handleScheduleTypeChange = (e: any) => {
    setScheduleType(e.target.value);
  };
  
  const handleRecurringFrequencyChange = (value: string) => {
    setRecurringFrequency(value);
  };
  
  const handleTargetTypeChange = (e: any) => {
    setTargetType(e.target.value);
  };
  
  const handleExternalEmailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExternalEmails(e.target.value);
  };
  
  const handleWeekdayChange = (checkedValues: number[]) => {
    setWeekdays(checkedValues);
  };
  
  const handleMonthdayChange = (checkedValues: number[]) => {
    setMonthdays(checkedValues);
  };
  
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <AdminSidebar activeItem="campaigns" />
          <main className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
            <Spin size="large" tip="Kampagne wird geladen..." />
          </main>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="campaigns" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <Button 
                  icon={<FiArrowLeft />} 
                  onClick={() => router.push('/admin/campaigns')}
                  className="mr-4"
                >
                  Zurück
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isNew ? 'Neue Kampagne erstellen' : 'Kampagne bearbeiten'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isNew 
                      ? 'Erstellen Sie eine neue Email-Kampagne' 
                      : 'Bearbeiten Sie die Einstellungen der Kampagne'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                  schedule_type: 'immediate',
                  recurring_frequency: 'daily',
                  target_type: 'all'
                }}
              >
                <Tabs defaultActiveKey="content">
                  <TabPane 
                    tab={
                      <span className="flex items-center">
                        <FiMail className="mr-2" />
                        Inhalt
                      </span>
                    } 
                    key="content"
                  >
                    <div className="mb-4">
                      <Form.Item
                        name="template_id"
                        label="Vorlage auswählen"
                      >
                        <Select
                          placeholder="Keine Vorlage"
                          onChange={handleTemplateChange}
                          allowClear
                        >
                          {templates.map(template => (
                            <Option key={template.id} value={template.id}>
                              {template.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                    
                    <div className="mb-4">
                      <Form.Item
                        name="subject"
                        label="Betreff"
                        rules={[{ required: true, message: 'Bitte geben Sie einen Betreff ein' }]}
                      >
                        <Input placeholder="Betreff der Email" />
                      </Form.Item>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Inhalt
                      </label>
                      <div className="border rounded-md">
                        <ReactQuill
                          value={content}
                          onChange={setContent}
                          modules={modules}
                          className="h-64 mb-4"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Verwenden Sie {'{name}'} als Platzhalter für den Namen des Empfängers.
                      </p>
                    </div>
                  </TabPane>
                  
                  <TabPane 
                    tab={
                      <span className="flex items-center">
                        <FiCalendar className="mr-2" />
                        Zeitplanung
                      </span>
                    } 
                    key="schedule"
                  >
                    <div className="mb-6">
                      <Form.Item
                        name="schedule_type"
                        label="Art der Zeitplanung"
                      >
                        <Radio.Group onChange={handleScheduleTypeChange}>
                          <Radio value="immediate">Sofort senden</Radio>
                          <Radio value="scheduled">Zu einem bestimmten Zeitpunkt senden</Radio>
                          <Radio value="recurring">Wiederkehrend senden</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </div>
                    
                    {scheduleType === 'scheduled' && (
                      <div className="mb-6">
                        <Form.Item
                          name="scheduled_at"
                          label="Zeitpunkt"
                          rules={[{ required: true, message: 'Bitte wählen Sie einen Zeitpunkt' }]}
                        >
                          <DatePicker 
                            showTime 
                            format="DD.MM.YYYY HH:mm" 
                            placeholder="Datum und Uhrzeit auswählen"
                            className="w-full"
                          />
                        </Form.Item>
                      </div>
                    )}
                    
                    {scheduleType === 'recurring' && (
                      <>
                        <div className="mb-4">
                          <Form.Item
                            name="recurring_frequency"
                            label="Häufigkeit"
                          >
                            <Select onChange={handleRecurringFrequencyChange}>
                              <Option value="daily">Täglich</Option>
                              <Option value="weekly">Wöchentlich</Option>
                              <Option value="monthly">Monatlich</Option>
                            </Select>
                          </Form.Item>
                        </div>
                        
                        {recurringFrequency === 'weekly' && (
                          <div className="mb-4">
                            <Form.Item
                              label="Wochentage"
                              required
                            >
                              <Checkbox.Group 
                                options={[
                                  { label: 'Montag', value: 1 },
                                  { label: 'Dienstag', value: 2 },
                                  { label: 'Mittwoch', value: 3 },
                                  { label: 'Donnerstag', value: 4 },
                                  { label: 'Freitag', value: 5 },
                                  { label: 'Samstag', value: 6 },
                                  { label: 'Sonntag', value: 0 }
                                ]}
                                value={weekdays}
                                onChange={handleWeekdayChange}
                              />
                            </Form.Item>
                          </div>
                        )}
                        
                        {recurringFrequency === 'monthly' && (
                          <div className="mb-4">
                            <Form.Item
                              label="Tage des Monats"
                              required
                            >
                              <div className="grid grid-cols-7 gap-2">
                                <Checkbox.Group 
                                  value={monthdays}
                                  onChange={handleMonthdayChange}
                                >
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <Checkbox key={day} value={day}>
                                      {day}
                                    </Checkbox>
                                  ))}
                                </Checkbox.Group>
                              </div>
                            </Form.Item>
                          </div>
                        )}
                        
                        <div className="mb-4">
                          <Form.Item
                            name="recurring_time"
                            label="Uhrzeit"
                          >
                            <TimePicker 
                              format="HH:mm" 
                              className="w-full"
                              placeholder="Uhrzeit auswählen"
                            />
                          </Form.Item>
                        </div>
                        
                        <div className="mb-4">
                          <Form.Item
                            name="recurring_start_date"
                            label="Startdatum"
                            rules={[{ required: true, message: 'Bitte wählen Sie ein Startdatum' }]}
                          >
                            <DatePicker 
                              format="DD.MM.YYYY" 
                              className="w-full"
                              placeholder="Startdatum auswählen"
                            />
                          </Form.Item>
                        </div>
                        
                        <div className="mb-4">
                          <Form.Item
                            name="recurring_end_date"
                            label="Enddatum (optional)"
                          >
                            <DatePicker 
                              format="DD.MM.YYYY" 
                              className="w-full"
                              placeholder="Enddatum auswählen"
                            />
                          </Form.Item>
                        </div>
                      </>
                    )}
                  </TabPane>
                  
                  <TabPane 
                    tab={
                      <span className="flex items-center">
                        <FiUsers className="mr-2" />
                        Zielgruppe
                      </span>
                    } 
                    key="target"
                  >
                    <div className="mb-6">
                      <Form.Item
                        name="target_type"
                        label="Zielgruppe auswählen"
                      >
                        <Radio.Group onChange={handleTargetTypeChange}>
                          <Radio value="all">Alle Kunden</Radio>
                          <Radio value="tag">Nach Tags filtern</Radio>
                          <Radio value="external">Externe E-Mail-Adressen</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </div>
                    
                    {targetType === 'tag' && (
                      <div className="mb-6">
                        <Form.Item
                          name="tag_ids"
                          label="Tags auswählen"
                          rules={[{ required: true, message: 'Bitte wählen Sie mindestens einen Tag' }]}
                        >
                          <Select
                            mode="multiple"
                            placeholder="Tags auswählen"
                            className="w-full"
                          >
                            {tags.map(tag => (
                              <Option key={tag.id} value={tag.id}>
                                {tag.name} ({tag.userCount} Benutzer)
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>
                    )}
                    
                    {targetType === 'external' && (
                      <div className="mb-6">
                        <Form.Item
                          label="Externe E-Mail-Adressen"
                          help="Geben Sie E-Mail-Adressen durch Kommas getrennt ein"
                          rules={[{ required: true, message: 'Bitte geben Sie mindestens eine E-Mail-Adresse ein' }]}
                        >
                          <Input.TextArea 
                            rows={6} 
                            value={externalEmails}
                            onChange={handleExternalEmailsChange}
                            placeholder="beispiel1@domain.de, beispiel2@domain.de, ..."
                          />
                        </Form.Item>
                      </div>
                    )}
                  </TabPane>
                </Tabs>
                
                <div className="flex justify-end mt-6 space-x-3">
                  <Button 
                    onClick={() => router.push('/admin/campaigns')}
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={saving}
                    icon={<FiSave />}
                  >
                    Speichern
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'],
  async (context, user) => {
    return {
      props: {}
    };
  }
);

export default CampaignEditorPage;
