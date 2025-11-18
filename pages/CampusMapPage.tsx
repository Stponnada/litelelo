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
import { Link } from 'react-router-dom';
import { MapIcon, PlusIcon, UserGroupIcon } from '../components/icons'; // Reusing PlusIcon for zoom

// --- Types ---
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

// --- Map Themes ---
const lightTheme = {
  url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
};

const darkTheme = {
  url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
};

// --- Icons ---
const MinusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
);

const LayersIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
);

// --- Components ---

// Custom Zoom Controls
const MapControls: React.FC<{ onToggleLegend: () => void; isLegendOpen: boolean }> = ({ onToggleLegend, isLegendOpen }) => {
  const map = useMap();
  return (
    <div className="absolute right-4 bottom-24 md:bottom-8 z-[400] flex flex-col gap-3">
      <div className="flex flex-col bg-secondary-light/90 dark:bg-secondary/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/10 overflow-hidden">
        <button
          onClick={() => map.zoomIn()}
          className="p-3 hover:bg-brand-green/20 transition-colors text-text-main-light dark:text-text-main border-b border-tertiary-light/50 dark:border-white/5"
          aria-label="Zoom In"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
        <button
          onClick={() => map.zoomOut()}
          className="p-3 hover:bg-brand-green/20 transition-colors text-text-main-light dark:text-text-main"
          aria-label="Zoom Out"
        >
          <MinusIcon className="w-6 h-6" />
        </button>
      </div>

      <button
        onClick={onToggleLegend}
        className={`p-3 rounded-2xl shadow-xl border backdrop-blur-xl transition-all duration-200 ${
            isLegendOpen 
            ? 'bg-brand-green text-black border-brand-green' 
            : 'bg-secondary-light/90 dark:bg-secondary/90 text-text-main-light dark:text-text-main border-white/20 dark:border-white/10 hover:bg-brand-green/10'
        }`}
      >
        <LayersIcon className="w-6 h-6" />
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
  const [isLegendOpen, setIsLegendOpen] = useState(true); // Open by default on desktop
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

  // Geolocation tracking
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
    const id = setInterval(updateLocation, 30000); // Update every 30s
    return () => clearInterval(id);
  }, [profile]);

  // Style GeoJSON layers
  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      academic: '#3b82f6', hostel: '#8b5cf6', food: '#f97316',
      landmark: '#10b981', recreation: '#eab308', sports: '#ef4444',
      admin: '#64748b', service: '#06b6d4'
    };
    return colors[cat] || '#9ca3af';
  };

  const pointToLayer = (feature: GeoJSON.Feature, latlng: L.LatLng) => {
    const color = getCategoryColor(feature.properties?.category || '');
    return L.circleMarker(latlng, {
      radius: 6,
      fillColor: color,
      color: isDarkMode ? '#0f172a' : '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 1,
    });
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    if (feature.properties?.name) {
      const color = getCategoryColor(feature.properties.category);
      // Custom HTML for Popup
      const popupContent = `
        <div class="font-sans text-center min-w-[150px]">
          <span class="inline-block px-2 py-1 rounded text-[10px] font-bold uppercase text-white mb-2" style="background-color: ${color}">
            ${feature.properties.category}
          </span>
          <h3 class="text-base font-bold text-gray-900 dark:text-white mb-1">${feature.properties.name}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">${feature.properties.description || ''}</p>
        </div>
      `;
      layer.bindPopup(popupContent, { className: isDarkMode ? 'dark-popup' : '' });
    }
  };

  const createAvatarIcon = (url: string) => {
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center w-12 h-12">
           <span class="absolute w-full h-full rounded-full bg-brand-green/30 animate-ping"></span>
           <img src="${url}" class="relative w-10 h-10 rounded-full border-2 border-brand-green object-cover shadow-lg z-10 bg-gray-800" />
        </div>
      `,
      className: 'bg-transparent',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -24],
    });
  };

  if (!userCampus || !campusCoordinates[userCampus]) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] animate-pulse">
        <MapIcon className="w-16 h-16 text-tertiary-light dark:text-tertiary mb-4" />
        <p className="text-text-secondary-light dark:text-text-secondary font-medium">Loading map data...</p>
      </div>
    );
  }

  const center = campusCoordinates[userCampus];

  return (
    // Container logic: Fill remaining height, respect header/nav
    <div className="relative w-full h-[calc(100vh-6rem)] md:h-[calc(100vh-6rem)] rounded-3xl overflow-hidden shadow-2xl border border-tertiary-light dark:border-white/5">
      
      {/* --- Floating Header (Glass) --- */}
      <div className="absolute top-4 left-4 right-4 md:right-auto z-[400]">
        <div className="bg-secondary-light/90 dark:bg-[#0B101B]/90 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4 rounded-2xl shadow-lg flex items-center justify-between md:justify-start gap-4">
           <div>
              <h1 className="text-xl font-black text-text-main-light dark:text-text-main flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-brand-green" />
                Friend Finder
              </h1>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary">
                {userCampus} Campus • Live
              </p>
           </div>
           {friendLocations.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-green/10 text-brand-green rounded-full border border-brand-green/20">
                 <UserGroupIcon className="w-4 h-4" />
                 <span className="text-xs font-bold">{friendLocations.length} Online</span>
              </div>
           )}
        </div>
      </div>

      {/* --- Legend (Collapsible) --- */}
      <div className={`absolute top-24 left-4 z-[400] transition-all duration-300 ${isLegendOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
        <div className="bg-secondary-light/90 dark:bg-[#0B101B]/90 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4 rounded-2xl shadow-lg w-48">
            <h3 className="text-xs font-bold text-text-tertiary-light dark:text-text-tertiary uppercase tracking-wider mb-3">Map Legend</h3>
            <div className="space-y-2">
                {['academic', 'hostel', 'food', 'recreation', 'sports', 'landmark'].map(cat => (
                    <div key={cat} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: getCategoryColor(cat) }}></span>
                        <span className="text-xs font-medium text-text-main-light dark:text-text-main capitalize">{cat}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* --- The Map --- */}
      <MapContainer
        center={center}
        zoom={16}
        className="w-full h-full z-0"
        zoomControl={false} // We use custom controls
        style={{ background: isDarkMode ? '#111' : '#f1f5f9' }}
      >
        <TileLayer
          key={isDarkMode ? 'dark' : 'light'}
          url={isDarkMode ? darkTheme.url : lightTheme.url}
          attribution={isDarkMode ? darkTheme.attribution : lightTheme.attribution}
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
            icon={createAvatarIcon(friend.avatar_url || 'https://ui-avatars.com/api/?background=random')}
          >
            <Popup className="custom-popup-clean" closeButton={false}>
               <div className="text-center p-1 min-w-[120px]">
                  <Link to={`/profile/${friend.username}`} className="block">
                     <img 
                        src={friend.avatar_url} 
                        className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-brand-green object-cover"
                        alt={friend.username}
                     />
                     <p className="font-bold text-sm text-gray-900">{friend.full_name}</p>
                     <p className="text-xs text-brand-green font-medium">@{friend.username}</p>
                     <p className="text-[10px] text-gray-500 mt-1">
                       Seen {new Date(friend.last_seen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </p>
                  </Link>
               </div>
            </Popup>
          </Marker>
        ))}

        <MapControls 
            isLegendOpen={isLegendOpen} 
            onToggleLegend={() => setIsLegendOpen(prev => !prev)} 
        />
      </MapContainer>

      {/* Global Style overrides for Leaflet Popups to match theme */}
      <style>{`
        .leaflet-popup-content-wrapper {
            background: ${isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
            backdrop-filter: blur(12px);
            border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
            border-radius: 1rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            color: ${isDarkMode ? '#fff' : '#0f172a'};
        }
        .leaflet-popup-tip {
            background: ${isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
        }
        .dark-popup .leaflet-popup-content {
             color: white;
        }
      `}</style>
    </div>
  );
};

export default CampusMapPage;