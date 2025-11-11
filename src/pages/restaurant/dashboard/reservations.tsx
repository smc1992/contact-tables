import { useState, useEffect, useMemo } from 'react';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { createClient } from '@/utils/supabase/server';
import { withAuth } from '@/utils/withAuth';
import { createBrowserClient } from '@supabase/ssr';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RestaurantSidebar from '@/components/restaurant/RestaurantSidebar';
import { type Database } from '@/types/supabase';
import { FiCheck, FiX, FiEdit, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useNotification } from '@/contexts/NotificationContext';
import { motion } from 'framer-motion';

type Reservation = Database['public']['Tables']['contact_tables']['Row'] & {
  participations?: {
    user_id: string;
    user_email?: string;
    user_name?: string;
    status: string;
  }[];
  current_participants?: number;
};

type ParticipationWithProfile = {
  user_id: string;
  status: string;
  profiles: {
    email: string;
    first_name: string;
    last_name: string;
  };
};

// Leichtgewichtiger Typ für die Teilnehmerabfrage im Dashboard
type ParticipationRowLite = {
  user_id: string;
  contact_table_id?: string;
  event_id?: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
  status?: string;
};

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

interface ReservationsPageProps {
  restaurant: Restaurant;
  initialReservations: Reservation[];
  totalCount?: number;
  totalPages?: number;
  error?: string;
}

type ReservationStatus = 'OPEN' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

const ReservationsPage = ({ restaurant, initialReservations, totalCount: initialTotalCount = 0, totalPages: initialTotalPages = 1, error }: ReservationsPageProps) => {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [loading, setLoading] = useState(false);
  const { addNotification, handleError } = useNotification();
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [addingParticipantToTable, setAddingParticipantToTable] = useState<string | null>(null);
  const [participantEmail, setParticipantEmail] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [conflictingReservations, setConflictingReservations] = useState<any[]>([]);
  const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);
  const [hasStatusColumn, setHasStatusColumn] = useState<boolean>(true);
  const [participationIdColumn, setParticipationIdColumn] = useState<'contact_table_id' | 'event_id'>('contact_table_id');
  
  // Paginierungsvariablen
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  
  // Wenn ein Fehler vom Server zurückgegeben wurde, diesen anzeigen
  useEffect(() => {
    if (error) {
      addNotification('error', error, 8000);
    }
  }, [error]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    maxParticipants: 0,
    status: 'OPEN' as ReservationStatus
  });
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Prüfen, ob die Spalte 'status' in participations existiert
  const checkParticipationStatusColumn = async () => {
    try {
      const { error } = await supabase
        .from('participations')
        .select('status', { head: true, count: 'exact' })
        .limit(1);
      setHasStatusColumn(!error);
    } catch {
      setHasStatusColumn(false);
    }
  };

  // Prüfen, welche ID-Spalte in participations existiert (contact_table_id vs event_id)
  const resolveParticipationIdColumn = async () => {
    try {
      const contactIdProbe = await supabase
        .from('participations')
        .select('contact_table_id', { head: true })
        .limit(1);
      if (!contactIdProbe.error) {
        setParticipationIdColumn('contact_table_id');
        return;
      }
      const eventIdProbe = await supabase
        .from('participations')
        .select('event_id', { head: true })
        .limit(1);
      if (!eventIdProbe.error) {
        setParticipationIdColumn('event_id');
        return;
      }
      // Fallback: wir lassen 'contact_table_id' stehen, aber loggen
      console.warn('Keine passende ID-Spalte in participations gefunden. Erwartet contact_table_id oder event_id.');
    } catch (e) {
      console.warn('Fehler beim Prüfen der ID-Spalte in participations:', e);
    }
  };
  
  useEffect(() => {
    if (editingReservation) {
      const date = editingReservation.datetime ? new Date(editingReservation.datetime) : new Date();
      setFormData({
        title: editingReservation.title || '',
        description: editingReservation.description || '',
        date: date.toISOString().split('T')[0],
        time: date.toTimeString().slice(0, 5),
        maxParticipants: editingReservation.max_participants || 0,
        status: editingReservation.status as ReservationStatus
      });
      setShowModal(true);
    }
  }, [editingReservation]);
  
  useEffect(() => {
    checkParticipationStatusColumn();
    resolveParticipationIdColumn();
  }, []);
  
  const loadReservationsWithParticipants = async () => {
    const page = currentPage;
    const perPage = itemsPerPage;
    setLoading(true);
    
    // Maximale Anzahl von Wiederholungsversuchen
    const maxRetries = 2;
    let retryCount = 0;
    let success = false;
    
    while (retryCount <= maxRetries && !success) {
      try {
        // Gesamtanzahl der Reservierungen für Paginierung ermitteln
        const { count, error: countError } = await supabase
          .from('contact_tables')
          .select('id', { count: 'exact' })
          .eq('restaurant_id', restaurant.id);
        
        if (countError) throw countError;
        
        // Berechnung der Gesamtseitenzahl
        const total = count || 0;
        const calculatedTotalPages = Math.ceil(total / perPage);
        setTotalCount(total);
        setTotalPages(calculatedTotalPages || 1);
        
        // Berechnung des Offsets für die Paginierung
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;
        
        // 1. Reservierungen mit Paginierung laden
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('contact_tables')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('datetime', { ascending: false })
          .range(from, to);
          
        if (reservationsError) throw reservationsError;
        
        if (!reservationsData || reservationsData.length === 0) {
          setReservations([]);
          success = true;
          continue;
        }
        
        // 2. Alle Reservierungs-IDs sammeln
        const tableIds = reservationsData.map(res => res.id);
        
        // 3. Alle Teilnehmer in einer einzigen Batch-Anfrage laden
        const idCol = participationIdColumn;
        const selectColumns = hasStatusColumn
          ? `user_id, ${idCol}, status, profiles!inner(first_name, last_name)`
          : `user_id, ${idCol}, profiles!inner(first_name, last_name)`;
        const { data: allParticipations, error: participationsError } = await supabase
          .from('participations')
          .select(selectColumns as any)
          .in(idCol, tableIds);
        
        if (participationsError) {
          // Spezifische Fehlerbehandlung für Teilnehmerabfrage
          if (retryCount < maxRetries) {
            retryCount++;
            // Kurze Verzögerung vor dem nächsten Versuch
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw new Error(`Fehler beim Laden der Teilnehmer: ${participationsError.message}`);
        }
        
        // 4. Teilnehmer nach Tisch-ID gruppieren
        const participationRows: ParticipationRowLite[] = (allParticipations ?? []) as any;
        const participationsByTableId = participationRows.reduce((acc, p) => {
          const tableId = (participationIdColumn === 'contact_table_id' ? p.contact_table_id : p.event_id) as string;
          if (!acc[tableId]) acc[tableId] = [];
          acc[tableId].push({
            user_id: p.user_id,
            [participationIdColumn]: tableId,
            profiles: p.profiles,
            status: p.status ?? 'CONFIRMED'
          });
          return acc;
        }, {} as Record<string, ParticipationRowLite[]>);
        
        // 5. Reservierungen mit Teilnehmern zusammenführen
        const reservationsWithParticipants = reservations.map(reservation => {
          return {
            ...reservation,
            participants: participationsByTableId[reservation.id] || []
          };
        });
        
        setReservations(reservationsWithParticipants);
        success = true;
      } catch (err: any) {
        retryCount++;
        console.error(`Fehler beim Laden der Reservierungen (Versuch ${retryCount}/${maxRetries}):`, err);
        
        if (retryCount < maxRetries) {
          // Kurze Verzögerung vor dem nächsten Versuch
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // Nach allen Wiederholungsversuchen den Fehler anzeigen
          console.error('Fehler beim Laden der Reservierungen:', err);
          handleError(err, `Fehler beim Laden der Reservierungen. Bitte versuchen Sie es später erneut.`);
          success = true; // Beende die Schleife
        }
      }
    }

    setLoading(false);
  };
  useEffect(() => {
    loadReservationsWithParticipants();
  }, [currentPage, itemsPerPage, restaurant.id]);
  
  // Da wir jetzt serverseitig paginieren, verwenden wir direkt die geladenen Reservierungen
  const paginatedReservations = useMemo(() => reservations, [reservations]);
  
  // Seitenwechsel-Funktionen
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Hilfsfunktion zum Senden von Benachrichtigungen an Teilnehmer
  const sendNotificationsToParticipants = async (reservationId: string, newStatus: ReservationStatus) => {
    try {
      // 1. Teilnehmer für diese Reservierung abrufen
      const idCol = participationIdColumn;
      const { data: participants, error: participantsError } = await supabase
        .from('participations')
        .select(`user_id, ${idCol}, profiles!inner(first_name, last_name)`)
        .eq(idCol, reservationId);
      
      if (participantsError) throw participantsError;
      
      if (!participants || participants.length === 0) return;
      
      // 2. Reservierungsdetails abrufen für die Benachrichtigung
      const { data: reservation, error: reservationError } = await supabase
        .from('contact_tables')
        .select('title, datetime')
        .eq('id', reservationId)
        .single();
      
      if (reservationError) throw reservationError;
      
      // 3. Benachrichtigungen in der Datenbank speichern
      // In einer realen Implementierung würde hier ein E-Mail-Service oder Push-Benachrichtigungssystem angebunden
      const participantsList = (participants ?? []) as { user_id: string; profiles: { first_name: string; last_name: string } }[];
      const notifications = participantsList.map((participant) => ({
        user_id: participant.user_id,
        title: `Reservierungsstatus geändert: ${reservation.title}`,
        message: `Der Status Ihrer Reservierung für ${reservation.title} am ${new Date(reservation.datetime).toLocaleDateString('de-DE')} wurde auf ${getStatusText(newStatus)} geändert.`,
        type: 'RESERVATION_UPDATE',
        read: false,
        created_at: new Date().toISOString()
      }));
      
      // Benachrichtigungen in der Datenbank speichern
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);
      
      if (notificationError) throw notificationError;
      
      return true;
    } catch (error) {
      console.error('Fehler beim Senden von Benachrichtigungen:', error);
      // Fehler beim Senden von Benachrichtigungen sollten nicht den Hauptprozess blockieren
      return false;
    }
  };

  const handleStatusChange = async (reservationId: string, newStatus: ReservationStatus) => {
    setLoading(true);
    
    try {
      const { error: updateError } = await supabase
        .from('contact_tables')
        .update({ status: newStatus })
        .eq('id', reservationId)
        .eq('restaurant_id', restaurant.id);
        
      if (updateError) throw updateError;
      
      // Optimistische UI-Aktualisierung mit korrekter Typisierung
      setReservations(prev => 
        prev.map(res => {
          if (res.id === reservationId) {
            return { ...res, status: newStatus as Database["public"]["Enums"]["EventStatus"] };
          }
          return res;
        })
      );
      
      // Benachrichtigungen an Teilnehmer senden
      const notificationSent = await sendNotificationsToParticipants(reservationId, newStatus);
      
      addNotification('success', `Status erfolgreich auf ${getStatusText(newStatus)} geändert. ${
        notificationSent ? 'Teilnehmer wurden benachrichtigt.' : ''
      }`, 5000);
      
    } catch (err: any) {
      console.error('Fehler bei Statusänderung:', err);
      handleError(err, 'Fehler beim Ändern des Status. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };
  
  const validateFormData = () => {
    const errors: Record<string, string> = {};
    
    // Titel validieren
    if (!formData.title.trim()) {
      errors.title = 'Titel ist erforderlich';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Titel muss mindestens 3 Zeichen lang sein';
    } else if (formData.title.trim().length > 100) {
      errors.title = 'Titel darf maximal 100 Zeichen lang sein';
    }
    
    // Datum validieren
    if (!formData.date) {
      errors.date = 'Datum ist erforderlich';
    } else {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.date);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (isNaN(selectedDate.getTime())) {
        errors.date = 'Ungültiges Datumsformat';
      } else if (selectedDate < currentDate) {
        errors.date = 'Datum kann nicht in der Vergangenheit liegen';
      }
    }
    
    // Zeit validieren
    if (!formData.time) {
      errors.time = 'Uhrzeit ist erforderlich';
    } else if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(formData.time)) {
      errors.time = 'Ungültiges Uhrzeitformat (HH:MM)';
    } else {
      // Prüfen, ob Datum und Zeit in der Vergangenheit liegen
      const dateTimeString = `${formData.date}T${formData.time}:00`;
      const eventDateTime = new Date(dateTimeString);
      const now = new Date();
      
      if (eventDateTime < now) {
        errors.time = 'Datum und Uhrzeit können nicht in der Vergangenheit liegen';
      }
    }
    
    // Maximale Teilnehmer validieren
    if (formData.maxParticipants <= 0) {
      errors.maxParticipants = 'Anzahl der Teilnehmer muss größer als 0 sein';
    } else if (formData.maxParticipants > 100) {
      errors.maxParticipants = 'Maximale Teilnehmerzahl ist 100';
    }
    
    return errors;
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReservation) return;
    
    // Formular validieren
    const validationErrors = validateFormData();
    if (Object.keys(validationErrors).length > 0) {
      // Zeige Validierungsfehler an
      const errorMessages = Object.values(validationErrors).join('\n');
      addNotification('error', errorMessages, 8000);
      return;
    }
    
    setLoading(true);
    
    try {
      const dateTimeString = `${formData.date}T${formData.time}:00`;
      const eventDateTime = new Date(dateTimeString);
      
      // Überprüfen, ob bereits eine andere Reservierung zur gleichen Zeit existiert
      const { data: existingReservations, error: checkError } = await supabase
        .from('contact_tables')
        .select('id, title, datetime')
        .eq('restaurant_id', restaurant.id)
        .neq('id', editingReservation.id) // Aktuelle Reservierung ausschließen
        .gte('datetime', new Date(eventDateTime.getTime() - 30 * 60000).toISOString()) // 30 Minuten vor
        .lte('datetime', new Date(eventDateTime.getTime() + 30 * 60000).toISOString()); // 30 Minuten nach
      
      if (checkError) throw checkError;
      
      if (existingReservations && existingReservations.length > 0) {
        // Speichern der Update-Daten für späteren Gebrauch
        const updateData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          datetime: eventDateTime.toISOString(),
          max_participants: formData.maxParticipants,
          status: formData.status
        };
        
        setPendingUpdateData(updateData);
        setConflictingReservations(existingReservations);
        setShowConfirmDialog(true);
        setLoading(false);
        return; // Beenden der Funktion, bis der Benutzer bestätigt
      }
      
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        datetime: eventDateTime.toISOString(),
        max_participants: formData.maxParticipants,
        status: formData.status
      };
      
      const { error: updateError } = await supabase
        .from('contact_tables')
        .update(updateData)
        .eq('id', editingReservation.id)
        .eq('restaurant_id', restaurant.id);
        
      if (updateError) throw updateError;
      
      // Aktualisierte Daten neu laden
      await loadReservationsWithParticipants();
      
      addNotification('success', 'Reservierung erfolgreich aktualisiert', 5000);
      setShowModal(false);
      setEditingReservation(null);
      
    } catch (err: any) {
      handleError(err, 'Fehler beim Aktualisieren der Reservierung');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Funktion zum Ändern des Status eines Teilnehmers
  const handleParticipantStatusChange = async (tableId: string, userId: string, newStatus: string) => {
    setLoading(true);
    
    try {
      if (!hasStatusColumn) {
        throw new Error('Teilnehmerstatus kann nicht geändert werden: Spalte "status" fehlt in der Tabelle participations.');
      }
      const idCol = participationIdColumn;
      const { error: updateError } = await supabase
        .from('participations')
        .update({ status: newStatus })
        .eq(idCol, tableId)
        .eq('user_id', userId);
        
      if (updateError) throw updateError;
      
      // Optimistische UI-Aktualisierung
      setReservations(prev => 
        prev.map(res => {
          if (res.id === tableId) {
            return {
              ...res,
              participations: res.participations?.map(p => 
                p.user_id === userId ? { ...p, status: newStatus } : p
              )
            };
          }
          return res;
        })
      );
      
      addNotification('success', `Teilnehmerstatus erfolgreich auf ${newStatus} geändert`, 5000);
      
    } catch (err: any) {
      console.error('Fehler beim Ändern des Teilnehmerstatus:', err);
      handleError(err, 'Fehler beim Ändern des Teilnehmerstatus');
    } finally {
      setLoading(false);
    }
  };
  
  // Funktion zum Entfernen eines Teilnehmers
  const handleRemoveParticipant = async (tableId: string, userId: string) => {
    if (!confirm('Möchten Sie diesen Teilnehmer wirklich entfernen?')) return;
    
    setLoading(true);
    
    try {
      const idCol = participationIdColumn;
      const { error: deleteError } = await supabase
        .from('participations')
        .delete()
        .eq(idCol, tableId)
        .eq('user_id', userId);
        
      if (deleteError) throw deleteError;
      
      // Optimistische UI-Aktualisierung
      setReservations(prev => 
        prev.map(res => {
          if (res.id === tableId) {
            const updatedParticipations = res.participations?.filter(p => p.user_id !== userId) || [];
            return {
              ...res,
              participations: updatedParticipations,
              current_participants: updatedParticipations.length
            };
          }
          return res;
        })
      );
      
      addNotification('success', 'Teilnehmer erfolgreich entfernt', 5000);
      
    } catch (err: any) {
      console.error('Fehler beim Entfernen des Teilnehmers:', err);
      handleError(err, 'Fehler beim Entfernen des Teilnehmers');
    } finally {
      setLoading(false);
    }
  };
  
  // Funktion zum Hinzufügen eines Teilnehmers
  const handleAddParticipant = async (tableId: string) => {
    if (!participantEmail) {
      addNotification('error', 'Bitte geben Sie eine E-Mail-Adresse ein', 5000);
      return;
    }
    
    setLoading(true);
    
    try {
      // API-Aufruf zum Hinzufügen des Teilnehmers
      const response = await fetch(`/api/contact-tables/${tableId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_email: participantEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Hinzufügen des Teilnehmers');
      }
      
      // Nach erfolgreichem Hinzufügen die Daten neu laden
      await loadReservationsWithParticipants();
      
      addNotification('success', 'Teilnehmer erfolgreich hinzugefügt', 5000);
      setParticipantEmail('');
      setAddingParticipantToTable(null);
      
    } catch (err: any) {
      console.error('Fehler beim Hinzufügen des Teilnehmers:', err);
      handleError(err, 'Fehler beim Hinzufügen des Teilnehmers');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Offen';
      case 'CONFIRMED': return 'Bestätigt';
      case 'CANCELLED': return 'Abgesagt';
      case 'COMPLETED': return 'Abgeschlossen';
      default: return status;
    }
  };

  // Funktion zum Bestätigen der Reservierung trotz Konflikten
  const confirmReservationUpdate = async () => {
    if (!editingReservation || !pendingUpdateData) return;
    
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('contact_tables')
        .update(pendingUpdateData)
        .eq('id', editingReservation.id)
        .eq('restaurant_id', restaurant.id);
        
      if (updateError) throw updateError;
      
      // Aktualisierte Daten neu laden
      await loadReservationsWithParticipants();
      
      addNotification('success', 'Reservierung erfolgreich aktualisiert', 5000);
      setShowModal(false);
      setEditingReservation(null);
      setShowConfirmDialog(false);
      setPendingUpdateData(null);
      setConflictingReservations([]);
      
    } catch (err: any) {
      handleError(err, 'Fehler beim Aktualisieren der Reservierung');
    } finally {
      setLoading(false);
    }
  };
  
  // Funktion zum Abbrechen der Reservierung bei Konflikten
  const cancelReservationUpdate = () => {
    setShowConfirmDialog(false);
    setPendingUpdateData(null);
    setConflictingReservations([]);
    addNotification('info', 'Reservierungsänderung abgebrochen', 5000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 pt-16">
        <RestaurantSidebar activeItem="reservations" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Ihre Reservierungen</h1>
              <button 
                onClick={() => loadReservationsWithParticipants()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                disabled={loading}
              >
                Aktualisieren
              </button>
            </div>
            
            {/* Benachrichtigungen werden jetzt über den NotificationContext angezeigt */}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            )}

            {!loading && reservations.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <FiInfo className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500 text-lg font-medium">Sie haben noch keine Reservierungen.</p>
        <p className="text-gray-400 mt-2">Erstellen Sie Contact-tables, damit Kunden Reservierungen vornehmen können.</p>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Bearbeitungs-Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reservierung bearbeiten</h2>
              
              <form onSubmit={handleSaveEdit}>
                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Uhrzeit</label>
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">Max. Teilnehmer</label>
                    <input
                      type="number"
                      id="maxParticipants"
                      name="maxParticipants"
                      value={formData.maxParticipants}
                      onChange={handleInputChange}
                      min="2"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="OPEN">Offen</option>
                      <option value="CONFIRMED">Bestätigt</option>
                      <option value="CANCELLED">Abgesagt</option>
                      <option value="COMPLETED">Abgeschlossen</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingReservation(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Wird gespeichert...' : 'Speichern'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal zum Hinzufügen von Teilnehmern */}
      {addingParticipantToTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Teilnehmer hinzufügen</h3>
            
            <div className="mb-4">
              <label htmlFor="participantEmail" className="block text-sm font-medium text-gray-700 mb-1">E-Mail des Teilnehmers</label>
              <input
                type="email"
                id="participantEmail"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="teilnehmer@beispiel.de"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setAddingParticipantToTable(null);
                  setParticipantEmail('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              
              <button
                type="button"
                onClick={() => handleAddParticipant(addingParticipantToTable)}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                disabled={loading || !participantEmail}
              >
                {loading ? 'Wird hinzugefügt...' : 'Hinzufügen'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bestätigungsdialog für überlappende Reservierungen */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-red-600">Zeitkonflikt erkannt</h3>
            <p className="mb-4">Es existieren bereits folgende Reservierungen im gewählten Zeitfenster:</p>
            
            <ul className="mb-4 bg-gray-100 p-3 rounded max-h-40 overflow-y-auto">
              {conflictingReservations.map((res) => (
                <li key={res.id} className="mb-2 pb-2 border-b border-gray-300 last:border-0">
                  <strong>{res.title}</strong> - {new Date(res.datetime).toLocaleString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </li>
              ))}
            </ul>
            
            <p className="mb-6">Möchten Sie die Reservierung trotzdem speichern?</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelReservationUpdate}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded transition-colors"
                disabled={loading}
              >
                Abbrechen
              </button>
              <button
                onClick={confirmReservationUpdate}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                disabled={loading}
              >
                Trotzdem speichern
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default ReservationsPage;

export const getServerSideProps: GetServerSideProps = withAuth('RESTAURANT', async (context, user) => {
    const supabase = createClient(context);

  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('userId', user.id)
    .single();

  if (restaurantError || !restaurant) {
    console.error(`Redirecting: No restaurant found for user ${user.id}`, restaurantError);
    return {
      redirect: {
        destination: '/restaurant/registration?error=noprofile',
        permanent: false,
      },
    };
  }
  
  // Initialen Satz von Reservierungen laden (erste Seite)
  const initialPerPage = 10; // Standard: 10 Einträge pro Seite
  
  // Gesamtanzahl der Reservierungen für Paginierung ermitteln
  const { count, error: countError } = await supabase
    .from('contact_tables')
    .select('id', { count: 'exact' })
    .eq('restaurant_id', restaurant.id);
    
  // Erste Seite der Reservierungen laden
  const { data: initialReservations, error: reservationsError } = await supabase
    .from('contact_tables')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('datetime', { ascending: false })
    .range(0, initialPerPage - 1);

  if (reservationsError || countError) {
    console.error('Error fetching reservations on page:', reservationsError?.message || countError?.message);
    // On error, return the page with an empty array of reservations
    // This prevents a crash and allows the page to render.
    return {
      props: {
        restaurant,
        initialReservations: [],
        totalCount: 0,
        error: `Fehler beim Laden der Reservierungen: ${reservationsError?.message || countError?.message}`,
      },
    };
  }
  
  // Berechnung der Gesamtseitenzahl
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / initialPerPage) || 1;

    return {
    props: {
      restaurant,
      initialReservations: initialReservations || [],
      totalCount: totalCount,
      totalPages: totalPages
    },
  };
});
