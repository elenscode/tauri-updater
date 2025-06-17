import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoSunny, IoMoon, IoLogOut } from 'react-icons/io5';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/useAuthStore';

const Navigation: React.FC = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="navbar bg-base-100">
            <div className="navbar-start">
                <Link to="/" className="btn btn-ghost text-xl font-bold">
                    Flash Man
                </Link>
            </div>

            <div className="navbar-end gap-2">
                <label className="flex cursor-pointer items-center gap-2">
                    <IoSunny className="h-4 w-4" />
                    <input
                        type="checkbox"
                        checked={theme === 'dark'}
                        className="toggle theme-controller"
                        onChange={toggleTheme}
                    />
                    <IoMoon className="h-4 w-4" />
                </label>

                <button
                    onClick={handleLogout}
                    className="btn btn-ghost btn-sm"
                    title="로그아웃"
                >
                    <IoLogOut className="h-4 w-4" />
                    로그아웃
                </button>
            </div>
        </div>
    );
};

export default Navigation;
