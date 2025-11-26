import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import L from 'leaflet';
import axios from 'axios';

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Bridge {
    id: string;
    lat: number;
    long: number;
    name: string;
    condition: string;
    yearBuilt?: string;
    facilityCarried?: string;
    featuresDesc?: string;
    location?: string;
    averageDailyTraffic?: string;
    structureLength?: string;
    deckWidth?: string;
    lastInspectionDate?: string;
    owner?: string;
}

const MapComponent: React.FC = () => {
    const [bridges, setBridges] = useState<Bridge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBridges = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                const response = await axios.get(`${apiUrl}/api/bridges`);
                setBridges(response.data);
            } catch (error) {
                console.error('Error fetching bridges:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBridges();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading bridge data...</div>;
    }

    // Center on Alabama roughly
    const position: [number, number] = [32.806671, -86.791130];

    return (
        <MapContainer center={position} zoom={7} style={{ height: '100vh', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MarkerClusterGroup chunkedLoading>
                {bridges.map((bridge) => (
                    <Marker key={bridge.id} position={[bridge.lat, bridge.long]}>
                        <Popup maxWidth={300}>
                            <div className="p-2">
                                <h3 className="font-bold text-lg mb-2">{bridge.name}</h3>

                                <div className="space-y-1 text-sm">
                                    <p><span className="font-semibold">ID:</span> {bridge.id}</p>

                                    <p><span className="font-semibold">Condition:</span> <span className={`font-semibold ${bridge.condition === 'Good' ? 'text-green-600' :
                                        bridge.condition === 'Fair' ? 'text-yellow-600' :
                                            'text-red-600'
                                        }`}>{bridge.condition}</span></p>

                                    {bridge.yearBuilt && <p><span className="font-semibold">Year Built:</span> {bridge.yearBuilt}</p>}

                                    {bridge.facilityCarried && <p><span className="font-semibold">Carries:</span> {bridge.facilityCarried}</p>}

                                    {bridge.featuresDesc && <p><span className="font-semibold">Crosses:</span> {bridge.featuresDesc}</p>}

                                    {bridge.location && <p><span className="font-semibold">Location:</span> {bridge.location}</p>}

                                    {bridge.averageDailyTraffic && <p><span className="font-semibold">Avg Daily Traffic:</span> {parseInt(bridge.averageDailyTraffic).toLocaleString()} vehicles</p>}

                                    {bridge.structureLength && <p><span className="font-semibold">Length:</span> {parseFloat(bridge.structureLength).toFixed(1)} m</p>}

                                    {bridge.deckWidth && <p><span className="font-semibold">Width:</span> {parseFloat(bridge.deckWidth).toFixed(1)} m</p>}

                                    {bridge.lastInspectionDate && <p><span className="font-semibold">Last Inspection:</span> {bridge.lastInspectionDate}</p>}

                                    <p className="text-xs text-gray-600 mt-2">Lat: {bridge.lat.toFixed(6)}, Long: {bridge.long.toFixed(6)}</p>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MarkerClusterGroup>
        </MapContainer>
    );
};

export default MapComponent;
