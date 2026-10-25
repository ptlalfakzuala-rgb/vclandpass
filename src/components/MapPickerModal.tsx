import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Check,
  X,
  Compass,
  ExternalLink,
  Search,
  ZoomIn,
  ZoomOut,
  Copy,
  LocateFixed,
  Hand,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Move,
} from 'lucide-react';

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoordinates: string;
  onSelectCoordinates: (coords: string, addressHint?: string) => void;
  villageName?: string;
  districtName?: string;
}

// Major district & geographic centers in Mizoram for quick reference
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
  const [lat, setLat] = useState<number>(23.7271);
  const [lng, setLng] = useState<number>(92.7176);
  const [zoom, setZoom] = useState<number>(16);
  const [mapType, setMapType] = useState<'m' | 'k' | 'h' | 'p'>('h'); // 'h' = Hybrid (Satellite + Labels)
  const [locating, setLocating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addressHint, setAddressHint] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // MOVE TOOL STATES
  const [toolMode, setToolMode] = useState<'pin' | 'move'>('pin'); // 'pin' (click to drop) vs 'move' (drag to pan)
  const [stepSize, setStepSize] = useState<number>(0.0001); // 0.0001 = ~10 meters; 0.00001 = ~1m; 0.0005 = ~50m
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartRef = useRef<{ x: number; y: number; lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (initialCoordinates && initialCoordinates.includes(',')) {
      const parts = initialCoordinates.split(',').map((s) => parseFloat(s.trim()));
      if (!isNaN(parts[0]) && !isNaN(parts[1])) {
        setLat(parts[0]);
        setLng(parts[1]);
      }
    }
  }, [initialCoordinates]);

  // Keyboard arrow shortcuts to move pin
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in search or input fields
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleMove('north');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleMove('south');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleMove('west');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleMove('east');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, stepSize, lat, lng]);

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
        alert('Could not access device GPS. Please search for a place or use the move tool to calibrate.');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // Search location
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

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
        alert(`Location "${query}" not found. Try entering nearby town or district.`);
      }
    } catch {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
    }
  };

  // Click on map when Pin Tool is active
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (toolMode !== 'pin') return;

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

  // DRAG / PAN (Pointer events for Move Tool)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (toolMode === 'move') {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        lat,
        lng,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (toolMode === 'move' && isDragging && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      // Sensitivity factor calibrated for smooth drag movement
      const sensitivity = 0.004 / Math.pow(2, zoom - 15);
      const newLat = Number((dragStartRef.current.lat + (dy / 100) * sensitivity).toFixed(6));
      const newLng = Number((dragStartRef.current.lng - (dx / 100) * sensitivity).toFixed(6));

      setLat(newLat);
      setLng(newLng);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Precision Move / Nudge by Step
  const handleMove = (direction: 'north' | 'south' | 'east' | 'west') => {
    let deltaLat = 0;
    let deltaLng = 0;
    switch (direction) {
      case 'north':
        deltaLat = stepSize;
        break;
      case 'south':
        deltaLat = -stepSize;
        break;
      case 'east':
        deltaLng = stepSize;
        break;
      case 'west':
        deltaLng = -stepSize;
        break;
    }
    setLat((prev) => Number((prev + deltaLat).toFixed(6)));
    setLng((prev) => Number((prev + deltaLng).toFixed(6)));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/75 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900 rounded-xl text-emerald-300">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>Google Maps GPS Location Picker</span>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-mono uppercase">
                  Move &amp; Pin Tools
                </span>
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
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5">
          {/* Top Search & Primary Action Controls */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            {/* Search form */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search locality, village or paste coordinates (e.g. Aizawl, 23.7271, 92.7176)..."
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
                <span>{locating ? 'Locating...' : 'My Device GPS'}</span>
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

          {/* TOOL SELECTOR BAR: PIN TOOL vs MOVE TOOL */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-100 p-2 rounded-xl border border-neutral-300">
            {/* Primary Mode Toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider px-1">
                Active Tool:
              </span>
              <div className="inline-flex bg-white p-0.5 rounded-lg border border-neutral-300 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setToolMode('pin')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
                    toolMode === 'pin'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Click anywhere on map to drop / reposition pin"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Pin Tool (Click to Place)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolMode('move')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
                    toolMode === 'move'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Drag on map to pan / move location in real time"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>Move Tool (Drag / Pan)</span>
                </button>
              </div>
            </div>

            {/* Move Nudge Step Size Selector */}
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-neutral-500 hidden sm:inline">Nudge Step:</span>
              <div className="inline-flex bg-white p-0.5 rounded-lg border border-neutral-300 text-[11px]">
                <button
                  type="button"
                  onClick={() => setStepSize(0.00001)}
                  className={`px-2 py-1 rounded transition ${
                    stepSize === 0.00001 ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-600 hover:text-black'
                  }`}
                  title="1 meter fine movement (~0.00001°)"
                >
                  1m Fine
                </button>
                <button
                  type="button"
                  onClick={() => setStepSize(0.0001)}
                  className={`px-2 py-1 rounded transition ${
                    stepSize === 0.0001 ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-600 hover:text-black'
                  }`}
                  title="10 meters standard movement (~0.0001°)"
                >
                  10m Normal
                </button>
                <button
                  type="button"
                  onClick={() => setStepSize(0.0005)}
                  className={`px-2 py-1 rounded transition ${
                    stepSize === 0.0005 ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-600 hover:text-black'
                  }`}
                  title="50 meters fast movement (~0.0005°)"
                >
                  50m Fast
                </button>
              </div>
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

            {/* Interactive Canvas Overlay (Click to Pin or Drag to Move) */}
            <div
              onClick={handleMapClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`absolute inset-0 select-none ${
                toolMode === 'move'
                  ? isDragging
                    ? 'cursor-grabbing bg-black/10'
                    : 'cursor-grab bg-black/5 hover:bg-black/10'
                  : 'cursor-crosshair bg-black/5 hover:bg-black/10'
              }`}
              title={
                toolMode === 'move'
                  ? 'Drag with mouse or touch to pan/move map location'
                  : 'Click anywhere on map to drop land boundary pin'
              }
            >
              {/* Center Marker Pin with Live Coordinates */}
              <div className="relative -top-3 flex flex-col items-center pointer-events-none drop-shadow-xl select-none">
                <MapPin className="w-9 h-9 text-rose-600 fill-rose-500 animate-bounce" />
                <span className="text-[11px] font-mono font-bold bg-neutral-950 text-white px-2.5 py-0.5 rounded-full shadow-lg whitespace-nowrap mt-1 border border-neutral-700">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </span>
              </div>

              {/* Active Mode Hint Indicator */}
              <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-800 shadow-md flex items-center gap-1.5 border border-neutral-200 pointer-events-none">
                {toolMode === 'move' ? (
                  <>
                    <Move className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                    <span>Move Tool Active: Drag to Pan Map</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Pin Tool Active: Click to Drop Pin</span>
                  </>
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* MOVE TOOL: FLOATING DIRECTIONAL D-PAD (NORTH, SOUTH, EAST, WEST) */}
            {/* ========================================================= */}
            <div className="absolute bottom-2.5 left-2.5 z-20 bg-white/95 backdrop-blur-xs p-1.5 rounded-2xl shadow-xl border border-neutral-300">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">
                  Move Pad
                </span>
                {/* Up / North */}
                <button
                  type="button"
                  onClick={() => handleMove('north')}
                  className="w-8 h-8 bg-neutral-100 hover:bg-emerald-700 hover:text-white rounded-lg flex items-center justify-center text-neutral-800 transition active:scale-95 shadow-xs border border-neutral-200"
                  title="Move North (ArrowUp)"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {/* Left / West */}
                  <button
                    type="button"
                    onClick={() => handleMove('west')}
                    className="w-8 h-8 bg-neutral-100 hover:bg-emerald-700 hover:text-white rounded-lg flex items-center justify-center text-neutral-800 transition active:scale-95 shadow-xs border border-neutral-200"
                    title="Move West (ArrowLeft)"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {/* Center Mode Toggle Icon */}
                  <div
                    onClick={() => setToolMode(toolMode === 'move' ? 'pin' : 'move')}
                    className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-300 flex items-center justify-center cursor-pointer hover:bg-emerald-900 transition shadow-xs text-[10px] font-mono font-bold"
                    title="Click to toggle Pin Tool / Move Tool"
                  >
                    {toolMode === 'move' ? <Hand className="w-4 h-4" /> : <Crosshair className="w-4 h-4" />}
                  </div>

                  {/* Right / East */}
                  <button
                    type="button"
                    onClick={() => handleMove('east')}
                    className="w-8 h-8 bg-neutral-100 hover:bg-emerald-700 hover:text-white rounded-lg flex items-center justify-center text-neutral-800 transition active:scale-95 shadow-xs border border-neutral-200"
                    title="Move East (ArrowRight)"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Down / South */}
                <button
                  type="button"
                  onClick={() => handleMove('south')}
                  className="w-8 h-8 bg-neutral-100 hover:bg-emerald-700 hover:text-white rounded-lg flex items-center justify-center text-neutral-800 transition active:scale-95 shadow-xs border border-neutral-200"
                  title="Move South (ArrowDown)"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Map Layer Mode & Zoom Controls (Floating inside map on Right) */}
            <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-20">
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
                  className="p-1.5 hover:bg-neutral-100 text-neutral-800 rounded-lg transition active:scale-95"
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
                  className="p-1.5 hover:bg-neutral-100 text-neutral-800 rounded-lg transition active:scale-95"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Regional Navigation Presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5 block">
              Quick Geographic Centers (Mizoram)
            </label>
            <div className="flex flex-wrap gap-1.5">
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
                  className={`text-xs px-2.5 py-1 rounded-xl border font-medium transition ${
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

          {/* Precise Manual Inputs & Precision Readouts */}
          <div className="bg-neutral-50 p-3.5 sm:p-4 rounded-2xl border border-neutral-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-emerald-700" />
                Calibrated GPS Coordinates &bull; Keyboard Arrows Enabled
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
        <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
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
