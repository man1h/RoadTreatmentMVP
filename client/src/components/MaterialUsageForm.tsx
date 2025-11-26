import React, { useState } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

interface MaterialUsageFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const MaterialUsageForm: React.FC<MaterialUsageFormProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        tmcId: user?.tmc_id || 1,
        materialType: 'salt',
        quantityTons: 1.0
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
                'http://localhost:3000/api/materials/usage',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onSuccess();
            onClose();
            setFormData({ tmcId: user?.tmc_id || 1, materialType: 'salt', quantityTons: 1.0 });
        } catch (error: any) {
            setError(error.response?.data?.error || 'Failed to record usage');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Record Material Usage">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Material Type</label>
                    <select
                        value={formData.materialType}
                        onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    >
                        <option value="salt">Rock Salt</option>
                        <option value="sand">Sand</option>
                        <option value="brine">Liquid Brine</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity Used (tons)</label>
                    <input
                        type="number"
                        required
                        step="0.1"
                        min="0.1"
                        value={formData.quantityTons}
                        onChange={(e) => setFormData({ ...formData, quantityTons: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                    />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-blue-800">
                        This will deduct the specified quantity from your TMC's inventory.
                    </p>
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
                        {loading ? 'Recording...' : 'Record Usage'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default MaterialUsageForm;
