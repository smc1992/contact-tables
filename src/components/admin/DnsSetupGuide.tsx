import React from 'react';
import { FiCopy, FiCheckCircle } from 'react-icons/fi';

interface DnsRecord {
  type: string;
  host: string;
  value: string;
  description: string;
}

interface DnsSetupGuideProps {
  domain: string;
  selector: string;
  spfRecord: string;
  dkimRecord: string;
  dmarcPolicy: string;
}

const DnsSetupGuide: React.FC<DnsSetupGuideProps> = ({
  domain,
  selector,
  spfRecord,
  dkimRecord,
  dmarcPolicy
}) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  // Erstelle DNS-Einträge
  const dnsRecords: DnsRecord[] = [
    {
      type: 'TXT',
      host: domain,
      value: spfRecord,
      description: 'SPF-Eintrag: Definiert, welche Server E-Mails für Ihre Domain versenden dürfen'
    },
    {
      type: 'TXT',
      host: `${selector}._domainkey.${domain}`,
      value: dkimRecord,
      description: 'DKIM-Eintrag: Ermöglicht die kryptografische Signatur und Verifizierung von E-Mails'
    },
    {
      type: 'TXT',
      host: `_dmarc.${domain}`,
      value: `v=DMARC1; p=${dmarcPolicy}; sp=${dmarcPolicy}; adkim=r; aspf=r; rua=mailto:dmarc-reports@${domain}; ruf=mailto:dmarc-reports@${domain}; fo=1;`,
      description: 'DMARC-Eintrag: Legt fest, wie mit nicht authentifizierten E-Mails umgegangen wird'
    }
  ];

  // Kopiere Text in die Zwischenablage
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">DNS-Einrichtungsanleitung</h2>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Fügen Sie die folgenden DNS-Einträge bei Ihrem Domain-Anbieter hinzu, um die E-Mail-Authentifizierung zu aktivieren.
              Nach dem Hinzufügen kann es bis zu 24 Stunden dauern, bis die Änderungen vollständig übernommen wurden.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host/Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wert/Inhalt</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktion</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dnsRecords.map((record, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{record.host}</td>
                <td className="px-6 py-4 text-sm text-gray-500 font-mono break-all">
                  <div className="max-w-md">{record.value}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => copyToClipboard(record.value, index)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {copiedIndex === index ? (
                      <>
                        <FiCheckCircle className="mr-1" />
                        Kopiert!
                      </>
                    ) : (
                      <>
                        <FiCopy className="mr-1" />
                        Kopieren
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h3 className="text-md font-medium text-gray-900 mb-2">Beschreibung der Einträge:</h3>
        <ul className="list-disc pl-5 space-y-2">
          {dnsRecords.map((record, index) => (
            <li key={index} className="text-sm text-gray-600">
              <span className="font-medium">{record.type} für {record.host}:</span> {record.description}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Wichtig:</strong> Bei manchen DNS-Anbietern müssen Sie den Domainnamen am Ende des Host-Eintrags weglassen oder durch einen Punkt (.) ersetzen.
              Prüfen Sie die spezifischen Anforderungen Ihres DNS-Anbieters.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-md font-medium text-gray-900 mb-2">Überprüfung der Einträge:</h3>
        <p className="text-sm text-gray-600 mb-2">
          Nach dem Hinzufügen der DNS-Einträge können Sie deren Korrektheit mit folgenden Tools überprüfen:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li className="text-sm text-gray-600">
            <a href={`https://mxtoolbox.com/SuperTool.aspx?action=spf%3a${domain}&run=toolpage`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
              SPF-Eintrag prüfen (MXToolbox)
            </a>
          </li>
          <li className="text-sm text-gray-600">
            <a href={`https://mxtoolbox.com/SuperTool.aspx?action=dkim%3a${selector}%3a${domain}&run=toolpage`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
              DKIM-Eintrag prüfen (MXToolbox)
            </a>
          </li>
          <li className="text-sm text-gray-600">
            <a href={`https://mxtoolbox.com/SuperTool.aspx?action=dmarc%3a${domain}&run=toolpage`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
              DMARC-Eintrag prüfen (MXToolbox)
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DnsSetupGuide;
