import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, CheckCircle, Navigation, Camera } from 'lucide-react';

const DriverView: React.FC = () => {
    const { user } = useAuth();
    const [activeTicket, setActiveTicket] = useState<any>({
        id: 1,
        ticket_number: 'TICKET-20231123-1234',
        bridge_id: '008845',
        location: 'I-65 NB over Tennessee River',
        status: 'assigned'
    });

    const handleStatusUpdate = (newStatus: string) => {
        setActiveTicket({ ...activeTicket, status: newStatus });
    };

    return (
        <div className="pb-20">
            <div className="bg-blue-800 text-white p-4 sticky top-0 z-10 shadow-md">
                <h1 className="text-xl font-bold">Driver Portal</h1>
                <p className="text-blue-200 text-sm">Welcome, {user?.name}</p>
            </div>

            <div className="p-4 space-y-6">
                {/* Active Assignment Card */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100">
                    <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center">
                        <span className="font-bold text-blue-800">Current Assignment</span>
                        <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full uppercase font-bold">
                            {activeTicket.status}
                        </span>
                    </div>

                    <div className="p-5">
                        <div className="mb-6">
                            <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Target Bridge</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{activeTicket.bridge_id}</p>
                            <p className="text-gray-600 mt-1 flex items-center">
                                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                {activeTicket.location}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button className="flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-sm transition-colors">
                                <Navigation className="h-8 w-8 mb-2" />
                                <span className="font-bold">Navigate</span>
                            </button>

                            <button className="flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 p-4 rounded-xl shadow-sm transition-colors">
                                <Camera className="h-8 w-8 mb-2" />
                                <span className="font-bold">Photo</span>
                            </button>
                        </div>

                        {/* Big Action Button */}
                        {activeTicket.status === 'assigned' ? (
                            <button
                                onClick={() => handleStatusUpdate('in_progress')}
                                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4 rounded-xl shadow-md flex items-center justify-center"
                            >
                                Start Treatment
                            </button>
                        ) : activeTicket.status === 'in_progress' ? (
                            <button
                                onClick={() => handleStatusUpdate('completed')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-4 rounded-xl shadow-md flex items-center justify-center"
                            >
                                <CheckCircle className="h-6 w-6 mr-2" />
                                Complete Job
                            </button>
                        ) : (
                            <div className="text-center p-4 bg-green-50 text-green-700 rounded-xl font-medium">
                                Assignment Completed
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent History */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Recent History</h3>
                    <div className="bg-white rounded-xl shadow p-4 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <div>
                                <p className="font-medium text-gray-900">Bridge #001234</p>
                                <p className="text-xs text-gray-500">Today, 09:30 AM</p>
                            </div>
                            <span className="text-green-600 text-sm font-bold">Completed</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-900">Bridge #005678</p>
                                <p className="text-xs text-gray-500">Yesterday, 04:15 PM</p>
                            </div>
                            <span className="text-green-600 text-sm font-bold">Completed</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverView;
