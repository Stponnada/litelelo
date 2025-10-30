import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import { useAuth } from '../hooks/useAuth';
import { useThemeDetector } from '../hooks/useThemeDetector';
import { supabase } from '../services/supabase';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import campusDetailsData from '../data/campus-data.json';

// --- (Type definitions and constants remain the same) ---
type Campus = 'Pilani' | 'Goa' | 'Hyderabad';
const campusCoordinates: Record<Campus, { lat: number; lng: number }> = {
  Pilani: { lat: 28.359481, lng: 75.588136 },
  Goa: { lat: 15.390833, lng: 73.8775 },
  Hyderabad: { lat: 17.544841, lng: 78.571687 },
};
interface FriendLocation {
  user_id: string;
  latitude: number;
  longitude: number;
  last_seen: string;
  username: string;
  full_name: string;
  avatar_url: string;
}
const lightTheme = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};
const darkTheme = {
  url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
  attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
};

const CampusMapPage = () => {
  const { profile } = useAuth();
  const isDarkMode = useThemeDetector();
  const userCampus = profile?.campus;
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);

  // --- (All useEffect hooks remain exactly the same) ---
  useEffect(() => {
    const fetchFriendLocations = async () => { /* ... */ };
    fetchFriendLocations();
    const subscription = supabase.channel('public:user_locations').on('postgres_changes', { event: '*', schema: 'public', table: 'user_locations' }, fetchFriendLocations).subscribe();
    return () => { subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const updateLocation = () => { /* ... */ };
    updateLocation();
    const intervalId = setInterval(updateLocation, 10000);
    return () => { clearInterval(intervalId); };
  }, []);

  if (!userCampus || !campusCoordinates[userCampus]) {
    return <div>Loading campus information...</div>;
  }

  const campusCenter = campusCoordinates[userCampus];
  const campusBounds = L.latLngBounds(
    [campusCenter.lat - 0.005, campusCenter.lng - 0.005],
    [campusCenter.lat + 0.005, campusCenter.lng + 0.005]
  );
  const mapTheme = isDarkMode ? darkTheme : lightTheme;

  const createCustomIcon = (avatarUrl: string) => {
    return L.divIcon({
      html: `<img src="${avatarUrl}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid ${isDarkMode ? '#4b5563' : '#fff'}; box-shadow: 0 0 5px rgba(0,0,0,0.5);" />`,
      className: 'custom-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  };

  const getCategoryColor = (category: string) => { /* ... same as before ... */ };

  // --- MODIFIED: The styling now depends directly on the `isDarkMode` state ---
  const pointToLayer = (feature, latlng) => {
    return L.circleMarker(latlng, {
      radius: 8,
      fillColor: getCategoryColor(feature.properties.category),
      // Set border color based on theme for better visibility
      color: isDarkMode ? '#1f2937' : '#fff', 
      weight: 1.5,
      opacity: 1,
      fillOpacity: 0.9
    });
  };

  const onEachFeature = (feature, layer) => { /* ... same as before ... */ };

  return (
    <div className="w-full h-screen flex flex-col bg-primary-light dark:bg-primary">
      {/* --- (Header is unchanged) --- */}
      <div className="bg-secondary-light dark:bg-secondary p-4 shadow-lg">{/* ... */}</div>
      
      <div className="flex-grow p-4 md:p-8">
        <div className="w-full h-full relative rounded-lg overflow-hidden shadow-2xl">
          <MapContainer
            center={[campusCenter.lat, campusCenter.lng]}
            zoom={15}
            className="w-full h-full"
            maxBounds={campusBounds}
            maxBoundsViscosity={1.0}
          >
            <TileLayer
              // Add a key here as well to ensure a clean re-render
              key={mapTheme.url} 
              url={mapTheme.url}
              attribution={mapTheme.attribution}
              minZoom={15}
              maxZoom={19}
            />

            {/* --- THE FIX: Added a `key` prop --- */}
            {/* This tells React to re-create the component when `isDarkMode` changes */}
            <GeoJSON
              key={String(isDarkMode)} 
              data={campusDetailsData as any}
              pointToLayer={pointToLayer}
              onEachFeature={onEachFeature}
            />

            {friendLocations.map((friend) => (
              <Marker
                key={friend.user_id}
                position={[friend.latitude, friend.longitude]}
                icon={createCustomIcon(friend.avatar_url)}
              >
                <Popup>{/* ... */}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default CampusMapPage;