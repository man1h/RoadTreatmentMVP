import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';

interface UserFormProps {
    isOpen: boolean;
    onClose: () => void;
    user?: any;
    onSuccess: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ isOpen, onClose, user, onSuccess }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'driver',
        tmcId: 1,
        name: '',
        phone: ''
    });
    const [tmcs, setTmcs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTMCs();
        if (user) {
            setFormData({
                email: user.email || '',
                password: '',
                role: user.role || 'driver',
                tmcId: user.tmc_id || 1,
                name: user.name || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    const fetchTMCs = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await axios.get(`${apiUrl}/api/tmc`);
            setTmcs(response.data);
        } catch (error) {
            console.error('Error fetching TMCs:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

            if (user) {
                // Update existing user
                await axios.put(
                    `${apiUrl}/api/users/${user.id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                // Create new user
                await axios.post(
                    `${apiUrl}/api/users`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            setError(error.response?.data?.error || 'Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Add New User'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    />
                </div>

                {!user && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            required={!user}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    >
                        <option value="admin">Admin</option>
                        <option value="dispatcher">Dispatcher</option>
                        <option value="driver">Driver</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">TMC Region</label>
                    <select
                        value={formData.tmcId}
                        onChange={(e) => setFormData({ ...formData, tmcId: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    >
                        {tmcs.map(tmc => (
                            <option key={tmc.id} value={tmc.id}>{tmc.name}</option>
                        ))}
                    </select>
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
                        {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default UserForm;
