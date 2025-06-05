import { Link } from "react-router-dom";
import { IoSearch, IoBrush, IoBarChart } from "react-icons/io5";

const LeftSidebar = () => {
    return (
        <div className="flex flex-col  w-16">
            <ul className="menu gap-2">
                <li>
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                        <IoSearch size={18} />

                    </Link>
                </li>
                <li>
                    <Link to="/draw" className={location.pathname === '/draw' ? 'active' : ''}>
                        <IoBrush size={18} />
                    </Link>
                </li>
                <li>
                    <Link to="/gallery" className={location.pathname === '/gallery' ? 'active' : ''}>
                        <IoBarChart size={18} />
                    </Link>
                </li>
            </ul>
        </div>
    )
}
export default LeftSidebar;