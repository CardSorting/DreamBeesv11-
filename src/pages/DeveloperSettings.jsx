import React from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import ApiKeyManager from '../components/developer/ApiKeyManager';

const DeveloperSettings = () => {
    return (
        <div className="min-h-screen bg-black text-white pb-20 md:pb-0">
            <Navbar />
            <div className="pt-24 px-4 container mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600 mb-2">
                        Developer Portal
                    </h1>
                    <p className="text-gray-400">
                        Manage your integrations and API access.
                    </p>
                </div>

                <ApiKeyManager />
            </div>
            <BottomNav />
        </div>
    );
};

export default DeveloperSettings;
