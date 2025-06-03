import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IoSunny, IoMoon, IoLogOut } from 'react-icons/io5';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/useAuthStore';

const Navigation: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="navbar bg-base-100 shadow-lg">
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h8m-8 6h16" />
                        </svg>
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
                        <li>
                            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                                홈
                            </Link>
                        </li>
                        <li>
                            <Link to="/draw" className={location.pathname === '/draw' ? 'active' : ''}>
                                그리기
                            </Link>
                        </li>
                    </ul>
                </div>
                <Link to="/" className="btn btn-ghost text-xl">
                    Tauri Updater
                </Link>
            </div>

            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li>
                        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                            홈
                        </Link>
                    </li>
                    <li>
                        <Link to="/draw" className={location.pathname === '/draw' ? 'active' : ''}>
                            그리기
                        </Link>
                    </li>
                </ul>
            </div>            <div className="navbar-end gap-2">
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
