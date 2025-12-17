import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<string>('Überprüfe Verbindung zu Supabase...');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<any>({});
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Supabase-Konfiguration anzeigen (ohne sensible Daten)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Nicht gesetzt';
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    setConfig({
      url,
      hasKey,
      nodeEnv: process.env.NODE_ENV || 'Nicht gesetzt'
    });
    
    // Verschiedene Tests durchführen
    const runTests = async () => {
      const results = [];
      setIsLoading(true);
      
      // Test 1: Basis-Verbindung prüfen
      try {
        console.log('Test 1: Prüfe Basis-Verbindung zu Supabase...');
        const startTime = Date.now();
        const { data, error } = await supabase.auth.getSession();
        const endTime = Date.now();
        
        results.push({
          name: 'Basis-Verbindung (getSession)',
          success: !error,
          time: `${endTime - startTime}ms`,
          error: error ? JSON.stringify(error) : null,
          data: data ? 'Session-Daten vorhanden' : 'Keine Session-Daten'
        });
        
        if (error) {
          console.error('Fehler bei Basis-Verbindung:', error);
          setStatus('Fehler bei der Basis-Verbindung zu Supabase');
          setError(JSON.stringify(error));
        }
      } catch (err: any) {
        console.error('Unerwarteter Fehler bei Basis-Verbindung:', err);
        results.push({
          name: 'Basis-Verbindung (getSession)',
          success: false,
          error: err.message || 'Unbekannter Fehler',
          stack: err.stack
        });
      }
      
      // Test 2: Direkte Fetch-Anfrage an Supabase URL
      try {
        console.log('Test 2: Direkte Fetch-Anfrage an Supabase URL...');
        const startTime = Date.now();
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          }
        });
        const endTime = Date.now();
        
        results.push({
          name: 'Direkte Fetch-Anfrage',
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          time: `${endTime - startTime}ms`
        });
      } catch (err: any) {
        console.error('Fehler bei direkter Fetch-Anfrage:', err);
        results.push({
          name: 'Direkte Fetch-Anfrage',
          success: false,
          error: err.message || 'Unbekannter Fehler'
        });
      }
      
      // Test 3: Netzwerk-Diagnose
      try {
        console.log('Test 3: Netzwerk-Diagnose...');
        const networkInfo = {
          online: navigator.onLine,
          userAgent: navigator.userAgent,
          language: navigator.language,
          cookiesEnabled: navigator.cookieEnabled
        };
        
        results.push({
          name: 'Netzwerk-Diagnose',
          success: true,
          info: networkInfo
        });
      } catch (err: any) {
        results.push({
          name: 'Netzwerk-Diagnose',
          success: false,
          error: err.message || 'Unbekannter Fehler'
        });
      }
      
      setTestResults(results);
      setIsLoading(false);
      
      // Gesamtstatus basierend auf Testergebnissen setzen
      const allSuccess = results.every(r => r.success);
      if (allSuccess) {
        setStatus('Alle Tests erfolgreich!');
      } else {
        setStatus('Einige Tests sind fehlgeschlagen. Siehe Details unten.');
      }
    };
    
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Supabase-Verbindungstest</h1>
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Konfiguration:</h2>
          <div className="bg-gray-100 p-3 rounded">
            <p><strong>URL:</strong> {config.url}</p>
            <p><strong>API-Key:</strong> {config.hasKey ? 'Gesetzt' : 'Nicht gesetzt'}</p>
            <p><strong>Umgebung:</strong> {config.nodeEnv}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Status:</h2>
          <div className={`p-3 rounded ${status.includes('erfolgreich') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {isLoading ? 'Tests werden ausgeführt...' : status}
          </div>
        </div>
        
        {error && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Fehler:</h2>
            <div className="bg-red-100 text-red-800 p-3 rounded overflow-auto max-h-40">
              <pre className="whitespace-pre-wrap">{error}</pre>
            </div>
          </div>
        )}
        
        {testResults.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Testergebnisse:</h2>
            {testResults.map((test, index) => (
              <div key={index} className="mb-3 border rounded overflow-hidden">
                <div className={`p-2 ${test.success ? 'bg-green-100' : 'bg-red-100'} flex justify-between items-center`}>
                  <span className="font-medium">{test.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${test.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {test.success ? 'Erfolg' : 'Fehler'}
                  </span>
                </div>
                <div className="p-3 bg-white">
                  {test.time && <p><strong>Zeit:</strong> {test.time}</p>}
                  {test.status && <p><strong>Status:</strong> {test.status} {test.statusText}</p>}
                  {test.data && <p><strong>Daten:</strong> {test.data}</p>}
                  {test.error && (
                    <div className="mt-2">
                      <p><strong>Fehler:</strong></p>
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">{test.error}</pre>
                    </div>
                  )}
                  {test.info && (
                    <div className="mt-2">
                      <p><strong>Netzwerk-Info:</strong></p>
                      <pre className="bg-gray-100 p-2 rounded text-xs">
                        {Object.entries(test.info).map(([key, value]) => (
                          <div key={key}>{key}: {String(value)}</div>
                        ))}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 flex justify-between">
          <a href="/" className="text-blue-600 hover:text-blue-800">Zurück zur Startseite</a>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tests erneut ausführen
          </button>
        </div>
      </div>
    </div>
  );
}
