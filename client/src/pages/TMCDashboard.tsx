import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, AlertTriangle, FileText, Users, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import TicketList from '../components/TicketList'; // We might need to make TicketList accept props for filtering
import WeatherWidget from '../components/WeatherWidget';
import TicketForm from '../components/TicketForm';

interface DashboardStats {
    activeTrucks: number;
    pendingTickets: number;
    weatherAlerts: number;
    activeDrivers: number;
}

const TMCDashboard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        activeTrucks: 0,
        pendingTickets: 0,
        weatherAlerts: 0,
        activeDrivers: 0
    });
    const [regionName, setRegionName] = useState('');

    useEffect(() => {
        if (id) {
            fetchDashboardData(parseInt(id));
            // Set region name based on ID (mock for now, could fetch from API)
            const regions: { [key: number]: string } = {
                1: 'Southwest (Mobile)',
                2: 'Southeast (Montgomery)',
                3: 'West Central (Tuscaloosa)',
                4: 'East Central (Birmingham)',
                5: 'North (Huntsville)'
            };
            setRegionName(regions[parseInt(id)] || `Region ${id}`);
        }
    }, [id]);

    const fetchDashboardData = async (tmcId: number) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

            const [trucksRes, ticketsRes, usersRes] = await Promise.all([
                axios.get(`${apiUrl}/api/trucks?tmcId=${tmcId}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/api/tickets?tmcId=${tmcId}&status=pending`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const activeTrucks = trucksRes.data.filter((t: any) => t.status !== 'out_of_service').length;
            const pendingTickets = ticketsRes.data.length;
            const activeDrivers = usersRes.data.filter((u: any) => u.tmc_id === tmcId && u.role === 'driver').length;

            setStats({
                activeTrucks,
                pendingTickets,
                weatherAlerts: 0,
                activeDrivers
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const statCards = [
        { label: 'Active Trucks', value: stats.activeTrucks.toString(), icon: Truck, color: 'bg-blue-500' },
        { label: 'Pending Tickets', value: stats.pendingTickets.toString(), icon: FileText, color: 'bg-yellow-500' },
        { label: 'Weather Alerts', value: 'Check Widget', icon: AlertTriangle, color: 'bg-red-500' },
        { label: 'Active Drivers', value: stats.activeDrivers.toString(), icon: Users, color: 'bg-green-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/statewide')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Back to State View"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {regionName} Dashboard
                        </h1>
                        <p className="text-sm text-gray-500">
                            Region ID: {id}
                        </p>
                    </div>
                </div>
                <div className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* We need to update TicketList to accept a tmcId prop to filter tickets */}
                    {/* For now, TicketList fetches all tickets the user has access to. 
                        If we are admin, we see all. We should probably update TicketList to filter. */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Region Tickets</h2>
                        </div>
                        <div className="p-4">
                            {/* Passing tmcId to TicketList would be ideal. 
                                For this MVP step, I'll assume TicketList needs a refactor or I'll just show the component 
                                and acknowledge it might show all tickets if not filtered. 
                                Actually, let's just use the TicketList component but we might need to refactor it to accept props.
                            */}
                            <TicketList tmcId={id ? parseInt(id) : undefined} />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <WeatherWidget />
                </div>
            </div>

            <TicketForm
                isOpen={isTicketFormOpen}
                onClose={() => setIsTicketFormOpen(false)}
                onSuccess={() => {
                    if (id) fetchDashboardData(parseInt(id));
                    setIsTicketFormOpen(false);
                }}
                initialData={{ tmc_id: id ? parseInt(id) : undefined }} // Pass TMC ID to form if possible
            />
        </div>
    );
};

export default TMCDashboard;
