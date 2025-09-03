import React, { useState } from 'react';
import { generateDkimKeyPair, createDnsRecords } from '@/utils/dkimGenerator';
import { FiCopy, FiInfo, FiLoader } from 'react-icons/fi';

interface DkimKeyGeneratorProps {
  domain: string;
  selector: string;
  onKeysGenerated: (privateKey: string, publicKey: string, dnsRecord: string) => void;
}

const DkimKeyGenerator: React.FC<DkimKeyGeneratorProps> = ({ domain, selector, onKeysGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [keySize, setKeySize] = useState<number>(2048);
  const [generatedKeys, setGeneratedKeys] = useState<{
    privateKey: string;
    publicKey: string;
    dnsRecord: string;
  } | null>(null);
  const [dnsRecords, setDnsRecords] = useState<{
    spf: string;
    dkim: string;
    dmarc: string;
  } | null>(null);
  const [notification, setNotification] = useState<{show: boolean, message: string}>({show: false, message: ''});

  const handleGenerateKeys = async () => {
    try {
      setIsGenerating(true);
      
      // Simuliere eine kurze Verzögerung für bessere UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generiere DKIM-Schlüsselpaar
      const keys = generateDkimKeyPair(keySize);
      setGeneratedKeys(keys);
      
      // Erstelle DNS-Einträge
      if (domain && selector) {
        const records = createDnsRecords(domain, selector, keys.dnsRecord);
        setDnsRecords(records);
      }
      
      // Callback für übergeordnete Komponente
      onKeysGenerated(keys.privateKey, keys.publicKey, keys.dnsRecord);
      
    } catch (error) {
      console.error('Fehler bei der Schlüsselgenerierung:', error);
      showNotification('Fehler bei der Schlüsselgenerierung');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        showNotification(`${description} in die Zwischenablage kopiert`);
      },
      () => {
        showNotification('Kopieren fehlgeschlagen');
      }
    );
  };

  const showNotification = (message: string) => {
    setNotification({show: true, message});
    setTimeout(() => {
      setNotification({show: false, message: ''});
    }, 3000);
  };

  const handleKeySizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeySize(parseInt(e.target.value, 10));
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">DKIM-Schlüssel Generator</h3>
          <p className="text-sm text-gray-500">Erstellt ein neues DKIM-Schlüsselpaar für E-Mail-Authentifizierung</p>
        </div>
        <div className="relative group">
          <button className="text-gray-400 hover:text-gray-600">
            <FiInfo className="h-5 w-5" />
          </button>
          <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            DKIM (DomainKeys Identified Mail) ist ein E-Mail-Authentifizierungsstandard, der sicherstellt, dass E-Mails tatsächlich von Ihrer Domain gesendet wurden und während der Übertragung nicht verändert wurden.
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <label htmlFor="keySize" className="block text-sm font-medium text-gray-700 mb-1">
            Schlüsselgröße (Bits)
          </label>
          <input
            id="keySize"
            type="number"
            value={keySize}
            onChange={handleKeySizeChange}
            min={1024}
            max={4096}
            step={1024}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">Empfohlen: 2048 Bits (höhere Werte = sicherer, aber langsamer)</p>
          
          <button
            onClick={handleGenerateKeys}
            disabled={isGenerating}
            className={`mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generiere Schlüssel...
              </>
            ) : 'Neues Schlüsselpaar generieren'}
          </button>
        </div>

        {generatedKeys && (
          <>
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">DKIM-Schlüsselpaar erfolgreich generiert!</p>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900">Privater Schlüssel</h4>
                <button 
                  onClick={() => copyToClipboard(generatedKeys.privateKey, 'Privater Schlüssel')}
                  className="text-gray-500 hover:text-gray-700"
                  title="Kopieren"
                >
                  <FiCopy className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-1 relative">
                <textarea
                  rows={6}
                  value={generatedKeys.privateKey}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900">Öffentlicher Schlüssel (DNS-Eintrag)</h4>
                <button 
                  onClick={() => copyToClipboard(generatedKeys.dnsRecord, 'DNS-Eintrag')}
                  className="text-gray-500 hover:text-gray-700"
                  title="Kopieren"
                >
                  <FiCopy className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-1 relative">
                <textarea
                  rows={3}
                  value={generatedKeys.dnsRecord}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />
              </div>
            </div>
          </>
        )}

        {dnsRecords && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">DNS-Einträge für {domain}</h3>
            
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-700">DKIM-Eintrag</h4>
                <button 
                  onClick={() => copyToClipboard(dnsRecords.dkim, 'DKIM-Eintrag')}
                  className="text-gray-500 hover:text-gray-700"
                  title="Kopieren"
                >
                  <FiCopy className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-1 relative">
                <textarea
                  rows={2}
                  value={dnsRecords.dkim}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-700">SPF-Eintrag</h4>
                <button 
                  onClick={() => copyToClipboard(dnsRecords.spf, 'SPF-Eintrag')}
                  className="text-gray-500 hover:text-gray-700"
                  title="Kopieren"
                >
                  <FiCopy className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-1 relative">
                <input
                  type="text"
                  value={dnsRecords.spf}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-700">DMARC-Eintrag</h4>
                <button 
                  onClick={() => copyToClipboard(dnsRecords.dmarc, 'DMARC-Eintrag')}
                  className="text-gray-500 hover:text-gray-700"
                  title="Kopieren"
                >
                  <FiCopy className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-1 relative">
                <textarea
                  rows={2}
                  value={dnsRecords.dmarc}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />
              </div>
            </div>
          </>
        )}
      </div>
      
      {notification.show && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-out">
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default DkimKeyGenerator;
