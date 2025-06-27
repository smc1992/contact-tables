import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LatLngExpression } from 'leaflet';

// Typdefinitionen für die Komponente
interface Restaurant {
  id: number;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  cuisine?: string;
  price_range?: string;
  image_url?: string;
}

interface RestaurantMapProps {
  restaurants: Restaurant[];
  height?: string;
  center?: LatLngExpression; // [latitude, longitude]
  zoom?: number;
}

const RestaurantMap: React.FC<RestaurantMapProps> = ({ 
  restaurants, 
  height = '500px',
  center = [52.5200, 13.4050], // Berlin als Standardzentrum
  zoom = 12
}) => {
  // Leaflet-Marker-Icons für die Karte korrigieren
  // (Dies ist ein bekanntes Problem mit Leaflet in React)
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);
  // Wenn keine Restaurants vorhanden sind oder keine gültigen Koordinaten haben, zeige eine Nachricht an
  if (!restaurants || restaurants.length === 0 || !restaurants.some(r => r.latitude && r.longitude)) {
    return (
      <div 
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-500">Keine Restaurants mit gültigen Standorten gefunden.</p>
      </div>
    );
  }

  // Berechne das Zentrum der Karte basierend auf den Restaurantstandorten, wenn kein Zentrum angegeben wurde
  const calculateCenter = (): LatLngExpression => {
    const validRestaurants = restaurants.filter(r => r.latitude && r.longitude);
    if (validRestaurants.length === 0) return center;
    
    const sumLat = validRestaurants.reduce((sum, r) => sum + r.latitude, 0);
    const sumLng = validRestaurants.reduce((sum, r) => sum + r.longitude, 0);
    
    return [sumLat / validRestaurants.length, sumLng / validRestaurants.length] as LatLngExpression;
  };

  const mapCenter = center || calculateCenter();

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {restaurants.map((restaurant) => (
          restaurant.latitude && restaurant.longitude ? (
            <Marker 
              key={restaurant.id} 
              position={[restaurant.latitude, restaurant.longitude] as LatLngExpression}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">{restaurant.name}</h3>
                  <p className="text-sm text-gray-600">{restaurant.address}, {restaurant.postal_code} {restaurant.city}</p>
                  {restaurant.cuisine && (
                    <p className="text-sm text-gray-500 mt-1">Küche: {restaurant.cuisine}</p>
                  )}
                  {restaurant.price_range && (
                    <p className="text-sm text-gray-500">Preisklasse: {restaurant.price_range}</p>
                  )}
                  {restaurant.image_url && (
                    <img 
                      src={restaurant.image_url} 
                      alt={restaurant.name} 
                      className="mt-2 w-full h-24 object-cover rounded"
                    />
                  )}
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
};

export default RestaurantMap;
