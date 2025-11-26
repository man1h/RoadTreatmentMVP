import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield } from 'lucide-react';
import axios from 'axios';
import UserForm from '../components/UserForm';
import Modal from '../components/Modal';
import { useSocket } from '../context/SocketContext';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
    const { socket } = useSocket();

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('user_created', (newUser: any) => {
            setUsers(prev => [newUser, ...prev]);
        });

        socket.on('user_updated', (updatedUser: any) => {
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        });

        socket.on('user_deleted', (data: any) => {
            setUsers(prev => prev.filter(u => u.id !== data.id));
        });

        return () => {
            socket.off('user_created');
            socket.off('user_updated');
            socket.off('user_deleted');
        };
    }, [socket]);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await axios.get(`${apiUrl}/api/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setIsFormOpen(true);
    };

    const handleDelete = async (userId: number) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            await axios.delete(`${apiUrl}/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const getRoleBadge = (role: string) => {
        const colors = {
            admin: 'bg-purple-100 text-purple-800',
            dispatcher: 'bg-blue-100 text-blue-800',
            driver: 'bg-green-100 text-green-800'
        };
        return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Shield className="h-8 w-8 mr-3 text-blue-600" />
                    User Management
                </h1>
                <button
                    onClick={() => {
                        setSelectedUser(null);
                        setIsFormOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                TMC Region
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                            <Users className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getRoleBadge(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.tmc_name || `Region ${user.tmc_id}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(user)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <UserForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
                onSuccess={fetchUsers}
            />

            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Confirm Delete"
            >
                <div className="space-y-4">
                    <p>Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?</p>
                    <p className="text-sm text-gray-500">This action cannot be undone.</p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleDelete(deleteConfirm.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Delete User
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default UserManagement;
