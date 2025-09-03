import React, { useState, useMemo } from 'react';
import { useCache } from '@/hooks/useCache';
import { createClient } from '@/utils/supabase/client';
import { FaSpinner, FaExclamationTriangle, FaSync, FaCalendar } from 'react-icons/fa';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Reservation {
  id: string;
  event_id: string;
  customer_id: string;
  restaurant_id: string;
  reservation_time: string;
  party_size: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  created_at: string;
  customer: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  event: {
    id: string;
    title: string;
  } | null;
}

interface CachedReservationsListProps {
  restaurantId: string;
  limit?: number;
  status?: 'confirmed' | 'pending' | 'cancelled' | 'all';
  cacheTime?: number; // Cache-Zeit in Millisekunden
}

export default function CachedReservationsList({
  restaurantId,
  limit = 10,
  status = 'all',
  cacheTime = 2 * 60 * 1000 // 2 Minuten Standard-Cache-Zeit
}: CachedReservationsListProps) {
  const supabase = createClient();
  const [page, setPage] = useState(1);
  const pageSize = limit;
  
  // Funktion zum Abrufen der Reservierungen
  const fetchReservations = async (): Promise<{
    data: Reservation[];
    count: number;
  }> => {
    let query = supabase
      .from('reservations')
      .select(`
        id, 
        event_id, 
        customer_id, 
        restaurant_id, 
        reservation_time, 
        party_size, 
        status, 
        created_at,
        customer:customer_id(id, email, first_name, last_name),
        event:event_id(id, title)
      `, { count: 'exact' })
      .eq('restaurant_id', restaurantId)
      .order('reservation_time', { ascending: false });
    
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Paginierung
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      throw new Error(`Fehler beim Laden der Reservierungen: ${error.message}`);
    }
    
    return { 
      data: data as Reservation[] || [], 
      count: count || 0 
    };
  };
  
  // Cache-Key basierend auf den Parametern
  const cacheKey = `reservations:${restaurantId}:${status}:${page}:${pageSize}`;
  
  // Verwende den useCache-Hook
  const { 
    data: reservationsData, 
    isLoading, 
    error, 
    invalidateAndRefetch 
  } = useCache<{ data: Reservation[]; count: number }>(
    cacheKey,
    fetchReservations,
    {
      ttl: cacheTime,
      autoFetch: true,
      revalidateOnFocus: true,
      staleWhileRevalidate: true
    }
  );
  
  const reservations = reservationsData?.data || [];
  const totalCount = reservationsData?.count || 0;
  
  // Berechne die Gesamtzahl der Seiten
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);
  
  // Funktion zum Ändern der Seite
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Reservierungen
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Lade Reservierungen...' : `${totalCount} Reservierungen gefunden`}
          </p>
        </div>
        
        <button
          onClick={() => invalidateAndRefetch()}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isLoading}
        >
          <FaSync className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
      </div>
      
      {isLoading && !reservations.length && (
        <div className="px-4 py-12 text-center">
          <FaSpinner className="mx-auto h-8 w-8 text-indigo-500 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Lade Reservierungen...</p>
        </div>
      )}
      
      {error && (
        <div className="px-4 py-5 sm:px-6">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Fehler beim Laden der Reservierungen
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error.message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isLoading && !error && reservations.length === 0 && (
        <div className="px-4 py-5 sm:px-6 text-center">
          <p className="text-sm text-gray-500">Keine Reservierungen gefunden.</p>
        </div>
      )}
      
      {reservations.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {reservations.map((reservation) => (
            <li key={reservation.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        <FaCalendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-indigo-600">
                        {reservation.customer?.first_name} {reservation.customer?.last_name}
                      </p>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {format(new Date(reservation.reservation_time), 'PPp', { locale: de })}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          {reservation.party_size} {reservation.party_size === 1 ? 'Person' : 'Personen'}
                        </p>
                      </div>
                      {reservation.event && (
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>Event: {reservation.event.title}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-5 flex-shrink-0">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        reservation.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : reservation.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {reservation.status === 'confirmed'
                        ? 'Bestätigt'
                        : reservation.status === 'pending'
                        ? 'Ausstehend'
                        : 'Storniert'}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {/* Paginierung */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Zurück
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                page === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Weiter
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Zeige <span className="font-medium">{(page - 1) * pageSize + 1}</span> bis{' '}
                <span className="font-medium">
                  {Math.min(page * pageSize, totalCount)}
                </span>{' '}
                von <span className="font-medium">{totalCount}</span> Ergebnissen
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    page === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Zurück</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                
                {/* Seitenzahlen */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Zeige maximal 5 Seiten an
                  let pageNum;
                  if (totalPages <= 5) {
                    // Wenn weniger als 5 Seiten, zeige alle
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    // Wenn aktuelle Seite <= 3, zeige 1-5
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    // Wenn aktuelle Seite nahe am Ende, zeige die letzten 5
                    pageNum = totalPages - 4 + i;
                  } else {
                    // Sonst zeige 2 vor und 2 nach der aktuellen Seite
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pageNum
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    page === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Weiter</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
