import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, AlertTriangle, Map, FileText, Users } from 'lucide-react';
import TicketList from '../components/TicketList';
import WeatherWidget from '../components/WeatherWidget';
import TicketForm from '../components/TicketForm';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);

    // Mock data for MVP
    const stats = [
        { label: 'Active Trucks', value: '4', icon: Truck, color: 'bg-blue-500' },
        { label: 'Pending Tickets', value: '12', icon: FileText, color: 'bg-yellow-500' },
        { label: 'Weather Alerts', value: '2', icon: AlertTriangle, color: 'bg-red-500' },
        { label: 'Active Drivers', value: '8', icon: Users, color: 'bg-green-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                    {user?.tmc_id ? `Region ${user.tmc_id} Dashboard` : 'System Dashboard'}
                </h1>
                <div className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-lg shadow p-5 flex items-center">
                        <div className={`${stat.color} p-3 rounded-full text-white mr-4`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions & Weather */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate('/map')}
                                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <Map className="h-8 w-8 text-blue-500 mb-2" />
                                <span className="text-sm font-medium text-gray-700">View Map</span>
                            </button>
                            <button
                                onClick={() => setIsTicketFormOpen(true)}
                                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <FileText className="h-8 w-8 text-blue-500 mb-2" />
                                <span className="text-sm font-medium text-gray-700">Create Ticket</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                                        <Truck className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Truck TRUCK-N-00{i} dispatched</p>
                                        <p className="text-xs text-gray-500">Assigned to Bridge #100{i} • 15 mins ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <WeatherWidget />
                </div>
            </div>


            {/* Ticket List */}
            <TicketList />

            <TicketForm
                isOpen={isTicketFormOpen}
                onClose={() => setIsTicketFormOpen(false)}
                onSuccess={() => {
                    // Ticket list will update via socket
                    setIsTicketFormOpen(false);
                }}
            />
        </div>
    );
};

export default Dashboard;
