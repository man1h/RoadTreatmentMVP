import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, TrendingDown, AlertCircle, Plus, Edit2 } from 'lucide-react';
import axios from 'axios';
import MaterialUsageForm from '../components/MaterialUsageForm';
import RestockForm from '../components/RestockForm';
import EditMaterialModal from '../components/EditMaterialModal';
import { useSocket } from '../context/SocketContext';

const Materials: React.FC = () => {
    const { user } = useAuth();
    const [materials, setMaterials] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isRestockOpen, setIsRestockOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<any>(null);
    const { socket } = useSocket();

    useEffect(() => {
        fetchMaterials();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('material_updated', (updatedMaterial: any) => {
            setMaterials(prev => prev.map(m =>
                m.id === updatedMaterial.id ? updatedMaterial : m
            ));
        });

        return () => {
            socket.off('material_updated');
        };
    }, [socket]);

    const fetchMaterials = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:3000/api/materials/inventory?tmcId=${user?.tmc_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMaterials(response.data);
        } catch (error) {
            console.error('Error fetching materials:', error);
        }
    };

    const getMaterialName = (type: string) => {
        const names: any = {
            salt: 'Rock Salt',
            sand: 'Sand',
            brine: 'Liquid Brine'
        };
        return names[type] || type;
    };

    const getStatusColor = (quantity: number, threshold: number) => {
        return quantity > threshold ? 'text-green-600 bg-green-100' : 'text-orange-600 bg-orange-100';
    };

    const getThreshold = (type: string) => {
        const thresholds: any = {
            salt: 50,
            sand: 30,
            brine: 100
        };
        return thresholds[type] || 50;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Material Inventory</h1>
                <div className="space-x-3">
                    <button
                        onClick={() => setIsRestockOpen(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center inline-flex"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Restock Inventory
                    </button>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Record Usage
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">TMC Region {user?.tmc_id} - Current Stock</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {materials.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            No inventory data available.
                        </div>
                    ) : (
                        materials.map((material) => {
                            const threshold = getThreshold(material.material_type);
                            const status = material.quantity_tons > threshold ? 'good' : 'low';

                            return (
                                <div key={material.id} className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Package className="h-8 w-8 text-gray-400 mr-4" />
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {getMaterialName(material.material_type)}
                                                </h3>
                                                <p className="text-sm text-gray-500">Threshold: {threshold} tons</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <div className="text-2xl font-bold text-gray-900">
                                                    {material.quantity_tons} tons
                                                </div>
                                                <button
                                                    onClick={() => setEditingMaterial(material)}
                                                    className="text-gray-400 hover:text-blue-600"
                                                    title="Adjust Quantity"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(material.quantity_tons, threshold)}`}>
                                                {status === 'good' ? (
                                                    <>
                                                        <TrendingDown className="h-3 w-3 mr-1" />
                                                        Good Stock
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                        Low Stock
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <MaterialUsageForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={fetchMaterials}
            />

            <RestockForm
                isOpen={isRestockOpen}
                onClose={() => setIsRestockOpen(false)}
                onSuccess={fetchMaterials}
            />

            <EditMaterialModal
                isOpen={!!editingMaterial}
                onClose={() => setEditingMaterial(null)}
                onSuccess={fetchMaterials}
                material={editingMaterial}
            />
        </div>
    );
};

export default Materials;
