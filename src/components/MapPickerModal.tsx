import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Check, X, Compass, ExternalLink, Layers } from 'lucide-react';

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoordinates: string;
  onSelectCoordinates: (coords: string, addressHint?: string) => void;
}

const SAIPHAI_PRESETS = [
  { name: 'Saiphai Vengpui (Centre)', coords: '24.2415, 92.9350', lat: 24.2415, lng: 92.9350 },
  { name: 'Saiphai Bazar Veng', coords: '24.2432, 92.9378', lat: 24.2432, lng: 92.9378 },
  { name: 'Saiphai Hmar Veng', coords: '24.2460, 92.9395', lat: 24.2460, lng: 92.9395 },
  { name: 'Saiphai Chhim Veng', coords: '24.2389, 92.9312', lat: 24.2389, lng: 92.9312 },
  { name: 'Bilkhawthlir RD Block Rd', coords: '24.2250, 92.9150', lat: 24.2250, lng: 92.9150 },
  { name: 'Vaphai Road Huan Ram Area', coords: '24.2505, 92.9420', lat: 24.2505, lng: 92.9420 },
  { name: 'Tlawng River Bank Field', coords: '24.2350, 92.9280', lat: 24.2350, lng: 92.9280 },
];

export const MapPickerModal: React.FC<MapPickerModalProps> = ({
  isOpen,
  onClose,
  initialCoordinates,
  onSelectCoordinates,
}) => {
  const [lat, setLat] = useState<number>(24.2415);
  const [lng, setLng] = useState<number>(92.9350);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [locating, setLocating] = useState<boolean>(false);
  const [addressHint, setAddressHint] = useState<string>('');

  useEffect(() => {
    if (initialCoordinates && initialCoordinates.includes(',')) {
      const parts = initialCoordinates.split(',').map(s => parseFloat(s.trim()));
      if (!isNaN(parts[0]) && !isNaN(parts[1])) {
        setLat(parts[0]);
        setLng(parts[1]);
      }
    }
  }, [initialCoordinates]);

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setAddressHint('Current Device Location (Saiphai Field)');
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocating(false);
        alert('Could not access device GPS. Please pick a preset or click on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePresetSelect = (preset: typeof SAIPHAI_PRESETS[0]) => {
    setLat(preset.lat);
    setLng(preset.lng);
    setAddressHint(preset.name);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Relative offset calibration centered around current coords
    const deltaLat = ((rect.height / 2 - y) / rect.height) * 0.02;
    const deltaLng = ((x - rect.width / 2) / rect.width) * 0.02;

    const newLat = Number((lat + deltaLat).toFixed(6));
    const newLng = Number((lng + deltaLng).toFixed(6));
    setLat(newLat);
    setLng(newLng);
  };

  const handleConfirm = () => {
    const formatted = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    onSelectCoordinates(formatted, addressHint);
    onClose();
  };

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${lat - 0.006}%2C${lng + 0.008}%2C${lat + 0.006}&layer=${mapType === 'satellite' ? 'mapnik' : 'mapnik'}&marker=${lat}%2C${lng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <MapPin className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Saiphai Land Coordinate Picker</h3>
              <p className="text-xs text-emerald-200">
                Pick accurate GPS boundary point for Village Council Land Pass
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2 block">
              Saiphai Locality Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {SAIPHAI_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                    Math.abs(lat - preset.lat) < 0.0005 && Math.abs(lng - preset.lng) < 0.0005
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-neutral-50 hover:bg-emerald-50 text-neutral-700 border-neutral-200'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Map Visualizer */}
          <div className="relative border-2 border-emerald-200 rounded-xl overflow-hidden shadow-inner h-72 bg-neutral-100">
            <iframe
              title="Saiphai Interactive Location Map"
              src={osmUrl}
              className="w-full h-full border-0 pointer-events-none"
            />

            {/* Clickable Overlay to calibrate pin */}
            <div
              onClick={handleMapClick}
              className="absolute inset-0 cursor-crosshair group flex items-center justify-center bg-black/5"
              title="Click anywhere on the map to place land boundary pin"
            >
              {/* Centered Target Crosshair & Pin */}
              <div className="relative -top-3 flex flex-col items-center pointer-events-none drop-shadow-lg">
                <MapPin className="w-8 h-8 text-rose-600 fill-rose-500 animate-bounce" />
                <span className="text-[10px] font-bold bg-neutral-900/90 text-white px-2 py-0.5 rounded-full shadow-md whitespace-nowrap mt-1">
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </span>
              </div>

              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-xs font-medium text-neutral-700 shadow-xs flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                Click map to reposition pin
              </div>
            </div>

            {/* Floating Map Controls */}
            <div className="absolute bottom-2 right-2 flex gap-1.5 bg-white/90 p-1 rounded-lg shadow-sm border border-neutral-200">
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={locating}
                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md transition shadow-xs"
              >
                <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                {locating ? 'Acquiring GPS...' : 'My Device GPS'}
              </button>
              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-md transition"
                title="View on Google Maps"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Google Maps
              </a>
            </div>
          </div>

          {/* Manual Fine Tuning Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
            <div>
              <label className="text-xs font-semibold text-neutral-600 mb-1 block">
                Latitude (°N)
              </label>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-mono px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
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
                className="w-full text-sm font-mono px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <div className="text-xs text-neutral-500">
            Saiphai VC, Kolasib District, Mizoram (PIN 796091/796101)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-200 rounded-lg transition font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5 shadow-sm"
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
