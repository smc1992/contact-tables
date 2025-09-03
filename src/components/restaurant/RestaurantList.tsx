import React, { useState } from 'react';
import { useCache } from '@/hooks/useCache';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { FaSpinner, FaExclamationTriangle, FaSync } from 'react-icons/fa';

interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  cuisine: string | null;
  image_url: string | null;
  is_active: boolean;
}

interface RestaurantListProps {
  limit?: number;
  showInactive?: boolean;
  cacheTime?: number; // Cache-Zeit in Millisekunden
}

export default function RestaurantList({ 
  limit = 10, 
  showInactive = false,
  cacheTime = 5 * 60 * 1000 // 5 Minuten Standard-Cache-Zeit
}: RestaurantListProps) {
  const supabase = createClient();
  
  // Funktion zum Abrufen der Restaurants
  const fetchRestaurants = async (): Promise<Restaurant[]> => {
    let query = supabase
      .from('restaurants')
      .select('id, name, address, city, cuisine, image_url, is_active')
      .order('name');
      
    if (!showInactive) {
      query = query.eq('is_active', true);
    }
    
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Fehler beim Laden der Restaurants: ${error.message}`);
    }
    
    return data || [];
  };
  
  // Cache-Key basierend auf den Parametern
  const cacheKey = `restaurants:${limit}:${showInactive}`;
  
  // Verwende den useCache-Hook
  const { 
    data: restaurants, 
    isLoading, 
    error, 
    invalidateAndRefetch 
  } = useCache<Restaurant[]>(
    cacheKey,
    fetchRestaurants,
    {
      ttl: cacheTime,
      autoFetch: true,
      revalidateOnFocus: true,
      staleWhileRevalidate: true
    }
  );
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Restaurants
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Lade Restaurants...' : `${restaurants?.length || 0} Restaurants gefunden`}
          </p>
        </div>
        
        <button
          onClick={() => invalidateAndRefetch()}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FaSync className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
      </div>
      
      {isLoading && !restaurants && (
        <div className="px-4 py-12 text-center">
          <FaSpinner className="mx-auto h-8 w-8 text-indigo-500 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Lade Restaurants...</p>
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
                  Fehler beim Laden der Restaurants
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error.message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isLoading && !error && restaurants && restaurants.length === 0 && (
        <div className="px-4 py-5 sm:px-6 text-center">
          <p className="text-sm text-gray-500">Keine Restaurants gefunden.</p>
        </div>
      )}
      
      {restaurants && restaurants.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id}>
              <Link href={`/restaurants/${restaurant.id}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {restaurant.image_url && (
                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={restaurant.image_url}
                            alt={restaurant.name}
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {restaurant.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {restaurant.city ? `${restaurant.city}` : 'Keine Ortsangabe'}
                          {restaurant.cuisine && ` • ${restaurant.cuisine}`}
                        </p>
                      </div>
                    </div>
                    {!restaurant.is_active && (
                      <div className="ml-2 flex-shrink-0">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Inaktiv
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
