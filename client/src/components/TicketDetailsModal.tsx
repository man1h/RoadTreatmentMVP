import React from 'react';
import { X, Truck, User, Calendar, MapPin, Clock, AlertCircle } from 'lucide-react';

interface Ticket {
    id: number;
    ticket_number: string;
    status: string;
    priority: string;
    created_at: string;
    driver_name: string;
    truck_number: string;
    bridge_count: number;
    truck_id: number;
    assigned_driver_id: number;
    notes: string;
    scheduled_time: string;
    tmc_id: number;
}

interface TicketDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: Ticket | null;
}

const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ isOpen, onClose, ticket }) => {
    if (!isOpen || !ticket) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'assigned': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 font-bold';
            case 'high': return 'text-orange-600 font-medium';
            case 'medium': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        Ticket Details
                                    </h3>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="border-b border-gray-200 pb-4 mb-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-gray-500">Ticket Number</p>
                                            <p className="text-xl font-bold text-blue-600">{ticket.ticket_number}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                                {ticket.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Priority</p>
                                            <p className={`text-sm ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <User className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Assigned Driver</p>
                                            <p className="text-sm text-gray-600">{ticket.driver_name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <Truck className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Truck</p>
                                            <p className="text-sm text-gray-600">{ticket.truck_number}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <Clock className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Scheduled Time</p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(ticket.scheduled_time).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Bridges to Treat</p>
                                            <p className="text-sm text-gray-600">{ticket.bridge_count} Bridges</p>
                                            {/* Ideally we would list the bridges here if we fetched them */}
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Created At</p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(ticket.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {ticket.notes && (
                                        <div className="bg-gray-50 p-3 rounded-md mt-2">
                                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</p>
                                            <p className="text-sm text-gray-700">{ticket.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetailsModal;
