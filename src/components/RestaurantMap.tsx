import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { RestaurantPageItem } from '@/types/restaurants';

interface RestaurantMapProps {
  restaurants: RestaurantPageItem[];
  height: string;
  center?: { lat: number; lng: number } | null;
}

// A helper component to programmatically change the map's view when props change
const ChangeView: React.FC<{ center: LatLngExpression; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const RestaurantMap: React.FC<RestaurantMapProps> = ({ restaurants, height, center }) => {
  // Default center is set to a central point in Germany if no specific center is provided
  const mapCenter: LatLngExpression = center ? [center.lat, center.lng] : [51.1657, 10.4515];
  const zoomLevel = center ? 13 : 6; // Zoom in if a specific location is searched

  return (
    <MapContainer center={mapCenter} zoom={zoomLevel} style={{ height, width: '100%' }} scrollWheelZoom={true}>
      <ChangeView center={mapCenter} zoom={zoomLevel} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {restaurants.map(restaurant => {
        if (restaurant.latitude && restaurant.longitude) {
          return (
            <Marker key={restaurant.id} position={[restaurant.latitude, restaurant.longitude]}>
              <Popup>
                <div className="font-sans">
                  <h3 className="font-bold text-lg mb-1">{restaurant.name}</h3>
                  <p className="text-gray-600">{restaurant.address}, {restaurant.city}</p>
                  <a href={`/restaurants/${restaurant.id}`} className="text-primary-500 hover:underline mt-2 inline-block">Details anzeigen</a>
                </div>
              </Popup>
            </Marker>
          );
        }
        return null;
      })}
    </MapContainer>
  );
};

export default RestaurantMap;
