import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { Event, Restaurant, EventParticipant, Profile } from '@prisma/client';
import prisma from '../../lib/prisma';
import PageLayout from '../../components/PageLayout';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { FiCalendar, FiUsers, FiMapPin, FiClock, FiInfo, FiHeart } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';

// Define the type for the event with all its relations
type EventWithDetails = Event & {
  restaurant: Restaurant | null;
  participants: (EventParticipant & { profile: Profile | null })[];
};

interface ContactTableDetailProps {
  event: EventWithDetails | null;
}

export default function ContactTableDetail({ event }: ContactTableDetailProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [favoritesLoading, setFavoritesLoading] = useState<boolean>(true);
  
  // Prüfe, ob das Restaurant ein Favorit ist
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !event?.restaurant) {
        setFavoritesLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('restaurant_id')
          .eq('user_id', user.id)
          .eq('restaurant_id', event.restaurant.id);
        
        if (error) {
          console.error('Fehler beim Prüfen der Favoriten:', error);
        } else {
          setIsFavorite(data && data.length > 0);
        }
      } catch (err) {
        console.error('Fehler beim Prüfen der Favoriten:', err);
      } finally {
        setFavoritesLoading(false);
      }
    };
    
    checkFavorite();
  }, [user, event]);
  
  // Füge ein Restaurant zu den Favoriten hinzu oder entferne es
  const toggleFavorite = async () => {
    if (!user || !event?.restaurant) {
      alert('Bitte melde dich an, um Favoriten zu speichern.');
      return;
    }
    
    try {
      if (isFavorite) {
        // Entferne aus Favoriten
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', event.restaurant.id);
          
        if (error) throw error;
        
        // Aktualisiere den lokalen Zustand
        setIsFavorite(false);
      } else {
        // Füge zu Favoriten hinzu
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            restaurant_id: event.restaurant.id
          });
          
        if (error) throw error;
        
        // Aktualisiere den lokalen Zustand
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Favoriten:', err);
      alert('Es gab ein Problem beim Aktualisieren deiner Favoriten. Bitte versuche es später erneut.');
    }
  };
  if (!event) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center text-center h-full">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Contact Table nicht gefunden</h1>
            <p className="text-gray-600 mt-2">Dieser Tisch existiert nicht oder wurde entfernt.</p>
            <Link href="/" legacyBehavior>
              <a className="mt-6 inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                Zur Startseite
              </a>
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const availableSeats = event.maxParticipants - event.participants.length;

  return (
    <PageLayout className="px-0 py-0 sm:px-0 sm:py-0 md:px-0 md:py-0">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="relative h-56 md:h-72 bg-gray-200">
          {event.restaurant?.imageUrl ? (
            <Image
              src={event.restaurant.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary-100 to-secondary-100">
              <FiCalendar className="text-primary-400 text-7xl opacity-50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{event.title}</h1>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Beschreibung</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{event.description || 'Keine Beschreibung verfügbar.'}</p>
            </div>

            <div className="md:col-span-1 space-y-5">
               <div className="bg-primary-50 p-4 rounded-lg">
                  <div className="flex items-start">
                      <FiCalendar className="text-primary-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                          <h3 className="font-semibold text-gray-800">Datum & Uhrzeit</h3>
                          <p className="text-sm text-gray-600">
                              {format(new Date(event.datetime), 'eeee, dd. MMMM yyyy', { locale: de })} um {format(new Date(event.datetime), 'HH:mm')} Uhr
                          </p>
                      </div>
                  </div>
              </div>
               <div className="bg-secondary-50 p-4 rounded-lg">
                  <div className="flex items-start">
                      <FiUsers className="text-secondary-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                          <h3 className="font-semibold text-gray-800">Teilnehmer</h3>
                          <p className="text-sm text-gray-600">
                              {event.participants.length} / {event.maxParticipants} Plätze belegt ({availableSeats} frei)
                          </p>
                      </div>
                  </div>
              </div>
               <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start">
                      <FiInfo className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                          <h3 className="font-semibold text-gray-800">Status</h3>
                          <p className="text-sm text-gray-600 capitalize">{event.status.toLowerCase()}</p>
                      </div>
                  </div>
              </div>
            </div>
          </div>

          {event.restaurant && (
              <div className="mt-10 pt-8 border-t mx-6 md:mx-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Veranstaltet von</h2>
                   <Link href={`/restaurants/${event.restaurant.id}`} legacyBehavior>
                      <a className="block bg-gray-50 hover:bg-gray-100 p-4 rounded-lg transition-colors">
                         <div className="flex items-center">
                              {event.restaurant.imageUrl && (
                                  <div className="relative w-16 h-16 rounded-md overflow-hidden mr-4">
                                      <Image src={event.restaurant.imageUrl} alt={event.restaurant.name} fill className="object-cover"/>
                                  </div>
                              )}
                              <div className="flex-grow">
                                  <h3 className="font-bold text-lg text-primary-700">{event.restaurant.name}</h3>
                                  <p className="text-sm text-gray-600 flex items-center mt-1">
                                      <FiMapPin className="mr-2"/> {event.restaurant.address}, {event.restaurant.city}
                                  </p>
                              </div>
                              
                              {user && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault(); // Verhindere Navigation zum Restaurant
                                    toggleFavorite();
                                  }}
                                  disabled={favoritesLoading}
                                  className={`p-2 rounded-full flex items-center justify-center transition-colors ${
                                    isFavorite 
                                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  }`}
                                  title={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                                >
                                  <FiHeart 
                                    className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} 
                                  />
                                </button>
                              )}
                         </div>
                      </a>
                  </Link>
              </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  const { id } = context.params || {};

  if (typeof id !== 'string') {
    return { notFound: true };
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        restaurant: true,
        participants: {
          include: {
            profile: true,
          },
        },
      },
    });

    // SSR Guarding: Nur anzeigen, wenn öffentlich und Restaurant sichtbar + aktiv
    if (
      !event ||
      event.isPublic !== true ||
      !event.restaurant ||
      event.restaurant.isVisible !== true ||
      event.restaurant.contractStatus !== 'ACTIVE'
    ) {
      return { notFound: true };
    }

    return {
      props: {
        event: JSON.parse(JSON.stringify(event)),
      },
    };
  } catch (error) {
    console.error(`Error fetching event with id ${id}:`, error);
    return { notFound: true };
  }
};
