import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { createClient } from '../../../utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import { motion } from 'framer-motion';
import { FiPlus, FiCalendar, FiClock, FiUsers, FiEdit, FiTrash2, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import RestaurantSidebar from '../../../components/restaurant/RestaurantSidebar';

interface ContactTable {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime?: string;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
  paused?: boolean;
}

interface RestaurantData {
  id: string;
  name: string;
  address: string;
  city: string;
  isActive: boolean;
  contractStatus: string;
}

interface TablesPageProps {
  restaurant: RestaurantData;
  contactTables: ContactTable[];
}

export default function RestaurantTables({ restaurant, contactTables = [] }: TablesPageProps) {
  const [tables, setTables] = useState<ContactTable[]>(contactTables);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTableId, setCurrentTableId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    maxParticipants: 4,
    isPublic: !!restaurant?.isActive,
    paused: false
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxParticipants' ? parseInt(value) || 4 : value
    }));
  };
  
  const openModal = (table?: ContactTable) => {
    if (table) {
      // Bearbeiten-Modus
      setIsEditing(true);
      setCurrentTableId(table.id);
      setFormData({
        title: table.title,
        description: table.description,
        date: table.date,
        time: table.time,
        endTime: table.endTime || '',
        maxParticipants: table.maxParticipants,
        isPublic: !!restaurant?.isActive,
        paused: !!table.paused
      });
    } else {
      // Neu-Modus
      setIsEditing(false);
      setCurrentTableId(null);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        endTime: '',
        maxParticipants: 4,
        isPublic: !!restaurant?.isActive,
        paused: false
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
      if (!formData.title || !formData.description || !formData.date || !formData.time) {
        throw new Error('Bitte füllen Sie alle erforderlichen Felder aus');
      }
      
      if (formData.maxParticipants < 2) {
        throw new Error('Ein Contact table muss mindestens 2 Teilnehmer haben');
      }

      if (formData.endTime) {
        const start = new Date(`${formData.date}T${formData.time}:00`);
        const end = new Date(`${formData.date}T${formData.endTime}:00`);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('Ungültiges Datums- oder Zeitformat');
        }
        if (end <= start) {
          throw new Error('Endzeit muss nach der Startzeit liegen');
        }
      }
      
      // API-Aufruf zum Erstellen oder Aktualisieren des Contact Tables
      const url = isEditing 
        ? '/api/restaurant/update-contact-table' 
        : '/api/contact-tables';

      // Payload je nach Endpunkt korrekt benennen
      const dataToSend = isEditing 
        ? {
            tableId: currentTableId,
            restaurantId: restaurant.id,
            title: formData.title,
            description: formData.description,
            date: formData.date,
            time: formData.time,
            endDate: formData.endTime ? formData.date : undefined,
            endTime: formData.endTime || undefined,
            maxParticipants: formData.maxParticipants,
            paused: formData.paused,
          }
        : {
            title: formData.title,
            description: formData.description,
            datetime: `${formData.date}T${formData.time}:00`,
            end_datetime: formData.endTime ? `${formData.date}T${formData.endTime}:00` : null,
            max_participants: formData.maxParticipants,
            price: 0,
            restaurant_id: restaurant.id,
            is_public: restaurant.isActive ? formData.isPublic : false,
            paused: formData.paused
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
        throw new Error(errorData.message || 'Fehler beim Speichern des Contact table');
      }
      
      const resp = await response.json();

      // Response je nach Endpoint formen
      const payload = isEditing ? resp.contactTable : resp.data;
      const hasDateTime = payload && payload.datetime;
      const hasEndDateTime = payload && payload.end_datetime;
      const newTableData = {
        ...payload,
        date: hasDateTime
          ? new Date(payload.datetime).toISOString().split('T')[0]
          : payload.date,
        time: hasDateTime
          ? new Date(payload.datetime).toTimeString().split(' ')[0].substring(0, 5)
          : payload.time,
        endTime: hasEndDateTime
          ? new Date(payload.end_datetime).toTimeString().split(' ')[0].substring(0, 5)
          : payload.endTime,
        currentParticipants: payload?.currentParticipants ?? 0,
        maxParticipants: payload?.maxParticipants ?? formData.maxParticipants,
        status: payload?.status ?? 'OPEN',
        paused: !!payload?.paused
      };

      if (isEditing) {
        // Aktualisiere den bestehenden Tisch in der lokalen Liste
        setTables(prev => prev.map(table => 
          table.id === currentTableId ? newTableData : table
        ));
        setSuccess('Contact table erfolgreich aktualisiert');
      } else {
        // Füge den neuen Tisch zur lokalen Liste hinzu
        setTables(prev => [...prev, newTableData]);
        setSuccess('Contact table erfolgreich erstellt');
      }
      
      // Schließe das Modal
      closeModal();
    } catch (error: any) {
      console.error('Fehler beim Speichern des Contact Tables:', error);
      setError(error.message || 'Ein unerwarteter Fehler ist aufgetreten');
    }
  };
  
  const handleDelete = async (tableId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Contact table löschen möchten?')) {
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
        throw new Error(errorData.message || 'Fehler beim Löschen des Contact table');
      }
      
      // Entferne den Tisch aus der lokalen Liste
      setTables(prev => prev.filter(table => table.id !== tableId));
      setSuccess('Contact table erfolgreich gelöscht');
    } catch (error: any) {
      console.error('Fehler beim Löschen des Contact Tables:', error);
      setError(error.message || 'Ein unerwarteter Fehler ist aufgetreten');
    }
  };
  
  // Hilfsfunktion zum Formatieren des Datums
  const formatDate = (dateString: string) => {
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
                <h1 className="text-3xl font-bold text-gray-800">Contact Tables</h1>
                <p className="text-gray-600 mt-2">
                  Erstellen und verwalten Sie Contact Tables für Ihr Restaurant.
                </p>
              </div>
              
              <button
                onClick={() => openModal()}
                className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FiPlus className="mr-2" />
                Neuen Contact table erstellen
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
                      disabled={!restaurant.isActive}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      {restaurant.isActive ? 'Wenn aktiviert, erscheint der Tisch öffentlich.' : 'Aktivieren Sie Ihr Restaurant, um Tische öffentlich sichtbar zu machen.'}
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
            {!restaurant.isActive && (
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
                      {restaurant.contractStatus === 'PENDING' && 
                        'Ihre Anfrage wird derzeit geprüft. Sie können bereits Contact tables anlegen; diese sind öffentlich sichtbar, sobald Ihr Restaurant aktiviert wurde.'}
                      {restaurant.contractStatus === 'APPROVED' && 
                        'Ihre Anfrage wurde genehmigt! Bitte schließen Sie die Zahlung und den Vertragsabschluss ab, um Ihr Restaurant zu aktivieren. Bis dahin angelegte Contact tables bleiben nicht öffentlich sichtbar.'}
                      {restaurant.contractStatus === 'REJECTED' && 
                        'Leider wurde Ihre Anfrage abgelehnt. Bitte kontaktieren Sie uns für weitere Informationen.'}
                    </p>
                    {restaurant.contractStatus === 'APPROVED' && (
                      <a 
                        href={`/restaurant/payment/${restaurant.id}`}
                        className="inline-block mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                      >
                        Zahlung abschließen
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Contact Tables Liste */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {tables.length === 0 ? (
                <div className="p-8 text-center">
                  <FiCalendar className="mx-auto text-gray-400 mb-3" size={48} />
                  <h3 className="text-lg font-medium text-gray-700 mb-1">Keine Contact Tables vorhanden</h3>
                  <p className="text-gray-500">
                    Erstellen Sie Ihren ersten Contact table, um Menschen zusammenzubringen! Angelegte Tische werden öffentlich sichtbar, sobald Ihr Restaurant aktiviert ist.
                  </p>
                  <button
                    onClick={() => openModal()}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <FiPlus className="inline mr-2" />
                    Ersten Contact table erstellen
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum & Uhrzeit</th>
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
                              <span className="text-sm text-gray-900">{formatDate(table.date)}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <FiClock className="text-gray-400 mr-2" />
                              <span className="text-sm text-gray-500">
                                {table.time} Uhr{table.endTime ? ` – ${table.endTime} Uhr` : ''}
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
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Was sind contact-tables?</h3>
              <p className="text-blue-700 mb-4">
                Contact-tables sind spezielle Tische in Ihrem Restaurant – für Menschen, die allein essen gehen, aber offen für Gesellschaft und Gespräche sind. Hier darf man sich dazusetzen, austauschen, gemeinsam lachen oder einfach einen netten Abend in angenehmer Runde verbringen.
              </p>
              <h4 className="font-medium text-blue-800 mb-1">So funktioniert's:</h4>
              <ol className="list-decimal pl-5 text-blue-700 space-y-1">
                <li>Sie erstellen einen Contact table mit Datum, Uhrzeit und maximaler Teilnehmerzahl.</li>
                <li>Interessierte Nutzer können sich für diesen Tisch anmelden.</li>
                <li>Die Reservierung erfolgt direkt bei Ihnen telefonisch oder über Ihr bestehendes Reservierungssystem.</li>
                <li>Die Teilnehmer treffen sich zum angegebenen Zeitpunkt in Ihrem Restaurant.</li>
              </ol>
            </div>
          </div>
        </main>
      </div>
      
      {/* Modal für das Erstellen/Bearbeiten von Contact Tables */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditing ? 'Contact table bearbeiten' : 'Neuen Contact table erstellen'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {/* Titel */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Titel *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                {/* Beschreibung */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Beschreibung *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Beschreiben Sie den Contact table, z.B. Thema des Abends, besondere Angebote, etc.
                  </p>
                </div>
                
                {/* Datum */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Datum *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                {/* Uhrzeit */}
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                    Uhrzeit *
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Endzeit */}
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Endzeit (optional)
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">Legen Sie fest, bis wann der Contact table gilt.</p>
                </div>
                
                {/* Maximale Teilnehmerzahl */}
                <div>
                  <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximale Teilnehmerzahl *
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
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Empfohlen: 4-8 Personen für optimale Gesprächsdynamik
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
                    <span className="ml-2 text-sm text-gray-600">Wenn aktiviert, ist der Contact table vorübergehend pausiert.</span>
                  </div>
                </div>
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

  if (!user || user.user_metadata.role !== 'RESTAURANT') {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  const prisma = new PrismaClient();

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        isActive: true,
        contractStatus: true,
      },
    });

    if (!restaurant) {
      return {
        redirect: {
          destination: '/restaurant/register?message=Restaurant nicht gefunden.',
          permanent: false,
        },
      };
    }

    const tablesFromDb = await prisma.event.findMany({
      where: {
        restaurantId: restaurant.id,
      },
      include: {
        _count: {
          select: { participants: true },
        },
      },
      orderBy: {
        datetime: 'asc',
      },
    });

    // Serialize and transform data for the client component
    const contactTables: ContactTable[] = tablesFromDb.map(table => {
      const dt = new Date(table.datetime);
      const edt = table.endDatetime ? new Date(table.endDatetime) : null;
      return {
        id: table.id,
        title: table.title,
        description: table.description || '',
        date: dt.toISOString().split('T')[0], // Format: YYYY-MM-DD
        time: dt.toTimeString().split(' ')[0].substring(0, 5), // Format: HH:MM
        endTime: edt ? edt.toTimeString().split(' ')[0].substring(0, 5) : undefined,
        maxParticipants: table.maxParticipants,
        currentParticipants: table._count.participants,
        status: table.status,
        paused: table.paused,
      };
    });

    return {
      props: {
        restaurant,
        contactTables,
      },
    };
  } catch (error) {
    console.error('Error fetching restaurant tables data:', error);
    // Return empty props or handle error appropriately
    return {
      props: {
        restaurant: null,
        contactTables: [],
        error: 'Fehler beim Laden der Daten.',
      },
    };
  } finally {
    await prisma.$disconnect();
  }
};
