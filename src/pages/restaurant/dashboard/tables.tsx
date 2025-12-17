import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { createClient } from '../../../utils/supabase/server';
// Prisma wird hier nicht benötigt; wir laden Daten über Supabase, damit die Seite
// auch in Produktionsumgebungen ohne Prisma-Verbindung zuverlässig funktioniert.
import { motion } from 'framer-motion';
import { FiPlus, FiCalendar, FiUsers, FiEdit, FiTrash2, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import RestaurantSidebar from '../../../components/restaurant/RestaurantSidebar';

interface ContactTable {
  id: string;
  title: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
  paused?: boolean;
  isIndefinite?: boolean;
  pauseStart?: string | null;
  pauseEnd?: string | null;
}

interface RestaurantData {
  id: string;
  name: string;
  address: string;
  city: string;
  isActive: boolean;
  contractStatus: string;
  contractToken?: string | null;
}

interface TablesPageProps {
  restaurant: RestaurantData | null;
  contactTables: ContactTable[];
}

export default function RestaurantTables({ restaurant, contactTables = [] }: TablesPageProps) {
  const [tables, setTables] = useState<ContactTable[]>(contactTables);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTableId, setCurrentTableId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);
  
  const [formData, setFormData] = useState({
    restaurantName: restaurant?.name || '',
    description: '',
    maxParticipants: 4,
    isPublic: !!restaurant?.isActive,
    paused: false,
    pauseStart: '',
    pauseEnd: '',
  });

  // Fallback-Rendering, wenn Restaurant-Daten nicht geladen werden konnten
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <main className="pt-20 px-4 md:px-8 pb-12">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
              <div className="flex items-center">
                <FiAlertCircle className="mr-2" />
                <p>Restaurant-Daten konnten nicht geladen werden. Bitte melden Sie sich erneut an oder registrieren Ihr Restaurant.</p>
              </div>
            </div>
            <a href="/restaurant/register" className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Restaurant registrieren
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxParticipants' ? (value === '' ? '' as any : parseInt(value) || 4) : value
    }));
  };
  
  const openModal = (table?: ContactTable) => {
    if (table) {
      // Bearbeiten-Modus
      setIsEditing(true);
      setCurrentTableId(table.id);
      setFormData({
        restaurantName: table.title || restaurant?.name || '',
        description: table.description,
        maxParticipants: table.maxParticipants,
        isPublic: !!restaurant?.isActive,
        paused: !!table.paused,
        pauseStart: table.pauseStart || '',
        pauseEnd: table.pauseEnd || '',
      });
    } else {
      // Neu-Modus
      setIsEditing(false);
      setCurrentTableId(null);
      setFormData({
        restaurantName: restaurant?.name || '',
        description: '',
        maxParticipants: 4,
        isPublic: !!restaurant?.isActive,
        paused: false,
        pauseStart: '',
        pauseEnd: '',
      });
    }
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Validierung
      if (!formData.restaurantName) {
        throw new Error('Bitte geben Sie den Restaurantnamen an');
      }

      if (formData.maxParticipants < 2) {
        throw new Error('Ein Contact-table muss mindestens 2 Teilnehmer haben');
      }

      if (formData.paused) {
        const start = formData.pauseStart ? new Date(`${formData.pauseStart}T00:00:00`) : null;
        const end = formData.pauseEnd ? new Date(`${formData.pauseEnd}T23:59:59`) : null;
        if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('Bitte gültige Pausendaten (von/bis) angeben');
        }
        if (end <= start) {
          throw new Error('Pause bis muss nach Pause von liegen');
        }
      }
      
      // Vorab: Restaurantname mit Supabase validieren
      try {
        const validateRes = await fetch('/api/restaurant/validate-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantId: restaurant.id, name: formData.restaurantName })
        });
        if (!validateRes.ok) {
          const err = await validateRes.json().catch(() => ({}));
          throw new Error(err.message || 'Restaurantname konnte nicht validiert werden');
        }
        const v = await validateRes.json();
        if (!v.valid) {
          throw new Error('Restaurantname stimmt nicht mit Supabase überein');
        }
      } catch (ve: any) {
        throw new Error(ve.message || 'Validierung des Restaurantnamens fehlgeschlagen');
      }

      // API-Aufruf zum Erstellen oder Aktualisieren des Contact-tables
      const url = isEditing 
        ? '/api/restaurant/update-contact-table' 
        : '/api/contact-tables';

      // Payload je nach Endpunkt korrekt benennen
      const dataToSend = isEditing 
        ? {
            tableId: currentTableId,
            restaurantId: restaurant.id,
            title: formData.restaurantName,
            description: formData.description,
            maxParticipants: formData.maxParticipants,
            paused: formData.paused,
            isIndefinite: true,
            pauseStart: formData.paused && formData.pauseStart ? `${formData.pauseStart}T00:00:00` : null,
            pauseEnd: formData.paused && formData.pauseEnd ? `${formData.pauseEnd}T23:59:59` : null,
          }
        : {
            title: formData.restaurantName,
            description: formData.description,
            datetime: null,
            end_datetime: null,
            max_participants: formData.maxParticipants,
            price: 0,
            restaurant_id: restaurant.id,
            is_public: restaurant?.isActive ? formData.isPublic : false,
            paused: formData.paused,
            is_indefinite: true,
            pause_start: formData.paused && formData.pauseStart ? `${formData.pauseStart}T00:00:00` : null,
            pause_end: formData.paused && formData.pauseEnd ? `${formData.pauseEnd}T23:59:59` : null,
          };

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Speichern des Contact-table');
      }
      
      const resp = await response.json();

      // Response je nach Endpoint formen
      const payload = isEditing ? resp.contactTable : resp.data;
      const newTableData: ContactTable = {
        id: payload.id,
        title: payload.title,
        description: payload.description || '',
        currentParticipants: payload?.current_participants ?? payload?.currentParticipants ?? 0,
        maxParticipants: payload?.max_participants ?? payload?.maxParticipants ?? formData.maxParticipants,
        status: payload?.status ?? 'OPEN',
        paused: !!(payload?.paused ?? formData.paused),
        isIndefinite: true,
        pauseStart: payload?.pause_start ?? null,
        pauseEnd: payload?.pause_end ?? null,
      };

      if (isEditing) {
        // Aktualisiere den bestehenden Tisch in der lokalen Liste
        setTables(prev => prev.map(table => 
          table.id === currentTableId ? newTableData : table
        ));
        setSuccess('Contact-table erfolgreich aktualisiert');
      } else {
        // Füge den neuen Tisch zur lokalen Liste hinzu
        setTables(prev => [...prev, newTableData]);
        setSuccess('Contact-table erfolgreich erstellt');
      }
      
      // Schließe das Modal
      closeModal();
    } catch (error: any) {
      console.error('Fehler beim Speichern des Contact-tables:', error);
      setError(error.message || 'Ein unerwarteter Fehler ist aufgetreten');
    }
  };
  
  const handleDelete = async (tableId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Contact-table löschen möchten?')) {
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/restaurant/delete-contact-table', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tableId,
          restaurantId: restaurant.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Löschen des Contact-table');
      }
      
      // Entferne den Tisch aus der lokalen Liste
      setTables(prev => prev.filter(table => table.id !== tableId));
      setSuccess('Contact-table erfolgreich gelöscht');
    } catch (error: any) {
      console.error('Fehler beim Löschen des Contact-tables:', error);
      setError(error.message || 'Ein unerwarteter Fehler ist aufgetreten');
    }
  };
  
  // Hilfsfunktion zum Formatieren des Datums
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '–';
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="flex flex-col md:flex-row">
        <RestaurantSidebar activeItem="tables" />
        
        <main className="flex-1 pt-20 px-4 md:px-8 pb-12">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Contact-tables</h1>
                <p className="text-gray-600 mt-2">
                  Erstellen und verwalten Sie Contact-tables für Ihr Restaurant.
                </p>
              </div>
              
              <button
                onClick={() => openModal()}
                className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FiPlus className="mr-2" />
                Neuen Contact-table erstellen
              </button>
            </div>
                
                {/* Öffentlich sichtbar */}
                <div>
                  <label htmlFor="isPublic" className="block text-sm font-medium text-gray-700 mb-1">
                    Öffentlich sichtbar
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublic"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      disabled={!restaurant?.isActive}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      {restaurant?.isActive ? 'Wenn aktiviert, erscheint der Tisch öffentlich.' : 'Aktivieren Sie Ihr Restaurant, um Tische öffentlich sichtbar zu machen.'}
                    </span>
                  </div>
                </div>
            
            {/* Erfolgs- oder Fehlermeldung */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg"
              >
                <div className="flex items-center">
                  <FiCheckCircle className="mr-2" />
                  <p>{success}</p>
                </div>
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg"
              >
                <div className="flex items-center">
                  <FiAlertCircle className="mr-2" />
                  <p>{error}</p>
                </div>
              </motion.div>
            )}
            
            {/* Status-Banner */}
            {!restaurant?.isActive && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-lg"
              >
                <div className="flex items-start">
                  <FiAlertCircle className="text-amber-500 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-medium text-amber-800">Ihr Restaurant ist noch nicht aktiv</h3>
                    <p className="text-amber-700 mt-1">
                      {restaurant?.contractStatus === 'PENDING' && 
                        'Ihre Anfrage wird derzeit geprüft. Sie können bereits Contact-tables anlegen; diese sind öffentlich sichtbar, sobald Ihr Restaurant aktiviert wurde.'}
                      {restaurant?.contractStatus === 'APPROVED' && 
                        'Ihre Anfrage wurde genehmigt! Bitte schließen Sie die Zahlung und den Vertragsabschluss ab, um Ihr Restaurant zu aktivieren. Bis dahin angelegte Contact-tables bleiben nicht öffentlich sichtbar.'}
                      {restaurant?.contractStatus === 'REJECTED' && 
                        'Leider wurde Ihre Anfrage abgelehnt. Bitte kontaktieren Sie uns für weitere Informationen.'}
                    </p>
                    {restaurant?.contractStatus === 'APPROVED' && (
                      <>
                        <a 
                          href={`/restaurant/payment/${restaurant.id}`}
                          className="inline-block mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          Zahlung abschließen
                        </a>
                        <div className="mt-4 bg-white border border-amber-200 rounded-lg p-3">
                          <p className="text-sm text-amber-800 mb-2">AGB lesen und bestätigen, um den Vertrag zu aktivieren.</p>
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <a
                              href={`/agb#restaurants?restaurantId=${encodeURIComponent(restaurant.id)}&token=${encodeURIComponent(restaurant?.contractToken || '')}`}
                              className="text-amber-700 underline underline-offset-2"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              AGB für Restaurants öffnen
                            </a>
                            <label className="flex items-center gap-2 text-sm text-amber-900">
                              <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="h-4 w-4 border-amber-300 rounded"
                              />
                              Ich akzeptiere die AGB.
                            </label>
                            <button
                              type="button"
                              disabled={!termsAccepted || accepting || !restaurant?.contractToken}
                              onClick={async () => {
                                if (!restaurant?.contractToken) return;
                                setAccepting(true);
                                setError('');
                                setSuccess('');
                                try {
                                  const res = await fetch('/api/restaurant/accept-contract', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ restaurantId: restaurant.id, token: restaurant.contractToken })
                                  });
                                  if (!res.ok) {
                                    const err = await res.json().catch(() => ({}));
                                    throw new Error(err.message || 'Fehler beim Vertragsabschluss');
                                  }
                                  setSuccess('Vertrag erfolgreich akzeptiert. Restaurant wird aktiviert.');
                                  setTermsAccepted(false);
                                  setTimeout(() => { window.location.reload(); }, 1200);
                                } catch (e: any) {
                                  setError(e.message || 'Ein Fehler ist aufgetreten');
                                } finally {
                                  setAccepting(false);
                                }
                              }}
                              className={`px-3 py-2 rounded-md text-white text-sm font-medium ${termsAccepted && !accepting && restaurant.contractToken ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-300 cursor-not-allowed'}`}
                            >
                              {accepting ? 'Wird bestätigt…' : 'AGB akzeptieren'}
                            </button>
                          </div>
                          {!restaurant.contractToken && (
                            <p className="mt-2 text-xs text-amber-700">Kein Vertrags-Token gefunden. Bitte öffnen Sie den AGB-Link aus der E-Mail.</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Contact-tables Liste */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {tables.length === 0 ? (
                <div className="p-8 text-center">
                  <FiCalendar className="mx-auto text-gray-400 mb-3" size={48} />
                  <h3 className="text-lg font-medium text-gray-700 mb-1">Keine Contact-tables vorhanden</h3>
                  <p className="text-gray-500">
                    Erstellen Sie Ihren ersten Contact-table, um Menschen zusammenzubringen! Angelegte Tische werden öffentlich sichtbar, sobald Ihr Restaurant aktiviert ist.
                  </p>
                  <button
                    onClick={() => openModal()}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <FiPlus className="inline mr-2" />
                    Ersten Contact-table erstellen
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktivierung</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teilnehmer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tables.map((table) => (
                        <tr key={table.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{table.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{table.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiCalendar className="text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {table.paused && table.pauseStart && table.pauseEnd
                                  ? `Pausiert von ${formatDate(table.pauseStart)} bis ${formatDate(table.pauseEnd)}`
                                  : table.isIndefinite
                                  ? 'Aktiv (unbestimmte Zeit)'
                                  : '–'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiUsers className="text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {table.currentParticipants} / {table.maxParticipants}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              table.status === 'OPEN' 
                                ? 'bg-green-100 text-green-800' 
                                : table.status === 'FULL' 
                                ? 'bg-blue-100 text-blue-800' 
                                : table.status === 'PAST' 
                                ? 'bg-gray-100 text-gray-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {table.status === 'OPEN' && 'Offen'}
                              {table.status === 'FULL' && 'Ausgebucht'}
                              {table.status === 'CLOSED' && 'Geschlossen'}
                              {table.status === 'PAST' && 'Vergangen'}
                            </span>
                            {table.paused && (
                              <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pausiert
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openModal(table)}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                              title="Bearbeiten"
                            >
                              <FiEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(table.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Löschen"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Informationsbox */}
            <div className="mt-8 bg-blue-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Was sind Contact-tables?</h3>
              <p className="text-blue-700 mb-4">
                Contact-tables sind spezielle Tische in Ihrem Restaurant – für Menschen, die allein essen gehen, aber offen für Gesellschaft und Gespräche sind. Hier darf man sich dazusetzen, austauschen, gemeinsam lachen oder einfach einen netten Abend in angenehmer Runde verbringen.
              </p>
              <h4 className="font-medium text-blue-800 mb-1">So funktioniert's:</h4>
              <ol className="list-decimal pl-5 text-blue-700 space-y-1">
                <li>Sie erstellen einen Contact-table ohne Datum/Uhrzeit; er ist dauerhaft aktiv.</li>
                <li>Optional können Sie einen Pausenzeitraum (von/bis) definieren, danach wird der Tisch automatisch reaktiviert.</li>
                <li>Interessierte Nutzer können sich für diesen Tisch anmelden.</li>
                <li>Die Reservierung erfolgt direkt bei Ihnen telefonisch oder über Ihr bestehendes Reservierungssystem.</li>
              </ol>
            </div>
          </div>
        </main>
      </div>
      
              {/* Modal für das Erstellen/Bearbeiten von Contact-tables */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditing ? 'Contact-table bearbeiten' : 'Contact-table erstellen'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {/* Restaurantname */}
                <div>
                  <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurantname *
                  </label>
                  <input
                    type="text"
                    id="restaurantName"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Wird mit Supabase abgeglichen.</p>
                </div>
                
                {/* Beschreibung */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Beschreibung (optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Beschreiben Sie den Contact-table, z.B. Thema des Abends, besondere Angebote, etc.
                  </p>
                </div>
                
                {/* Hinweis: Dieser Contact-table ist auf unbestimmte Zeit aktiv */}
                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                  <p className="text-sm text-gray-700">
                    Dieser Contact-table ist ohne Datum/Uhrzeit auf unbestimmte Zeit aktiv.
                  </p>
                </div>
                
                {/* Maximale Teilnehmerzahl */}
                <div>
                  <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximale Teilnehmerzahl (optional)
                  </label>
                  <input
                    type="number"
                    id="maxParticipants"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    min="2"
                    max="20"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Optional. Standard ist 4. Empfohlen: 4-8 Personen für optimale Gesprächsdynamik
                  </p>
                </div>

                {/* Pause-Toggle */}
                <div>
                  <label htmlFor="paused" className="block text-sm font-medium text-gray-700 mb-1">
                    Pausieren (z.B. Betriebsferien)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="paused"
                      name="paused"
                      checked={formData.paused}
                      onChange={(e) => setFormData(prev => ({ ...prev, paused: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Wenn aktiviert, ist der Contact-table vorübergehend pausiert.</span>
                  </div>
                </div>

                {/* Pause-Zeitraum */}
                {formData.paused && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pauseStart" className="block text-sm font-medium text-gray-700 mb-1">
                        Pause von (Datum)
                      </label>
                      <input
                        type="date"
                        id="pauseStart"
                        name="pauseStart"
                        value={formData.pauseStart}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="pauseEnd" className="block text-sm font-medium text-gray-700 mb-1">
                        Pause bis (Datum)
                      </label>
                      <input
                        type="date"
                        id="pauseEnd"
                        name="pauseEnd"
                        value={formData.pauseEnd}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500">Nach diesem Datum wird der Tisch automatisch wieder aktiv.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {isEditing ? 'Speichern' : 'Erstellen'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}



export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createClient(context);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: '/auth/login?redirect=/restaurant/dashboard/tables',
        permanent: false,
      },
    };
  }

  // Nur Restaurant-Benutzer zulassen
  const userRole = user.user_metadata?.role;
  if (userRole !== 'RESTAURANT') {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  try {
    // Restaurant über Supabase laden
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('userId', user.id)
      .single();

    if (restaurantError || !restaurantData) {
      return {
        redirect: {
          destination: '/restaurant/register?message=Restaurant nicht gefunden.',
          permanent: false,
        },
      };
    }

    const restaurant: RestaurantData = {
      id: restaurantData.id,
      name: restaurantData.name,
      address: restaurantData.address || '',
      city: restaurantData.city || '',
      isActive: Boolean(restaurantData.is_active ?? restaurantData.isActive),
      contractStatus: restaurantData.contract_status || restaurantData.contractStatus || 'PENDING',
      contractToken: restaurantData.contract_token || restaurantData.contractToken || null,
    };

    // Contact-tables über Supabase laden
    const { data: tablesData, error: tablesError } = await supabase
      .from('contact_tables')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('datetime', { ascending: true });

    if (tablesError) {
      console.error('Supabase Fehler beim Laden der Contact-tables:', tablesError);
    }

    const tablesBase = Array.isArray(tablesData) ? tablesData : [];

    // Teilnehmerzahlen laden (Count) pro Tisch
    const contactTables: ContactTable[] = await Promise.all(
      tablesBase.map(async (table: any) => {
        let participantsCount = 0;
        try {
          const { count, error: countError } = await supabase
            .from('participations')
            .select('user_id', { count: 'exact', head: true })
            .eq('contact_table_id', table.id);
          if (!countError && typeof count === 'number') {
            participantsCount = count;
          }
        } catch (e) {
          // still proceed
        }

        const pauseStart = table.pause_start || table.pauseStart || null;
        const pauseEnd = table.pause_end || table.pauseEnd || null;

        return {
          id: table.id,
          title: table.title,
          description: table.description || '',
          maxParticipants: table.max_participants ?? table.maxParticipants ?? 4,
          currentParticipants: participantsCount,
          status: table.status || 'OPEN',
          paused: Boolean(table.paused),
          isIndefinite: Boolean(table.is_indefinite ?? table.isIndefinite ?? !table.datetime),
          pauseStart: pauseStart ? String(pauseStart).split('T')[0] : null,
          pauseEnd: pauseEnd ? String(pauseEnd).split('T')[0] : null,
        } as ContactTable;
      })
    );

    return {
      props: {
        restaurant,
        contactTables,
      },
    };
  } catch (error) {
    console.error('Error fetching restaurant tables data (Supabase):', error);
    return {
      props: {
        restaurant: null,
        contactTables: [],
        error: 'Fehler beim Laden der Daten.',
      },
    };
  }
};
