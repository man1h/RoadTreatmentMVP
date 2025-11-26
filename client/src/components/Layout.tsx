import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Map, Truck, Package, Users, LogOut, User, BarChart3 } from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'dispatcher'] },
        { name: 'State Overview', path: '/statewide', icon: BarChart3, roles: ['admin'] },
        { name: 'Map View', path: '/map', icon: Map, roles: ['admin', 'dispatcher', 'driver'] },
        { name: 'My Assignments', path: '/driver', icon: User, roles: ['driver'] },
        { name: 'Fleet Management', path: '/fleet', icon: Truck, roles: ['admin', 'dispatcher'] },
        { name: 'Materials', path: '/materials', icon: Package, roles: ['admin', 'dispatcher'] },
        { name: 'User Management', path: '/users', icon: Users, roles: ['admin'] },
    ];

    const accessibleNavItems = navItems.filter(item =>
        user && item.roles.includes(user.role)
    );

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActivePath = (path: string) => {
        return location.pathname === path;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-blue-800 text-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center min-w-0 mr-8">
                            <Truck className="h-8 w-8 mr-3 flex-shrink-0" />
                            <div className="flex-shrink-0">
                                <span className="font-bold text-xl block">ALDOT Dispatch</span>
                                <span className="text-xs text-blue-200 block">
                                    {user?.tmc_id ? `TMC Region ${user.tmc_id}` : 'System Admin'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="hidden md:flex space-x-2">
                                {accessibleNavItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = isActivePath(item.path);
                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => navigate(item.path)}
                                            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                                ? 'bg-blue-900 text-white'
                                                : 'hover:bg-blue-700'
                                                }`}
                                        >
                                            <Icon className="h-4 w-4 mr-2" />
                                            {item.name}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center pl-4 border-l border-blue-700">
                                <div className="mr-4 text-right hidden sm:block">
                                    <div className="text-sm font-medium">{user?.name}</div>
                                    <div className="text-xs text-blue-300 capitalize">{user?.role}</div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-full hover:bg-blue-700 focus:outline-none"
                                    title="Logout"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
