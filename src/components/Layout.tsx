import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import LeftSidebar from './LeftSidebar';

const Layout: React.FC = () => {
    return (
        <div className="flex flex-col min-h-screen bg-base-200">
            <Navigation />
            <main className="w-full max-w-none flex flex-1">
                <LeftSidebar />
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
