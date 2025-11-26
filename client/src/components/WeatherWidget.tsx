import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, CloudRain, Thermometer } from 'lucide-react';

interface WeatherAlert {
    id: string;
    areaDesc: string;
    event: string;
    severity: string;
    description: string;
    effective: string;
    expires: string;
}

const WeatherWidget: React.FC = () => {
    const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Authentication required');
                    setLoading(false);
                    return;
                }

                const response = await axios.get('http://localhost:3000/api/weather/alerts', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAlerts(response.data);
                setError(null);
            } catch (error: any) {
                console.error('Error fetching weather alerts:', error);
                setError(error.response?.data?.error || 'Failed to fetch weather alerts');
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
        // Refresh every 15 minutes
        const interval = setInterval(fetchWeather, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'extreme': return 'bg-red-100 text-red-800 border-red-200';
            case 'severe': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <CloudRain className="h-5 w-5 mr-2 text-blue-500" />
                    Weather Alerts
                </h2>
                <span className="text-xs text-gray-500">Alabama Region</span>
            </div>

            {error ? (
                <div className="text-center py-6 text-red-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">{error}</p>
                </div>
            ) : alerts.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                    <Thermometer className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No active weather alerts</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {alerts.map(alert => (
                        <div key={alert.id} className={`p-3 rounded-md border ${getSeverityColor(alert.severity)}`}>
                            <div className="flex items-start">
                                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-medium text-sm">{alert.event}</h3>
                                    <p className="text-xs mt-1 opacity-90">{alert.areaDesc}</p>
                                    <p className="text-xs mt-1 opacity-75">
                                        Expires: {new Date(alert.expires).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WeatherWidget;
