import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Check,
  X,
  Compass,
  ExternalLink,
  Layers,
  Search,
  ZoomIn,
  ZoomOut,
  Copy,
  LocateFixed,
} from 'lucide-react';

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoordinates: string;
  onSelectCoordinates: (coords: string, addressHint?: string) => void;
  villageName?: string;
  districtName?: string;
}

// Major district & geographic centers in Mizoram for quick orientation
const MIZORAM_REFERENCE_CENTERS = [
  { name: 'Aizawl (State Capital)', lat: 23.7271, lng: 92.7176 },
  { name: 'Kolasib District HQ', lat: 24.2250, lng: 92.6780 },
  { name: 'Lunglei District HQ', lat: 22.8833, lng: 92.7333 },
  { name: 'Champhai District HQ', lat: 23.4756, lng: 93.3283 },
  { name: 'Serchhip District HQ', lat: 23.3411, lng: 92.8503 },
  { name: 'Mamit District HQ', lat: 23.9294, lng: 92.4906 },
];

export const MapPickerModal: React.FC<MapPickerModalProps> = ({
  isOpen,
  onClose,
  initialCoordinates,
  onSelectCoordinates,
  villageName,
  districtName,
}) => {
  // Default to Aizawl or provided coordinates
  const [lat, setLat] = useState<number>(23.7271);
  const [lng, setLng] = useState<number>(92.7176);
  const [zoom, setZoom] = useState<number>(15);
  const [mapType, setMapType] = useState<'m' | 'k' | 'h' | 'p'>('h'); // 'h' = Hybrid (Satellite + Labels)
  const [locating, setLocating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addressHint, setAddressHint] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialCoordinates && initialCoordinates.includes(',')) {
      const parts = initialCoordinates.split(',').map((s) => parseFloat(s.trim()));
      if (!isNaN(parts[0]) && !isNaN(parts[1])) {
        setLat(parts[0]);
        setLng(parts[1]);
      }
    }
  }, [initialCoordinates]);

  if (!isOpen) return null;

  // Real device GPS acquisition via HTML5 Geolocation
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        setLat(userLat);
        setLng(userLng);
        setZoom(17);
        setAddressHint(`Device GPS Location (${userLat}, ${userLng})`);
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocating(false);
        alert('Could not access device GPS. Please search for a place or calibrate on the map.');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // Search location via OpenStreetMap / Google Geocoding fallback
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Check if user pasted coordinates (e.g., "23.7271, 92.7176")
    if (query.includes(',')) {
      const parts = query.split(',').map((s) => parseFloat(s.trim()));
      if (!isNaN(parts[0]) && !isNaN(parts[1])) {
        setLat(Number(parts[0].toFixed(6)));
        setLng(Number(parts[1].toFixed(6)));
        setAddressHint(`Coordinates: ${parts[0]}, ${parts[1]}`);
        setZoom(16);
        return;
      }
    }

    try {
      const searchQueryWithRegion = query.toLowerCase().includes('mizoram')
        ? query
        : `${query}, Mizoram, India`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQueryWithRegion
        )}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const foundLat = parseFloat(data[0].lat);
        const foundLng = parseFloat(data[0].lon);
        setLat(Number(foundLat.toFixed(6)));
        setLng(Number(foundLng.toFixed(6)));
        setAddressHint(data[0].display_name.split(',')[0] || query);
        setZoom(16);
      } else {
        alert(`Location "${query}" not found. Try entering nearby town or district name.`);
      }
    } catch {
      // Fallback search link
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calibration factor scaling based on current zoom level
    const scale = 0.005 / Math.pow(2, zoom - 15);
    const deltaLat = ((rect.height / 2 - y) / rect.height) * scale;
    const deltaLng = ((x - rect.width / 2) / rect.width) * scale;

    const newLat = Number((lat + deltaLat).toFixed(6));
    const newLng = Number((lng + deltaLng).toFixed(6));
    setLat(newLat);
    setLng(newLng);
  };

  const handleCopy = () => {
    const coordsStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard?.writeText(coordsStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    const formatted = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    onSelectCoordinates(formatted, addressHint);
    onClose();
  };

  // Google Maps Embed URL
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed&t=${mapType}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900 rounded-xl text-emerald-300">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Google Maps GPS Location Picker
              </h3>
              <p className="text-xs text-emerald-300/90 font-medium">
                {villageName ? `${villageName} Village Council` : 'Village Council'} &bull; Pick Exact Land Boundary Coordinates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Top Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            {/* Search form */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search village, town or enter coordinates (e.g. Kolasib, Aizawl, 23.7271, 92.7176)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-semibold rounded-xl transition"
              >
                Search
              </button>
            </form>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={locating}
                className="flex items-center gap-1.5 text-xs px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition shadow-xs"
                title="Acquire current location from device GPS sensor"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Locating...' : 'My Current GPS'}</span>
              </button>

              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium rounded-xl border border-neutral-300 transition"
                title="Open coordinates directly in Google Maps"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Google Maps</span>
              </a>
            </div>
          </div>

          {/* Interactive Google Map Visualizer */}
          <div className="relative border-2 border-emerald-900/30 rounded-2xl overflow-hidden shadow-lg h-80 sm:h-96 bg-neutral-100">
            {/* Google Maps Embed iframe */}
            <iframe
              title="Google Maps Interactive Location Picker"
              src={googleMapEmbedUrl}
              className="w-full h-full border-0 pointer-events-none"
              loading="lazy"
            />

            {/* Clickable Overlay to calibrate pin on click */}
            <div
              onClick={handleMapClick}
              className="absolute inset-0 cursor-crosshair flex items-center justify-center bg-black/5"
              title="Click anywhere on the map to place/reposition land boundary pin"
            >
              {/* Center Marker Pin with Live Coordinates */}
              <div className="relative -top-3 flex flex-col items-center pointer-events-none drop-shadow-xl select-none">
                <MapPin className="w-9 h-9 text-rose-600 fill-rose-500 animate-bounce" />
                <span className="text-[11px] font-mono font-bold bg-neutral-950 text-white px-2.5 py-0.5 rounded-full shadow-lg whitespace-nowrap mt-1 border border-neutral-700">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </span>
              </div>

              {/* Top Hint Badge */}
              <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-800 shadow-md flex items-center gap-1.5 border border-neutral-200 pointer-events-none">
                <Compass className="w-3.5 h-3.5 text-emerald-700" />
                <span>Click map to reposition pin</span>
              </div>
            </div>

            {/* Map Layer Mode & Zoom Controls (Floating inside map) */}
            <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
              {/* Map Type Switcher */}
              <div className="bg-white/95 backdrop-blur-xs p-1 rounded-xl shadow-md border border-neutral-200 flex flex-col gap-1 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setMapType('h')}
                  className={`px-2.5 py-1 rounded-lg transition text-left ${
                    mapType === 'h' ? 'bg-emerald-700 text-white' : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                  title="Satellite imagery with road names"
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapType('m')}
                  className={`px-2.5 py-1 rounded-lg transition text-left ${
                    mapType === 'm' ? 'bg-emerald-700 text-white' : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                  title="Standard roadmap"
                >
                  Roadmap
                </button>
                <button
                  type="button"
                  onClick={() => setMapType('p')}
                  className={`px-2.5 py-1 rounded-lg transition text-left ${
                    mapType === 'p' ? 'bg-emerald-700 text-white' : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                  title="Terrain with elevation"
                >
                  Terrain
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="bg-white/95 backdrop-blur-xs p-1 rounded-xl shadow-md border border-neutral-200 flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(z + 1, 20))}
                  className="p-1.5 hover:bg-neutral-100 text-neutral-800 rounded-lg transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono font-bold text-neutral-600 px-1">
                  z{zoom}
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(z - 1, 5))}
                  className="p-1.5 hover:bg-neutral-100 text-neutral-800 rounded-lg transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Regional Navigation Presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2 block">
              Quick Geographic Centers (Mizoram)
            </label>
            <div className="flex flex-wrap gap-2">
              {MIZORAM_REFERENCE_CENTERS.map((center) => (
                <button
                  key={center.name}
                  type="button"
                  onClick={() => {
                    setLat(center.lat);
                    setLng(center.lng);
                    setAddressHint(center.name);
                    setZoom(15);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition ${
                    Math.abs(lat - center.lat) < 0.005 && Math.abs(lng - center.lng) < 0.005
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                  }`}
                >
                  {center.name}
                </button>
              ))}
            </div>
          </div>

          {/* Precise Manual Inputs */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Calibrated GPS Coordinates
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-emerald-800 hover:text-emerald-900 font-semibold flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Coordinates'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-600 mb-1 block">
                  Latitude (°N)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-mono px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600 mb-1 block">
                  Longitude (°E)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-mono px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-neutral-500 font-medium text-center sm:text-left">
            {villageName ? `${villageName} Village Council` : 'Village Council Court'} {districtName ? `&bull; ${districtName}` : ''}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm text-neutral-700 hover:bg-neutral-200 rounded-xl transition font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              Apply Coordinates ({lat.toFixed(4)}, {lng.toFixed(4)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
