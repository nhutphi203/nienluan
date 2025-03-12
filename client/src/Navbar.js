import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Navbar = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        navigate("/");
    };

    return (
        <nav className="navbar bg-white shadow-md p-4 flex justify-between">
            <Link to="/" className="text-xl font-bold">
                Trung Tâm Học Tập
            </Link>

            <div>
                {user ? (
                    <div className="flex items-center space-x-4">
                        <Link to="/profile" className="text-blue-600 font-semibold">
                            👤 {user.username}
                        </Link>
                        <button onClick={handleLogout} className="text-red-600">
                            Đăng xuất
                        </button>
                    </div>
                ) : (
                    <div className="space-x-4">
                        <Link to="/login" className="text-blue-600">Đăng nhập</Link>
                        <Link to="/register" className="text-green-600">Đăng ký</Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
