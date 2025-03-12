import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaBell, FaCog, FaUser, FaSignOutAlt, FaBars } from "react-icons/fa";
import ImageSlider from "./ImageSlider";
import "./Home.css";

const Home = ({ user }) => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(user || JSON.parse(localStorage.getItem("user")));
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            navigate("/login");
        }
    }, [currentUser, navigate]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        setCurrentUser(null);
        navigate("/login");
    };

    if (!currentUser) return <p>Đang tải...</p>;

    const sidebarItems = {
        hv: [
            { path: "/schedule", label: "Lịch học", icon: <FaHome /> },
            { path: "/grades", label: "Điểm số", icon: <FaBell /> },
            { path: "/fees", label: "Học phí", icon: <FaCog /> },
            { path: "/makeup-classes", label: "Học bù", icon: <FaUser /> },
        ],
        gv: [
            { path: "/teaching-schedule", label: "Lịch giảng dạy", icon: <FaHome /> },
            { path: "/student-grades-input", label: "Chấm điểm học sinh", icon: <FaBell /> },
            { path: "/attendance", label: "Chấm công", icon: <FaCog /> },
        ],
        cm: [
            { path: "/manage-groups", label: "Quản lý nhóm học", icon: <FaHome /> },
            { path: "/finance-reports", label: "Báo cáo tài chính", icon: <FaBell /> },
            { path: "/manage-teachers", label: "Quản lý giáo viên", icon: <FaCog /> },
        ],
        ad: [
            { path: "/system-management", label: "Quản lý hệ thống", icon: <FaHome /> },
            { path: "/revenue-salary", label: "Doanh thu & lương", icon: <FaBell /> },
        ],
    };

    return (
        <div className="home-container">
            <nav className="navbar">
                <div className="navbar-left">
                    <FaBars className="menu-icon" onClick={() => setSidebarOpen(!sidebarOpen)} />
                    <h1>Trung Tâm Gia Sư</h1>
                </div>
                <div className="navbar-right">
                    <FaBell className="nav-icon" onClick={() => navigate("/notifications")} />
                    <FaUser className="nav-icon" onClick={() => navigate("/profile")} />
                    <FaSignOutAlt className="nav-icon logout" onClick={handleLogout} />
                </div>
            </nav>

            <div className="main-content">
                <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
                    <ul>
                        {sidebarItems[currentUser.role]?.map((item, index) => (
                            <li key={index} className="sidebar-item" onClick={() => navigate(item.path)}>
                                {item.icon} {sidebarOpen && item.label}
                            </li>
                        ))}
                    </ul>
                </aside>

                <main className="dashboard">
                    <section className="dashboard-content">
                        <h2>Bảng điều khiển</h2>
                        <p>{
                            {
                                hv: "Bạn có thể xem lịch học, điểm số và học phí tại đây.",
                                gv: "Bạn có thể xem lịch giảng dạy, nhập điểm và chấm công.",
                                cm: "Quản lý nhóm học, báo cáo tài chính, giáo viên, học viên, lịch học, học phí & lương, báo cáo & thống kê, thông báo & tin tức.",
                                ad: "Quản lý hệ thống, lập báo cáo doanh thu & lương, theo dõi điểm danh.",
                            }[currentUser.role]
                        }</p>
                        <ImageSlider />
                    </section>
                </main>
            </div>
        </div>
    );
};

export default Home;
