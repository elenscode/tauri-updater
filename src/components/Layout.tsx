import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

const Layout: React.FC = () => {
    return (
        <div className="min-h-screen bg-base-200 flex flex-col">
            <Navigation />
            <main className="flex flex-1 w-full max-w-none overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
