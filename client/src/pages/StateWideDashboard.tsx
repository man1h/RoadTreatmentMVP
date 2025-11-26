import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, AlertCircle, Settings } from 'lucide-react';

interface TMCStats {
    id: number;
    name: string;
    region: string;
    trucks: { available: number; in_service: number; maintenance: number };
    tickets: { pending: number; active: number; completed: number };
    materials: { [key: string]: number };
}

interface TMCPreference {
    tmc_id: number;
    is_monitoring: boolean;
    name: string;
    region: string;
}

const StateWideDashboard: React.FC = () => {
    const [tmcStats, setTmcStats] = useState<TMCStats[]>([]);
    const [totals, setTotals] = useState({ trucks: 0, tickets: 0 });
    const [preferences, setPreferences] = useState<TMCPreference[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        fetchPreferences();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await axios.get(`${apiUrl}/api/dashboard/statewide`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTmcStats(response.data.tmcStats);
            setTotals(response.data.totals);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    const fetchPreferences = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await axios.get(`${apiUrl}/api/preferences/tmc`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPreferences(response.data);
        } catch (error) {
            console.error('Error fetching preferences:', error);
        }
    };

    const toggleTMCMonitoring = async (tmcId: number, currentState: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await axios.put(
                `${apiUrl}/api/preferences/tmc/${tmcId}`,
                { isMonitoring: !currentState },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchPreferences();
            await fetchDashboardData();
        } catch (error) {
            console.error('Error updating preference:', error);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">State-Wide Overview</h1>
                    <p className="text-sm text-gray-500">Alabama Department of Transportation - All Regions</p>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Regions
                </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">TMC Monitoring Preferences</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Toggle regions on/off to customize your monitoring view
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {preferences.map(pref => (
                            <div key={pref.tmc_id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{pref.name}</p>
                                    <p className="text-sm text-gray-500">{pref.region}</p>
                                </div>
                                <button
                                    onClick={() => toggleTMCMonitoring(pref.tmc_id, pref.is_monitoring)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pref.is_monitoring ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pref.is_monitoring ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* State-Wide Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Active Trucks</p>
                            <p className="text-4xl font-bold mt-2">{totals.trucks}</p>
                            <p className="text-blue-100 text-sm mt-1">Across {tmcStats.length} regions</p>
                        </div>
                        <BarChart3 className="h-12 w-12 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Active Tickets</p>
                            <p className="text-4xl font-bold mt-2">{totals.tickets}</p>
                            <p className="text-orange-100 text-sm mt-1">Pending & in progress</p>
                        </div>
                        <TrendingUp className="h-12 w-12 text-orange-200" />
                    </div>
                </div>
            </div>

            {/* Regional Breakdown */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Regional Breakdown</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {tmcStats.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p>No regions selected for monitoring</p>
                            <p className="text-sm mt-1">Click "Configure Regions" to select TMCs to monitor</p>
                        </div>
                    ) : (
                        tmcStats.map(tmc => (
                            <div key={tmc.id} className="p-6 hover:bg-gray-50">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">
                                            <a href={`/dashboard/tmc/${tmc.id}`} className="hover:text-blue-600 hover:underline">
                                                {tmc.name}
                                            </a>
                                        </h3>
                                        <p className="text-sm text-gray-500">{tmc.region}</p>
                                    </div>
                                    <a
                                        href={`/dashboard/tmc/${tmc.id}`}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        View Details &rarr;
                                    </a>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Trucks</p>
                                        <div className="mt-1 space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Available:</span>
                                                <span className="font-medium text-green-600">{tmc.trucks.available || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">In Service:</span>
                                                <span className="font-medium text-blue-600">{tmc.trucks.in_service || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Maintenance:</span>
                                                <span className="font-medium text-orange-600">{tmc.trucks.maintenance || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Tickets</p>
                                        <div className="mt-1 space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Pending:</span>
                                                <span className="font-medium">{tmc.tickets.pending || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Active:</span>
                                                <span className="font-medium">{tmc.tickets.active || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Completed:</span>
                                                <span className="font-medium text-green-600">{tmc.tickets.completed || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Materials (tons)</p>
                                        <div className="mt-1 space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Salt:</span>
                                                <span className="font-medium">{tmc.materials.salt || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Sand:</span>
                                                <span className="font-medium">{tmc.materials.sand || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Brine:</span>
                                                <span className="font-medium">{tmc.materials.brine || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default StateWideDashboard;
