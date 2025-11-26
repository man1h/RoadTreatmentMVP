import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Truck, Wrench, CheckCircle, Trash2 } from 'lucide-react';
import axios from 'axios';
import TruckForm from '../components/TruckForm';
import { useSocket } from '../context/SocketContext';

const FleetManagement: React.FC = () => {
    const { user } = useAuth();
    const [trucks, setTrucks] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { socket } = useSocket();

    useEffect(() => {
        if (user) {
            fetchTrucks();
        }
    }, [user]);

    useEffect(() => {
        if (!socket) return;

        socket.on('truck_created', (newTruck: any) => {
            setTrucks(prev => [newTruck, ...prev]);
        });

        socket.on('truck_updated', (updatedTruck: any) => {
            setTrucks(prev => prev.map(t => t.id === updatedTruck.id ? updatedTruck : t));
        });

        socket.on('truck_deleted', ({ id }: { id: number }) => {
            setTrucks(prev => prev.filter(t => t.id !== id));
        });

        return () => {
            socket.off('truck_created');
            socket.off('truck_updated');
        };
    }, [socket]);

    const fetchTrucks = async () => {
        if (!user?.tmc_id) return;
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:3000/api/trucks?tmcId=${user.tmc_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (Array.isArray(response.data)) {
                setTrucks(response.data);
            } else {
                console.error('Expected array of trucks but got:', response.data);
                setTrucks([]);
            }
        } catch (error) {
            console.error('Error fetching trucks:', error);
            setTrucks([]);
        }
    };

    const deleteTruck = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this truck?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/api/trucks/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Socket will handle the update
        } catch (error) {
            console.error('Error deleting truck:', error);
            alert('Failed to delete truck');
        }
    };

    const toggleStatus = async (truck: any) => {
        const newStatus = truck.status === 'available' ? 'maintenance' : 'available';
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:3000/api/trucks/${truck.id}`,
                { status: newStatus, capacityTons: truck.capacity_tons },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Socket will handle the update
        } catch (error) {
            console.error('Error updating truck status:', error);
            alert('Failed to update truck status');
        }
    };

    const getStatusCounts = () => {
        if (!Array.isArray(trucks)) return { available: 0, in_service: 0, maintenance: 0 };
        return {
            available: trucks.filter(t => t.status === 'available').length,
            in_service: trucks.filter(t => t.status === 'in_service').length,
            maintenance: trucks.filter(t => t.status === 'maintenance').length
        };
    };

    const counts = getStatusCounts();

    const getStatusBadge = (status: string) => {
        const badges = {
            available: 'bg-green-100 text-green-800',
            in_service: 'bg-blue-100 text-blue-800',
            maintenance: 'bg-orange-100 text-orange-800'
        };
        return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Add Truck
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center">
                        <div className="bg-green-100 p-3 rounded-full text-green-600 mr-4">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Available</p>
                            <p className="text-2xl font-bold text-gray-900">{counts.available}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600 mr-4">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">In Service</p>
                            <p className="text-2xl font-bold text-gray-900">{counts.in_service}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center">
                        <div className="bg-orange-100 p-3 rounded-full text-orange-600 mr-4">
                            <Wrench className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Maintenance</p>
                            <p className="text-2xl font-bold text-gray-900">{counts.maintenance}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Fleet List - TMC Region {user?.tmc_id}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Truck Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {trucks.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                        No trucks found. Add your first truck to get started.
                                    </td>
                                </tr>
                            ) : (
                                trucks.map(truck => (
                                    <tr key={truck.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            {truck.truck_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(truck.status)}`}>
                                                {truck.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {truck.capacity_tons} tons
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => toggleStatus(truck)}
                                                className={`text-sm ${truck.status === 'available' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                                                title={truck.status === 'available' ? 'Mark Out of Service' : 'Mark Available'}
                                            >
                                                {truck.status === 'available' ? <Wrench className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                                            </button>
                                            <button
                                                onClick={() => deleteTruck(truck.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete Truck"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <TruckForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={fetchTrucks}
            />
        </div>
    );
};

export default FleetManagement;
