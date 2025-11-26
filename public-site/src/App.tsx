import React from 'react';
import PublicMap from './PublicMap';

const App: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-blue-900 text-white p-4 shadow-md z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">ALDOT Winter Treatment Status</h1>
                        <p className="text-blue-200 text-sm">Real-time Bridge Conditions</p>
                    </div>
                    <div className="text-right text-xs text-blue-300">
                        Public Access Portal
                    </div>
                </div>
            </header>

            <main className="flex-grow relative">
                <PublicMap />
            </main>

            <footer className="bg-white border-t border-gray-200 p-2 text-center text-xs text-gray-500">
                &copy; {new Date().getFullYear()} Alabama Department of Transportation
            </footer>
        </div>
    );
};

export default App;
