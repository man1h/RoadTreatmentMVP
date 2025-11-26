import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import { Calendar, Activity, Truck } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for missing marker icons
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
    name: string;
    lat: number;
    lng: number;
    status: 'treated' | 'needs_treatment' | 'in_progress';
    last_treated?: string;
    condition_rating?: string;
}

const PublicMap: React.FC = () => {
    const [bridges, setBridges] = useState<Bridge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBridges = async () => {
            try {
                // In a real app, this would hit the public API endpoint
                // For MVP, we'll use the same endpoint but filter/transform if needed
                const response = await axios.get('http://localhost:3000/api/public/bridges');
                setBridges(response.data);
            } catch (error) {
                console.error('Error fetching bridge data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBridges();

        // Poll for updates every 30 seconds
        const interval = setInterval(fetchBridges, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'treated': return 'text-green-600';
            case 'in_progress': return 'text-blue-600';
            case 'needs_treatment': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'treated': return 'Treated';
            case 'in_progress': return 'Treatment In Progress';
            case 'needs_treatment': return 'Needs Treatment';
            default: return 'Unknown';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading bridge data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full absolute inset-0">
            <MapContainer
                center={[32.806671, -86.791130]} // Center of Alabama
                zoom={7}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {bridges.map((bridge) => (
                    <Marker
                        key={bridge.id}
                        position={[bridge.lat, bridge.lng]}
                    >
                        <Popup className="bridge-popup">
                            <div className="p-2 min-w-[250px]">
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{bridge.name}</h3>
                                <p className="text-xs text-gray-500 mb-3">ID: {bridge.id}</p>

                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <Activity className={`h-4 w-4 mr-2 ${getStatusColor(bridge.status)}`} />
                                        <span className={`font-medium ${getStatusColor(bridge.status)}`}>
                                            {getStatusLabel(bridge.status)}
                                        </span>
                                    </div>

                                    {bridge.last_treated && (
                                        <div className="flex items-center text-gray-700">
                                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                            <span className="text-sm">
                                                Last Treated: {new Date(bridge.last_treated).toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    {bridge.status === 'in_progress' && (
                                        <div className="flex items-center text-blue-600 bg-blue-50 p-2 rounded-md mt-2">
                                            <Truck className="h-4 w-4 mr-2" />
                                            <span className="text-sm font-medium">Crew currently on site</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Legend Overlay */}
            <div className="absolute bottom-8 left-8 bg-white p-4 rounded-lg shadow-lg z-[1000] border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-2">Treatment Status</h4>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-gray-700">Treated</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        <span className="text-sm text-gray-700">In Progress</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-sm text-gray-700">Needs Treatment</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicMap;
