import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { FiSave, FiRefreshCw, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

interface SmtpSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  contact_email: string;
}

export default function SmtpSettings() {
  const [settings, setSettings] = useState<SmtpSettings>({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    contact_email: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const supabase = createClient();

  // Load SMTP settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('smtp_host, smtp_port, smtp_user, smtp_password, contact_email')
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw error;
      }
      
      if (data) {
        setSettings({
          smtp_host: data.smtp_host || '',
          smtp_port: Number(data.smtp_port) || 587,
          smtp_user: data.smtp_user || '',
          smtp_password: data.smtp_password || '',
          contact_email: data.contact_email || ''
        });
      } else {
        // Use env variables as fallback
        const envSettings = {
          smtp_host: process.env.NEXT_PUBLIC_EMAIL_SERVER_HOST || '',
          smtp_port: Number(process.env.NEXT_PUBLIC_EMAIL_SERVER_PORT) || 587,
          smtp_user: process.env.NEXT_PUBLIC_EMAIL_SERVER_USER || '',
          smtp_password: '', // Don't expose password from env
          contact_email: process.env.NEXT_PUBLIC_EMAIL_FROM || ''
        };
        setSettings(envSettings);
      }
    } catch (error) {
      console.error('Fehler beim Laden der SMTP-Einstellungen:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save SMTP settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 'smtp_settings',
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_user: settings.smtp_user,
          smtp_password: settings.smtp_password,
          contact_email: settings.contact_email
        });
      
      if (error) throw error;
      
      alert('SMTP-Einstellungen wurden erfolgreich gespeichert.');
    } catch (error) {
      console.error('Fehler beim Speichern der SMTP-Einstellungen:', error);
      alert(`Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setSaving(false);
    }
  };

  // Test SMTP connection
  const testSmtpConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/admin/emails/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      setTestResult({
        success: result.ok,
        message: result.message
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Verbindungstest fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name === 'smtp_port' ? Number(value) : value
    }));
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">SMTP-Einstellungen</h2>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); saveSettings(); }} className="space-y-4">
          <div>
            <label htmlFor="smtp_host" className="block text-sm font-medium text-gray-700 mb-1">
              SMTP-Server
            </label>
            <input
              type="text"
              id="smtp_host"
              name="smtp_host"
              value={settings.smtp_host}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="z.B. smtp.gmail.com"
              required
            />
          </div>
          
          <div>
            <label htmlFor="smtp_port" className="block text-sm font-medium text-gray-700 mb-1">
              SMTP-Port
            </label>
            <input
              type="number"
              id="smtp_port"
              name="smtp_port"
              value={settings.smtp_port}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="587 oder 465"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Übliche Ports: 587 (TLS) oder 465 (SSL)
            </p>
          </div>
          
          <div>
            <label htmlFor="smtp_user" className="block text-sm font-medium text-gray-700 mb-1">
              SMTP-Benutzername
            </label>
            <input
              type="text"
              id="smtp_user"
              name="smtp_user"
              value={settings.smtp_user}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="E-Mail-Adresse oder Benutzername"
              required
            />
          </div>
          
          <div>
            <label htmlFor="smtp_password" className="block text-sm font-medium text-gray-700 mb-1">
              SMTP-Passwort
            </label>
            <input
              type="password"
              id="smtp_password"
              name="smtp_password"
              value={settings.smtp_password}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={settings.smtp_password ? '••••••••' : 'SMTP-Passwort'}
              required
            />
          </div>
          
          <div>
            <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
              Absender-E-Mail
            </label>
            <input
              type="email"
              id="contact_email"
              name="contact_email"
              value={settings.contact_email}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="noreply@example.com"
              required
            />
          </div>
          
          {testResult && (
            <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {testResult.success ? (
                    <FiCheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <FiAlertTriangle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    {testResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={testSmtpConnection}
              disabled={testing || saving}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center ${(testing || saving) ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {testing ? (
                <>
                  <FiRefreshCw className="animate-spin mr-2" />
                  Verbindung wird getestet...
                </>
              ) : (
                <>
                  <FiRefreshCw className="mr-2" />
                  SMTP-Verbindung testen
                </>
              )}
            </button>
            
            <button
              type="submit"
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
                  Einstellungen speichern
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
