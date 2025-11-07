// src/pages/CampusMapPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import { useAuth } from '../hooks/useAuth';
import { useThemeDetector } from '../hooks/useThemeDetector';
import { supabase } from '../services/supabase';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { GeoJsonObject } from 'geojson';
import campusDetailsData from '../data/campus-data.json';

// Types
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

// Tile Themes
const lightTheme = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
};

const darkTheme = {
  url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution: '&copy; OpenStreetMap &copy; CARTO'
};

// Floating Zoom Controls
const FloatingZoomControls: React.FC = () => {
  const map = useMap();
  return (
    <div className="absolute right-4 bottom-6 z-10 flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg hover:shadow-xl flex items-center justify-center text-gray-700 dark:text-gray-200 hover:scale-110 transition-all duration-200 border border-gray-300 dark:border-gray-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg hover:shadow-xl flex items-center justify-center text-gray-700 dark:text-gray-200 hover:scale-110 transition-all duration-200 border border-gray-300 dark:border-gray-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
    </div>
  );
};

const CampusMapPage = () => {
  const { profile } = useAuth();
  const isDarkMode = useThemeDetector();
  const userCampus = profile?.campus as Campus | undefined;
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // Fetch & subscribe to friend locations
  useEffect(() => {
    const fetchFriendLocations = async () => {
      const { data, error } = await supabase.rpc('get_friend_locations');
      if (error) console.error('Error:', error);
      else setFriendLocations(data || []);
      setLoading(false);
    };

    fetchFriendLocations();

    const subscription = supabase
      .channel('public:user_locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_locations' }, fetchFriendLocations)
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  // Update user location every 10s with high accuracy
  useEffect(() => {
    if (!profile) return;

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          await supabase.rpc('update_user_location', { latitude, longitude });
        },
        (err) => console.error('Geolocation error:', err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    };

    updateLocation();
    const id = setInterval(updateLocation, 10000);
    return () => clearInterval(id);
  }, [profile]);

  // Update GeoJSON styles on theme change
  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.CircleMarker) {
          layer.setStyle({
            color: isDarkMode ? '#1f2937' : '#fff',
            weight: 2,
          });
        }
      });
    }
  }, [isDarkMode]);

  if (!userCampus || !campusCoordinates[userCampus]) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading campus map...</p>
        </div>
      </div>
    );
  }

  const center = campusCoordinates[userCampus];
  const bounds = L.latLngBounds(
    [center.lat - 0.006, center.lng - 0.006],
    [center.lat + 0.006, center.lng + 0.006]
  );

  const mapTheme = isDarkMode ? darkTheme : lightTheme;

  // Custom Avatar Marker
  const createAvatarIcon = (url: string) => {
    return L.divIcon({
      html: `
        <div class="relative group">
          <img src="${url}" class="w-12 h-12 rounded-full border-3 border-white dark:border-gray-700 shadow-lg ring-2 ring-brand-green/50 group-hover:ring-brand-green transition-all duration-300" />
          <div class="absolute inset-0 rounded-full bg-brand-green/20 animate-pulse group-hover:animate-ping"></div>
        </div>
      `,
      className: 'custom-friend-marker',
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48],
    });
  };

  // POI Styling
  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      academic: '#3b82f6', hostel: '#c026d3', food: '#f97316',
      landmark: '#16a34a', recreation: '#ca8a04', sports: '#dc2626',
      admin: '#475569', service: '#0891b2'
    };
    return colors[cat] || '#6b7280';
  };

  const pointToLayer = (feature: GeoJSON.Feature, latlng: L.LatLng) => {
    const color = getCategoryColor(feature.properties?.category || '');
    return L.circleMarker(latlng, {
      radius: 10,
      fillColor: color,
      color: isDarkMode ? '#1f2937' : '#fff',
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.85,
      className: 'poi-marker animate-fade-in',
    }).on('mouseover', function () {
      this.setStyle({ radius: 14, fillOpacity: 1 });
    }).on('mouseout', function () {
      this.setStyle({ radius: 10, fillOpacity: 0.85 });
    });
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    if (feature.properties?.name) {
      const color = getCategoryColor(feature.properties.category);
      layer.bindPopup(`
        <div class="p-2 font-sans">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
            <strong style="color: ${color}; font-size: 1.1em;">${feature.properties.name}</strong>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400">${feature.properties.description || 'No description'}</p>
        </div>
      `, {
        className: 'custom-popup',
        closeButton: false,
        autoClose: true,
      });
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Glass Header */}
      <header className="relative z- -10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-green/5 to-emerald-500/5 dark:from-brand-green/10 dark:to-emerald-900/10"></div>
        <div className="relative max-w-5xl mx-auto p-5 md:p-7">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3 font-raleway">
                <span className="text-5xl font-bold text-brand-green">📍 Friend</span><span className="text-5xl font-bold text-white animate-pulse"> Finder</span>
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Real-time friend tracking • Find the last location where your friends were online.
              </p>
            </div>
            {friendLocations.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-green/20 to-emerald-500/20 dark:from-brand-green/30 dark:to-emerald-600/30 rounded-full border border-brand-green/30 shadow-lg">
                <div className="w-2.5 h-2.5 bg-brand-green rounded-full "></div>
                <span className="text-sm font-bold text-brand-green">
                  {friendLocations.length} {friendLocations.length === 1 ? 'friend' : 'friends'} last seen online
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Map Container */}
      <main className="flex-1 relative p-4 md:p-6">
        <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl ring-2 ring-brand-green/20 dark:ring-brand-green/10 transition-all duration-500 hover:ring-brand-green/40 hover:shadow-3xl hover:-translate-y-1">
          {/* Shimmer Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 bg-[length:200%_100%] animate-shimmer"></div>
          )}

          <MapContainer
            center={center}
            zoom={16.5}
            className="w-full h-full"
            maxBounds={bounds}
            maxBoundsViscosity={1.0}
            zoomControl={false}
            style={{ background: isDarkMode ? '#111' : '#f9fafb' }}
          >
            <TileLayer
              key={mapTheme.url}
              url={mapTheme.url}
              attribution={mapTheme.attribution}
              minZoom={15}
              maxZoom={19}
            />

            <GeoJSON
              ref={geoJsonRef}
              data={campusDetailsData as GeoJsonObject}
              pointToLayer={pointToLayer}
              onEachFeature={onEachFeature}
            />

            {friendLocations.map((friend) => (
              <Marker
                key={friend.user_id}
                position={[friend.latitude, friend.longitude]}
                icon={createAvatarIcon(friend.avatar_url || 'https://placehold.co/80x80')}
                eventHandlers={{
                  mouseover: (e) => e.target.openPopup(),
                  mouseout: (e) => e.target.closePopup(),
                }}
              >
                <Popup className="friend-popup">
                  <div className="text-center p-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
                    <img
                      src={friend.avatar_url || 'https://placehold.co/80x80'}
                      alt={friend.full_name}
                      className="w-16 h-16 rounded-full mx-auto mb-2 ring-4 ring-brand-green/30"
                    />
                    <p className="font-bold text-gray-900 dark:text-white">{friend.full_name}</p>
                    <p className="text-sm text-brand-green">@{friend.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Last seen: {new Date(friend.last_seen).toLocaleTimeString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            <FloatingZoomControls />
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/30 dark:border-gray-700/50">
          <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Categories</h3>
          <div className="space-y-1.5 text-xs">
            {['academic', 'hostel', 'food', 'landmark'].map(cat => (
              <div key={cat} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(cat) }}></div>
                <span className="capitalize text-gray-600 dark:text-gray-400">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CampusMapPage;