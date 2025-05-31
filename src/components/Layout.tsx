import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

const Layout: React.FC = () => {
    return (
        <div className="min-h-screen bg-base-200">
            <Navigation />
            <main className="w-full max-w-none">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
