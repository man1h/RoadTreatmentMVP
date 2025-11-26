import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import MapComponent from './MapComponent';
import ErrorBoundary from './components/ErrorBoundary';

import Dashboard from './pages/Dashboard';
import TMCDashboard from './pages/TMCDashboard';
import DriverView from './pages/DriverView';
import FleetManagement from './pages/FleetManagement';
import Materials from './pages/Materials';
import UserManagement from './pages/UserManagement';
import StateWideDashboard from './pages/StateWideDashboard';

import { SocketProvider } from './context/SocketContext';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <SocketProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        {/* Protected Routes */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<Layout />}>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/dashboard/tmc/:id" element={<TMCDashboard />} />
                                <Route path="/statewide" element={<StateWideDashboard />} />
                                <Route path="/map" element={<MapComponent />} />
                                <Route path="/driver" element={<DriverView />} />
                                <Route path="/fleet" element={
                                    <ErrorBoundary>
                                        <FleetManagement />
                                    </ErrorBoundary>
                                } />
                                <Route path="/materials" element={<Materials />} />
                                <Route path="/users" element={<UserManagement />} />
                            </Route>
                        </Route>

                        {/* Default Redirect */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Router>
            </SocketProvider>
        </AuthProvider>
    );
};

export default App;
