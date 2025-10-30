import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import { useAuth } from '../hooks/useAuth';
import { useThemeDetector } from '../hooks/useThemeDetector';
import { supabase } from '../services/supabase';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import GeoJSON types for TypeScript
import { GeoJsonObject } from 'geojson';

import campusDetailsData from '../data/campus-data.json';

// --- Type Definitions and Constants ---
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
  url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
};

const CampusMapPage = () => {
  const { profile } = useAuth();
  const isDarkMode = useThemeDetector();
  const userCampus = profile?.campus as Campus | undefined;
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // Effect to fetch and subscribe to friend locations
  useEffect(() => {
    const fetchFriendLocations = async () => {
      const { data, error } = await supabase.rpc('get_friend_locations');
      if (error) {
        console.error('Error fetching friend locations:', error);
      } else {
        setFriendLocations(data || []);
      }
    };

    fetchFriendLocations();

    const subscription = supabase
      .channel('public:user_locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_locations' }, fetchFriendLocations)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Effect to get and update the current user's location with high accuracy
  useEffect(() => {
    if (!profile) return;

    const geolocationOptions = {
      enableHighAccuracy: true, // Request the most accurate location possible
      timeout: 5000,           // Give up after 5 seconds
      maximumAge: 0,           // Do not use a cached position
    };

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(`Location found with accuracy: ${accuracy} meters.`);
          await supabase.rpc('update_user_location', { latitude, longitude });
        },
        (error) => {
          console.error(`Error getting user location: ${error.message}`);
        },
        geolocationOptions // Pass the high-accuracy options
      );
    };

    updateLocation();
    const intervalId = setInterval(updateLocation, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [profile]);

  // Effect to imperatively update GeoJSON marker styles when the theme changes
  useEffect(() => {
    const geoJsonLayer = geoJsonRef.current;
    if (geoJsonLayer) {
      geoJsonLayer.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker && layer.feature) {
          layer.setStyle({
            color: isDarkMode ? '#1f2937' : '#fff',
            weight: 1.5,
          });
        }
      });
    }
  }, [isDarkMode]);

  if (!userCampus || !campusCoordinates[userCampus]) {
    return <div>Loading campus information...</div>;
  }

  const campusCenter = campusCoordinates[userCampus];
  const campusBounds = L.latLngBounds([campusCenter.lat - 0.005, campusCenter.lng - 0.005], [campusCenter.lat + 0.005, campusCenter.lng + 0.005]);
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return '#2563eb'; case 'hostel': return '#c026d3';
      case 'food': return '#f97316'; case 'landmark': return '#16a34a';
      case 'recreation': return '#ca8a04'; case 'sports': return '#dc2626';
      case 'admin': return '#475569'; case 'service': return '#0891b2';
      default: return '#6b7280';
    }
  };

  const pointToLayer = (feature: GeoJSON.Feature, latlng: L.LatLng) => {
    return L.circleMarker(latlng, {
      radius: 8,
      fillColor: getCategoryColor(feature.properties?.category),
      color: isDarkMode ? '#1f2937' : '#fff',
      weight: 1.5,
      opacity: 1,
      fillOpacity: 0.9,
    });
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    if (feature.properties && feature.properties.name) {
      const popupContent = `
        <div class="font-sans">
          <strong style="color: ${getCategoryColor(feature.properties.category)}; font-size: 1.1em;">
            ${feature.properties.name}
          </strong>
          <p class="mt-1">${feature.properties.description || ''}</p>
        </div>
      `;
      layer.bindPopup(popupContent);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-primary-light dark:bg-primary">
      <div className="bg-secondary-light dark:bg-secondary p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-2">
            {userCampus} Campus Map
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary">
            See where your friends are on campus in real-time. Your location is automatically updated while you have this page open.
          </p>
        </div>
      </div>
      <div className="flex-grow p-4 md:p-8">
        <div className="w-full h-full relative rounded-lg overflow-hidden shadow-2xl">
          <MapContainer center={campusCenter} zoom={15} className="w-full h-full" maxBounds={campusBounds} maxBoundsViscosity={1.0}>
            <TileLayer key={mapTheme.url} url={mapTheme.url} attribution={mapTheme.attribution} minZoom={15} maxZoom={19} />
            <GeoJSON ref={geoJsonRef} data={campusDetailsData as GeoJsonObject} pointToLayer={pointToLayer} onEachFeature={onEachFeature} />
            {friendLocations.map((friend) => (
              <Marker key={friend.user_id} position={[friend.latitude, friend.longitude]} icon={createCustomIcon(friend.avatar_url)}>
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">{friend.full_name}</p>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary">
                      @{friend.username}
                    </p>
                    <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1">
                      Last seen: {new Date(friend.last_seen).toLocaleTimeString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default CampusMapPage;