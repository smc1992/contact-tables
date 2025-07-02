import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { motion } from 'framer-motion';
import { FiCalendar, FiUsers, FiMapPin, FiClock, FiPhone, FiMail, FiGlobe, FiMessageCircle } from 'react-icons/fi';
import PageLayout from '../../components/PageLayout';
import { createClient } from '../../utils/supabase/server';
import { createClient as createBrowserClient } from '../../utils/supabase/client';
import { type Database } from '../../types/supabase';

type ContactTable = Database['public']['Tables']['contact_tables']['Row'];
type Restaurant = Database['public']['Tables']['restaurants']['Row'];
import Image from 'next/image';
import Link from 'next/link';

// Typdefinition für die Profile-Daten aus Supabase
type UserProfile = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  phone?: string | null;
  bio?: string | null;
  preferences?: any | null;
  status?: string | null;
};

// Typdefinition für die Teilnehmer, wie sie von Supabase zurückgegeben werden
type SupabaseParticipant = {
  id: string;
  user_id: string;
  contact_table_id: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  notes: string | null;
  user?: UserProfile | null;
};

// Erweiterte Typdefinition für Kontakttische mit Teilnehmern und Restaurant
type ContactTableWithDetails = ContactTable & {
  participants?: SupabaseParticipant[] | null;
  restaurant?: Restaurant | null;
  isParticipant?: boolean;
};

interface ContactTableDetailProps {
  initialContactTable: ContactTableWithDetails;
  userRole: string;
  userId: string | null;
}

export default function ContactTableDetail({ initialContactTable, userRole, userId }: ContactTableDetailProps) {
  const router = useRouter();
  const [contactTable, setContactTable] = useState<ContactTableWithDetails>(initialContactTable);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { id } = router.query;
  const supabase = createBrowserClient();

  // Datum formatieren
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Zeit formatieren
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const time = new Date(`2000-01-01T${timeString}`);
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(time);
  };
  
  // Berechnung der verfügbaren Plätze
  const availableSeats = contactTable ? 
    (contactTable.max_participants - (contactTable.participants?.length || 0)) : 0;
    
  // Status des Kontakttisches bestimmen
  const determineStatus = () => {
    if (!contactTable) return 'PAST';
    
    const eventDate = new Date(contactTable.datetime);
    const today = new Date();
    
    if (eventDate < today) return 'PAST';
    if (availableSeats <= 0) return 'FULL';
    return 'OPEN';
  };
  
  const tableStatus = determineStatus();

  // Prüfen, ob der Kontakttisch in der Vergangenheit liegt
  const isPastEvent = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    return eventDate < today;
  };

  // Prüfen, ob der Benutzer bereits Teilnehmer ist
  const isUserParticipant = () => {
    if (!userId || !contactTable?.participants) return false;
    return contactTable.participants.some(p => p.user_id === userId);
  };

  // Kontakttisch beitreten
  const joinContactTable = async () => {
    if (!id || !userId) return;
    
    try {
      setIsJoining(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('participations')
        .insert({
          contact_table_id: id as string,
          user_id: userId,
          status: 'CONFIRMED',
          notes: message || null
        });
      
      if (error) throw error;
      
      // Aktualisierte Daten abrufen
      await fetchContactTableDetails();
      
      setMessage('');
      setSuccess('Sie haben sich erfolgreich für diesen Kontakttisch angemeldet!');
    } catch (error: any) {
      console.error('Fehler beim Beitreten zum Kontakttisch:', error);
      setError(error.message || 'Es ist ein Fehler beim Beitreten zum Kontakttisch aufgetreten.');
    } finally {
      setIsJoining(false);
    }
  };

  // Kontakttisch verlassen
  const leaveContactTable = async () => {
    if (!id || !userId) return;
    
    try {
      setIsLeaving(true);
      setError(null);
      
      const { error } = await supabase
        .from('participations')
        .delete()
        .eq('contact_table_id', id as string)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Aktualisierte Daten abrufen
      await fetchContactTableDetails();
      
      setSuccess('Sie haben diesen Kontakttisch erfolgreich verlassen.');
    } catch (error: any) {
      console.error('Fehler beim Verlassen des Kontakttisches:', error);
      setError(error.message || 'Es ist ein Fehler beim Verlassen des Kontakttisches aufgetreten.');
    } finally {
      setIsLeaving(false);
    }
  };

  // Kontakttisch-Details abrufen
  const fetchContactTableDetails = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('contact_tables')
        .select(`
          *,
          restaurant:restaurant_id(*),
          participants:participations(*, user:user_id(*))
        `)
        .eq('id', id as string)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setContactTable(data as ContactTableWithDetails);
      }
    } catch (error: any) {
      console.error('Fehler beim Laden der Kontakttisch-Details:', error);
      setError(error.message || 'Es ist ein Fehler beim Laden der Kontakttisch-Details aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  // Beim ersten Laden und bei Änderung der ID Daten abrufen
  useEffect(() => {
    if (id) {
      fetchContactTableDetails();
    }
  }, [id]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex-grow flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </PageLayout>
    );
  }

  if (!contactTable) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Kontakttisch nicht gefunden</h1>
            <p className="text-gray-600 mb-4">Der gesuchte Kontakttisch existiert nicht oder wurde entfernt.</p>
            <Link href="/contact-tables" className="inline-block bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition">
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }
}
