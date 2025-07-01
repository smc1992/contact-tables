import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { createClient } from '../../../../utils/supabase/server';
import prisma from '../../../../lib/prisma';
import { Event } from '@prisma/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';
import RestaurantSidebar from '../../../../components/restaurant/RestaurantSidebar';
import { FiCalendar, FiPlusCircle, FiUsers, FiClock, FiEdit, FiTrash2 } from 'react-icons/fi';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface ContactTablePageProps {
  events: (Event & { _count: { participants: number } })[];
}

export default function ContactTablePage({ events: initialEvents }: ContactTablePageProps) {
  const [events, setEvents] = useState(initialEvents);

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Kontakttisch endgültig löschen möchten?')) {
      return;
    }

    const toastId = toast.loading('Kontakttisch wird gelöscht...');

    try {
      const response = await fetch('/api/restaurant/events/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      toast.dismiss(toastId);

      if (response.ok) {
        toast.success('Kontakttisch erfolgreich gelöscht.');
        setEvents(currentEvents => currentEvents.filter(event => event.id !== eventId));
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Löschen fehlgeschlagen.');
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || 'Ein unerwarteter Fehler ist aufgetreten.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <div className="flex flex-col md:flex-row">
        <RestaurantSidebar activeItem="contact-tables" />
        <main className="flex-1 px-4 md:px-8 pb-12 mt-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FiCalendar className="mr-3 text-primary-500" />
                Ihre Contact Tables
              </h1>
              <Link href="/restaurant/dashboard/contact-tables/new" legacyBehavior>
                <a className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-primary-700 transition-colors">
                  <FiPlusCircle className="mr-2" />
                  Neu erstellen
                </a>
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg shadow border">
                <h3 className="text-xl font-semibold text-gray-700">Noch keine Contact Tables erstellt</h3>
                <p className="text-gray-500 mt-2 mb-6">Erstellen Sie Ihren ersten Contact Table, um Gäste zu verbinden.</p>
                <Link href="/restaurant/dashboard/contact-tables/new" legacyBehavior>
                  <a className="bg-primary-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors">
                    Jetzt erstellen
                  </a>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                  <Link href={`/contact-tables/${event.id}`} key={event.id} legacyBehavior>
                    <a className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out overflow-hidden no-underline text-current">
                      <div className="flex flex-col justify-between h-full">
                        <div className="p-5">
                          <h3 className="font-bold text-lg text-gray-800 truncate">{event.title}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-2">
                            <FiClock className="mr-2" />
                            <span>{format(new Date(event.datetime), 'HH:mm')} Uhr</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <FiCalendar className="mr-2" />
                            <span>{format(new Date(event.datetime), 'eeee, dd. MMMM yyyy', { locale: de })}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <FiUsers className="mr-2" />
                            <span>{event._count.participants} / {event.maxParticipants} Teilnehmer</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 px-5 py-3 border-t flex justify-end space-x-2">
                          <Link href={`/restaurant/dashboard/contact-tables/edit/${event.id}`} legacyBehavior>
                            <a onClick={(e) => e.stopPropagation()} className="text-gray-500 hover:text-primary-600 p-2">
                              <FiEdit size={16} />
                            </a>
                          </Link>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(event.id);
                            }}
                            className="text-gray-500 hover:text-red-600 p-2"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  const supabase = createClient(context);
  const { data: { user } } = await supabase.auth.getUser();

  console.log('getServerSideProps für /contact-tables: Wird ausgeführt.');
  if (!user || user.user_metadata?.role !== 'RESTAURANT') {
    console.log('getServerSideProps: Kein Benutzer oder falsche Rolle. Leite zum Login weiter.');
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  console.log(`getServerSideProps: Suche Restaurant für userId: ${user.id}`);

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    console.log('getServerSideProps: Ergebnis der Restaurantsuche:', restaurant);

    if (!restaurant) {
      console.log('getServerSideProps: KEIN Restaurant gefunden. Leite zur Registrierung weiter.');
      // This case should ideally not happen if the role is correct, but as a safeguard:
      return { redirect: { destination: '/restaurant/register?error=noprofile_on_redirect', permanent: false } };
    }

    const events = await prisma.event.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { datetime: 'asc' },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    return {
      props: {
        events: JSON.parse(JSON.stringify(events)),
      },
    };
  } catch (error) {
    console.error('Error fetching contact tables:', error);
    return { props: { events: [] } }; // Render page with empty list on error
  }
};
