import React, { useState, useCallback, useEffect } from 'react';
import { mapsSearch, getCoordinatesForPlaces } from '../services/geminiService';
import Spinner from './Spinner';
import ToolHeader from './ToolHeader';
import Alert from './Alert';
import CopyButton from './CopyButton';
import { GroundingChunk, MapsSearchResponse, MapsChunk, WebChunk, PlaceWithCoords } from '../types';
import { LinkIcon } from './icons/Icons';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const MapsSearch: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<MapsSearchResponse | null>(null);
  const [placesWithCoords, setPlacesWithCoords] = useState<PlaceWithCoords[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isFetchingCoords, setIsFetchingCoords] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  useEffect(() => {
    const fetchCoords = async () => {
        if (response?.sources && response.sources.length > 0) {
            setIsFetchingCoords(true);
            const placeTitles = response.sources
                .map(chunk => ('maps' in chunk ? chunk.maps.title : null))
                .filter((title): title is string => title !== null);
            
            if (placeTitles.length > 0) {
                const coords = await getCoordinatesForPlaces(placeTitles);
                setPlacesWithCoords(coords);
            }
            setIsFetchingCoords(false);
        }
    };
    fetchCoords();
  }, [response]);


  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setError("Unable to retrieve your location. Please ensure location services are enabled.");
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setResponse(null);
    setPlacesWithCoords([]);
    setError('');

    try {
      const result = await mapsSearch(prompt, location ?? undefined);
      setResponse(result);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, location]);

  const renderSource = (chunk: GroundingChunk, index: number) => {
    const isMapsChunk = (c: GroundingChunk): c is MapsChunk => 'maps' in c;

    if (isMapsChunk(chunk)) {
      return (
        <a 
          href={chunk.maps.uri} 
          target="_blank" 
          rel="noopener noreferrer" 
          key={index}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md transition-colors"
        >
          <span>{chunk.maps.title}</span>
          <LinkIcon />
        </a>
      );
    }
    const webChunk = chunk as WebChunk;
    return (
      <a href={webChunk.web.uri} target="_blank" rel="noopener noreferrer" key={index}>
        {webChunk.web.title}
      </a>
    );
  };

  const mapCenter: [number, number] = placesWithCoords.length > 0
    ? [placesWithCoords[0].latitude, placesWithCoords[0].longitude]
    : (location ? [location.latitude, location.longitude] : [51.505, -0.09]);

  return (
    <div className="max-w-3xl mx-auto">
      <ToolHeader 
        title="Maps Search"
        description="Ask location-based questions. Your answers are grounded in Google Maps data for accuracy and relevance."
      />

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <label htmlFor="maps-prompt" className="block text-sm font-medium text-gray-300 mb-2">Your Question</label>
        <textarea
          id="maps-prompt"
          rows={3}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., What are the best-rated sushi restaurants near me?"
          disabled={isLoading}
        />
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
                onClick={handleGetLocation}
                disabled={isLocating || isLoading}
                className="w-full sm:w-auto bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
                {isLocating ? 'Getting Location...' : (location ? 'Location Set' : 'Use My Location')}
            </button>
            <button
                onClick={handleSubmit}
                disabled={isLoading || !prompt.trim()}
                className="w-full sm:flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Searching...' : 'Search with Maps'}
            </button>
        </div>
        {location && (
            <p className="text-xs text-gray-400 mt-2 text-center sm:text-left">
                Location active: Lat {location.latitude.toFixed(4)}, Lon {location.longitude.toFixed(4)}
            </p>
        )}

        {error && <Alert message={error} onClose={() => setError('')} />}

        {(isLoading || response) && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-white">Response</h3>
              {response && !isLoading && <CopyButton textToCopy={response.text} />}
            </div>
            <div className="bg-gray-700 p-4 rounded-md min-h-[150px]">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Spinner />
                </div>
              ) : (
                <p className="text-gray-300 whitespace-pre-wrap">{response?.text}</p>
              )}
            </div>
          </div>
        )}
        
        {response?.sources && response.sources.length > 0 && !isLoading && (
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Sources</h3>
                <div className="flex flex-wrap gap-2">
                    {response.sources.map(renderSource)}
                </div>
            </div>
        )}
        
        {(isFetchingCoords || placesWithCoords.length > 0) && !isLoading && (
          <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-2">Map View</h3>
              {isFetchingCoords ? (
                  <div className="flex items-center justify-center h-24 bg-gray-700 rounded-lg">
                      <Spinner size="sm" />
                      <p className="ml-4 text-gray-400">Loading map data...</p>
                  </div>
              ) : (
                <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {placesWithCoords.map((place) => (
                    <Marker key={place.title} position={[place.latitude, place.longitude]}>
                      <Popup>{place.title}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapsSearch;