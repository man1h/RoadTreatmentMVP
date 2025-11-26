import React, { useState } from 'react';
import { X, Package } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface RestockFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const RestockForm: React.FC<RestockFormProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [materialType, setMaterialType] = useState('salt');
    const [quantityTons, setQuantityTons] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3000/api/materials/restock', {
                tmcId: user?.tmc_id,
                materialType,
                quantityTons: parseFloat(quantityTons)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setQuantityTons('');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to restock material');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                                <Package className="h-5 w-5 mr-2 text-blue-500" />
                                Restock Inventory
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Material Type</label>
                                <select
                                    value={materialType}
                                    onChange={(e) => setMaterialType(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    <option value="salt">Rock Salt</option>
                                    <option value="sand">Sand</option>
                                    <option value="brine">Liquid Brine</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Quantity to Add (Tons)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    required
                                    value={quantityTons}
                                    onChange={(e) => setQuantityTons(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="0.0"
                                />
                            </div>

                            <div className="mt-5 sm:mt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Add to Inventory'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestockForm;
