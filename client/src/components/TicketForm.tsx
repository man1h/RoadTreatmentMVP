import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

interface TicketFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const TicketForm: React.FC<TicketFormProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        priority: 'medium',
        notes: '',
        scheduledTime: ''
    });
    const [trucks, setTrucks] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [selectedTruck, setSelectedTruck] = useState('');
    const [selectedDriver, setSelectedDriver] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchTrucksAndDrivers();
            if (initialData) {
                setFormData({
                    priority: initialData.priority,
                    notes: initialData.notes || '',
                    scheduledTime: initialData.scheduled_time ? new Date(initialData.scheduled_time).toISOString().slice(0, 16) : ''
                });
                setSelectedTruck(initialData.truck_id.toString());
                setSelectedDriver(initialData.assigned_driver_id.toString());
            } else {
                // Set default scheduled time to now
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                setFormData({
                    priority: 'medium',
                    notes: '',
                    scheduledTime: now.toISOString().slice(0, 16)
                });
                setSelectedTruck('');
                setSelectedDriver('');
            }
        }
    }, [isOpen, initialData]);

    const fetchTrucksAndDrivers = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const [trucksRes, usersRes] = await Promise.all([
                axios.get(`${apiUrl}/api/trucks?tmcId=${user?.tmc_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${apiUrl}/api/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            // If editing, include the currently assigned truck even if status is 'assigned'
            const availableTrucks = trucksRes.data.filter((t: any) =>
                t.status === 'available' || (initialData && t.id === initialData.truck_id)
            );
            setTrucks(availableTrucks);
            setDrivers(usersRes.data.filter((u: any) => u.role === 'driver' && u.tmc_id === user?.tmc_id));
        } catch (error) {
            console.error('Error fetching trucks/drivers:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTruck || !selectedDriver) {
            setError('Please select both a truck and a driver');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const payload = {
                tmcId: user?.tmc_id,
                truckId: parseInt(selectedTruck),
                driverId: parseInt(selectedDriver),
                priority: formData.priority,
                scheduledTime: formData.scheduledTime,
                notes: formData.notes,
                bridgeIds: [] // Can be enhanced to select specific bridges
            };

            if (initialData) {
                await axios.put(`${apiUrl}/api/tickets/${initialData.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${apiUrl}/api/tickets`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            setError(error.response?.data?.error || 'Failed to save ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Treatment Ticket" : "Create Treatment Ticket"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Truck</label>
                    <select
                        required
                        value={selectedTruck}
                        onChange={(e) => setSelectedTruck(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    >
                        <option value="">Select a truck...</option>
                        {trucks.map(truck => (
                            <option key={truck.id} value={truck.id}>
                                {truck.truck_number} ({truck.capacity_tons} tons)
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Driver</label>
                    <select
                        required
                        value={selectedDriver}
                        onChange={(e) => setSelectedDriver(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    >
                        <option value="">Select a driver...</option>
                        {drivers.map(driver => (
                            <option key={driver.id} value={driver.id}>
                                {driver.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Scheduled Time</label>
                    <input
                        type="datetime-local"
                        required
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                        placeholder="Optional notes about this treatment..."
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : (initialData ? 'Update Ticket' : 'Create Ticket')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TicketForm;
