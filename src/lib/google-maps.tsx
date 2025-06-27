import { PrismaClient } from '@prisma/client';
import { useCallback, useRef } from 'react';
import { LoadScriptNext, GoogleMap, Marker } from '@react-google-maps/api';
import { Libraries } from '@react-google-maps/api/dist/utils/make-load-script-url';
import * as React from 'react';

const prisma = new PrismaClient();

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  rating?: number;
  ratingCount?: number;
  imageUrls?: string[];
}

// Google Maps Konfiguration
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 52.520008,
  lng: 13.404954,
};

const libraries: Libraries = ['places'];

// Restaurant-Suchfunktion
export async function searchRestaurants({
  latitude,
  longitude,
  radius = 5000, // 5km Radius
  searchTerm = '',
}: {
  latitude: number;
  longitude: number;
  radius?: number;
  searchTerm?: string;
}): Promise<Restaurant[]> {
  // Berechnung der geografischen Grenzen für die Suche
  const restaurants = await prisma.restaurant.findMany({
    where: {
      isListed: true,
      status: 'ACTIVE',
      latitude: {
        gte: latitude - (radius / 111320), // 1 Grad = ~111.32km
        lte: latitude + (radius / 111320),
      },
      longitude: {
        gte: longitude - (radius / (111320 * Math.cos(latitude * Math.PI / 180))),
        lte: longitude + (radius / (111320 * Math.cos(latitude * Math.PI / 180))),
      },
      ...(searchTerm && {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { city: { contains: searchTerm, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      ratings: true,
      events: {
        where: {
          datetime: {
            gte: new Date(),
          },
        },
      },
    },
  });

  return restaurants as unknown as Restaurant[];
}

// Google Maps React Komponente
export function RestaurantMap({
  restaurants,
  center = defaultCenter,
  zoom = 12,
}: {
  restaurants: Restaurant[];
  center?: { lat: number; lng: number };
  zoom?: number;
}) {
  const mapRef = useRef<google.maps.Map>();

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  return (
    <LoadScriptNext
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
      libraries={libraries}
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={onMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={{
              lat: restaurant.latitude,
              lng: restaurant.longitude,
            }}
            title={restaurant.name}
          />
        ))}
      </GoogleMap>
    </LoadScriptNext>
  );
}

// Autocomplete Komponente für die Standortsuche
export function LocationSearch({
  onPlaceSelected,
}: {
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
}) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete>();

  const onLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    autocomplete.setFields(['geometry', 'name', 'formatted_address']);
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        onPlaceSelected(place);
      }
    }
  }, [onPlaceSelected]);

  return (
    <input
      type="text"
      placeholder="Standort suchen..."
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    />
  );
} 