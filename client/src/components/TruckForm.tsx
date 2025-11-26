import React, { useState } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

interface TruckFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const TruckForm: React.FC<TruckFormProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        truckNumber: '',
        tmcId: user?.tmc_id || 1,
        capacityTons: 5.0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:3000/api/trucks',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onSuccess();
            onClose();
            setFormData({ truckNumber: '', tmcId: user?.tmc_id || 1, capacityTons: 5.0 });
        } catch (error: any) {
            setError(error.response?.data?.error || 'Failed to add truck');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Truck">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Truck Number</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g., TRUCK-N-003"
                        value={formData.truckNumber}
                        onChange={(e) => setFormData({ ...formData, truckNumber: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Capacity (tons)</label>
                    <input
                        type="number"
                        required
                        step="0.5"
                        min="1"
                        max="20"
                        value={formData.capacityTons}
                        onChange={(e) => setFormData({ ...formData, capacityTons: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
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
                        {loading ? 'Adding...' : 'Add Truck'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TruckForm;
