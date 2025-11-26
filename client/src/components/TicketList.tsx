import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import TicketForm from './TicketForm';
import TicketDetailsModal from './TicketDetailsModal';

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

interface TicketListProps {
    tmcId?: number;
}

const TicketList: React.FC<TicketListProps> = ({ tmcId }) => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [filter, setFilter] = useState('all');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<Ticket | undefined>(undefined);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const { socket } = useSocket();

    useEffect(() => {
        fetchTickets();
    }, [tmcId]);

    useEffect(() => {
        if (!socket) return;

        socket.on('ticket_created', (newTicket: Ticket) => {
            if (tmcId && newTicket.tmc_id !== tmcId) return;
            setTickets(prev => [newTicket, ...prev]);
        });

        socket.on('ticket_updated', (updatedTicket: Ticket) => {
            if (tmcId && updatedTicket.tmc_id !== tmcId) return;
            setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        });

        socket.on('ticket_deleted', ({ id }: { id: number }) => {
            setTickets(prev => prev.filter(t => t.id !== id));
        });

        return () => {
            socket.off('ticket_created');
            socket.off('ticket_updated');
            socket.off('ticket_deleted');
        };
    }, [socket, tmcId]);

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const url = tmcId
                ? `http://localhost:3000/api/tickets?tmcId=${tmcId}`
                : 'http://localhost:3000/api/tickets';

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(response.data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/api/tickets/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error deleting ticket:', error);
            alert('Failed to delete ticket');
        }
    };

    const handleEdit = (ticket: Ticket) => {
        setEditingTicket(ticket);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingTicket(undefined);
        setIsFormOpen(true);
    };

    const handleViewDetails = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsDetailsOpen(true);
    };

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
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Treatment Tickets</h2>
                <button
                    onClick={handleCreate}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Ticket
                </button>
            </div>

            <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                        className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver / Truck</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bridges</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleViewDetails(ticket)}
                                        className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                                    >
                                        {ticket.ticket_number}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                        {ticket.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={getPriorityColor(ticket.priority)}>
                                        {ticket.priority.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="font-medium text-gray-900">{ticket.driver_name}</div>
                                    <div className="text-xs">{ticket.truck_number}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {ticket.bridge_count} bridges
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(ticket.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => handleEdit(ticket)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Edit Ticket"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ticket.id)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Delete Ticket"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <TicketForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={fetchTickets}
                initialData={editingTicket}
            />

            <TicketDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                ticket={selectedTicket}
            />
        </div>
    );
};

export default TicketList;
