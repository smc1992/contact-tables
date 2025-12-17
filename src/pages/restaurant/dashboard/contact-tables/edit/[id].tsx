import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { Event } from '@prisma/client';
import { FiEdit, FiLoader } from 'react-icons/fi';
import Head from 'next/head';
import RestaurantSidebar from '@/components/restaurant/RestaurantSidebar';
import toast from 'react-hot-toast';

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { id } = ctx.params!;
  const supabase = createClient(ctx);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata.role !== 'RESTAURANT') {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!restaurant) {
    return { redirect: { destination: '/restaurant/register', permanent: false } };
  }

  const event = await prisma.event.findFirst({
    where: {
      id: id as string,
      restaurantId: restaurant.id, // Security check: ensure the event belongs to the user's restaurant
    },
  });

  if (!event) {
    return { notFound: true }; // Event not found or doesn't belong to the user
  }

  return {
    props: {
      event: JSON.parse(JSON.stringify(event)),
    },
  };
};

interface EditContactTableProps {
  event: Event;
}

export default function EditContactTablePage({ event }: EditContactTableProps) {
  const router = useRouter();
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  // Format date for datetime-local input, which needs 'YYYY-MM-DDTHH:mm'
  const [datetime, setDatetime] = useState(new Date(event.datetime).toISOString().slice(0, 16));
  const [maxParticipants, setMaxParticipants] = useState(event.maxParticipants);
  const [price, setPrice] = useState(event.price);
  const [isPublic, setIsPublic] = useState(event.isPublic);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading('Änderungen werden gespeichert...');

    const response = await fetch('/api/restaurant/events/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: event.id,
        title,
        description,
        datetime: new Date(datetime).toISOString(),
        maxParticipants: Number(maxParticipants),
        price: Number(price),
        isPublic,
      }),
    });

    setIsLoading(false);
    toast.dismiss(toastId);

    if (response.ok) {
      toast.success('Änderungen erfolgreich gespeichert!');
      router.push('/restaurant/dashboard/contact-tables');
    } else {
      const data = await response.json();
      toast.error(data.message || 'Ein Fehler ist aufgetreten.');
    }
  };

  return (
    <>
      <Head>
        <title>Kontakttisch bearbeiten | contact.tables</title>
      </Head>
      <div className="flex min-h-screen bg-gray-50">
        <RestaurantSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
              <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <FiEdit className="mr-3 text-primary-500" />
                Kontakttisch bearbeiten
              </h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                 {/* Form fields are identical to the 'new' page, just pre-filled */}
                 <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                  <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                  <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 mb-1">Datum & Uhrzeit</label>
                    <input type="datetime-local" id="datetime" value={datetime} onChange={(e) => setDatetime(e.target.value)} required className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">Max. Teilnehmer</label>
                    <input type="number" id="maxParticipants" value={maxParticipants} onChange={(e) => setMaxParticipants(parseInt(e.target.value, 10))} required min="2" className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Preis (€)</label>
                    <input type="number" id="price" value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} required min="0" step="0.01" className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sichtbarkeit</label>
                    <div className="mt-2 flex items-center space-x-4">
                      <label className="inline-flex items-center"><input type="radio" className="form-radio text-primary-600" name="isPublic" value="true" checked={isPublic === true} onChange={() => setIsPublic(true)} /><span className="ml-2">Öffentlich</span></label>
                      <label className="inline-flex items-center"><input type="radio" className="form-radio text-primary-600" name="isPublic" value="false" checked={isPublic === false} onChange={() => setIsPublic(false)} /><span className="ml-2">Privat</span></label>
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => router.back()} className="py-2 px-6 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">Abbrechen</button>
                  <button type="submit" disabled={isLoading} className="inline-flex justify-center items-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
                    {isLoading && <FiLoader className="animate-spin -ml-1 mr-3 h-5 w-5" />}
                    {isLoading ? 'Speichert...' : 'Änderungen speichern'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
