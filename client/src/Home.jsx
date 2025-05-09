import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";  // Import WebSocket client
import { FaHome, FaBell, FaSignOutAlt, FaUser, FaBook, FaChalkboardTeacher, FaFileAlt, FaUsers, FaCog, FaMoneyBill, FaSearch, FaMoon, FaSun, FaCalendarAlt, FaDatabase, FaEnvelope, FaChartBar } from "react-icons/fa";
import "./Home.css";
import Revenue from "./Revenue";
import axios from "axios";
import { toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";


const socket = io("http://localhost:5000"); // Kết nối tới server WebSocket

const Home = ({ user, token }) => {
    const [news, setNews] = useState([]);
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    // Nếu có user truyền từ props, lấy luôn, ngược lại thử lấy từ localStorage theo vai trò phổ biến
    const [currentUser, setCurrentUser] = useState(() => {
        if (user) return user;

        // Ưu tiên đọc theo thứ tự role phổ biến nhất → bạn có thể tùy chỉnh lại
        const roles = ["hv", "gv", "cm", "ad"];
        for (let role of roles) {
            const stored = localStorage.getItem(`${role}_user`);
            if (stored) return JSON.parse(stored);
        }

        return null; // Không tìm thấy user nào
    });

    const [showSettings, setShowSettings] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState();
    const [schedule, setSchedule] = useState([]);
    const [siteNotifications, setSiteNotifications] = useState([]);
    const [darkMode, setDarkMode] = useState(false);
    const [students, setStudents] = useState([]);

    useEffect(() => {
        if (currentUser && currentUser.role === "gv") {
            fetchTeachingSchedule(currentUser.id);
        }
    }, [currentUser]); const fetchTeachingSchedule = async (teacherId) => {
        try {
            const response = await axios.get(`http://localhost:5000/teacher/teacher/classes/${teacherId}`);
            console.log("Lịch dạy từ API:", response.data);
            setSchedule(response.data);
        } catch (error) {
            console.error("Lỗi khi lấy lịch dạy:", error);
            toast.error("⚠️ Không thể tải lịch dạy!");
        }
    };
    useEffect(() => {
        const savedMode = localStorage.getItem("darkMode") === "true"; // Chuyển đổi chuỗi thành boolean
        setDarkMode(savedMode);
        document.body.classList.toggle("dark-mode", savedMode);
    }, []);

    const handleCancelTeaching = async (classId) => {
        try {
            const response = await axios.delete(`http://localhost:5000/teacher/unregister-class/${currentUser.id}/${classId}`);

            if (response.status === 200) {
                toast.success("✅ Hủy đăng ký dạy thành công!");
                fetchTeachingSchedule(currentUser.id); // Cập nhật lại danh sách lớp
                socket.emit("teachingUnregistered", { teacherId: currentUser.id, classId });
            }
        } catch (error) {
            console.error("Lỗi khi hủy đăng ký dạy:", error);
            toast.error("❌ Không thể hủy đăng ký dạy!");
        }
    };
    const renderTeachingSchedule = () => {
        if (schedule.length === 0) {
            return <p className="no-schedule-msg">Bạn chưa đăng ký lớp nào!</p>;
        }

        return (
            <table className="schedule-table">
                <thead>
                    <tr>
                        <th>Tên lớp</th>
                        <th>Loại lớp</th>
                        <th>Khối</th>
                        <th>Số học sinh</th>
                        <th>Lịch dạy</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {schedule.map((item, index) => (
                        <tr key={index}>
                            <td>{item.name}</td>
                            <td>{item.type_mapped}</td>
                            <td>{item.grade}</td>
                            <td>{item.current_student} / {item.max_student}</td>
                            <td>
                                {item.schedule.split(", ").map((session, i) => (
                                    <div key={i}>{session}</div>
                                ))}
                            </td>
                            <td>
                                <button onClick={() => handleCancelTeaching(item.id)} className="cancel-btn">
                                    Hủy đăng ký dạy
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };






    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) {
            navigate("/login");
        } else {
            setCurrentUser(storedUser);
            fetchSchedule(storedUser.id);
            fetchNews();

        }

        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }



        socket.emit("join", { userId: storedUser.id });

        socket.on("newNotification", (notification) => {
            setNotifications((prev) => [notification, ...prev]); // Lưu thông báo cũ
            setSiteNotifications((prev) => [notification.message, ...prev]); // Thêm vào danh sách thông báo UI
        });


        socket.on("groupRegistered", ({ studentId }) => {
            if (studentId === storedUser.id) {
                fetchSchedule(studentId); // Cập nhật lại lịch học
            }
        });

        return () => {
            socket.off("newNotification");
            socket.off("groupRegistered");
        };
    }, [navigate]);

    const fetchSchedule = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:5000/student/registered-classes/${userId}`);
            console.log("Lịch học từ API:", response.data);  // Debug
            setSchedule(response.data);
        } catch (error) {
            console.error("Lỗi khi lấy lịch học:", error);
        }
    };

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        document.body.classList.toggle("dark-mode", newDarkMode);
        localStorage.setItem("darkMode", newDarkMode); // Lưu vào localStorage
    };

    const fetchNews = async () => {
        try {
            const response = await axios.get("http://localhost:5000/news/news");
            console.log("Dữ liệu nhận được từ API:", response.data);  // Debug
            setNews(response.data);
        } catch (error) {
            console.error("Lỗi khi lấy tin tức:", error);
        }
    };


    const handleCancelRegistration = async (classId) => {
        try {
            const response = await axios.delete(
                `http://localhost:5000/student/unregister-group/${currentUser.id}/${classId}`
            );

            if (response.status === 200) {
                toast.success("✅ Hủy đăng ký thành công!");
                fetchSchedule(currentUser.id); // Cập nhật lại lịch học ngay sau khi hủy
                socket.emit("groupUnregistered", { studentId: currentUser.id, classId }); // Gửi sự kiện WebSocket
            }
        } catch (error) {
            if (error.response) {
                console.error("🚨 API Error:", error.response.data);
                toast.error(`❌ ${error.response.data.error || "Hủy đăng ký thất bại!"}`);
            } else {
                toast.error("⚠️ Lỗi kết nối đến server!");
            }
        }
    };


    const handleLogout = () => {
        localStorage.removeItem("user");
        setCurrentUser(null);
        navigate("/login");
    };

    if (!currentUser) return <p>Đang tải...</p>;
    const renderSchedule = () => {
        if (schedule.length === 0) {
            return <p className="no-schedule-msg">Bạn chưa đăng ký nhóm nào hết!</p>;
        }
        console.log("Dữ liệu lịch học từ API:", schedule);




        return (
            <table className="schedule-table">
                <thead>
                    <tr>
                        <th>Tên lớp</th>
                        <th>Môn học</th>
                        <th>Loại lớp</th>
                        <th>Khối</th>
                        <th>Lịch học</th>
                        <th>Hành động</th>

                    </tr>
                </thead>
                <tbody>
                    {schedule.map((item, index) => (
                        <tr key={index}>
                            <td>{item.name}</td>
                            <td>{item.subject}</td>
                            <td>{item.type_mapped}</td> {/* 🔥 Đổi từ type -> type_mapped */}
                            <td>{item.grade}</td>
                            <td>
                                {item.schedule.split(", ").map((session, i) => ( // 🔥 Dấu phân cách từ SQL là ", "
                                    <div key={i}>{session}</div>
                                ))}
                            </td>
                            <td>
                                <button onClick={() => handleCancelRegistration(item.id)} className="cancel-btn">
                                    Hủy đăng ký
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const sidebarItems = {
        hv: [
            { path: "/grades", label: "Điểm số", icon: <FaBell /> },
            { path: "/fees", label: "Học phí", icon: <FaCog /> },
            { path: "/register-group", label: "Đăng ký nhóm học", icon: <FaCalendarAlt /> },
            { path: "/documents", label: "Tài liệu", icon: <FaFileAlt /> }, // ✅ Thêm mục này
            { path: "/student-list", label: "Danh sách học viên", icon: <FaUsers /> },
        ],
        gv: [
            { path: "/teaching-schedule", label: "Lịch giảng dạy", icon: <FaHome /> },
            { path: "/student-grades-input", label: "Chấm điểm học sinh", icon: <FaBell /> },
            { path: "/register-class", label: "Đăng ký dạy học", icon: <FaChalkboardTeacher /> },
            { path: "/documents", label: "Tài liệu", icon: <FaFileAlt /> }, // ✅ Thêm mục này
        ],
        cm: [
            { path: "/manage-groups", label: "Quản lý nhóm học", icon: <FaHome /> },
            { path: "/finance-reports", label: "Báo cáo tài chính", icon: <FaBell /> },
            { path: "/manage-teachers", label: "Quản lý giáo viên", icon: <FaCog /> },
            { path: "/manage-students", label: "Quản lý học viên", icon: <FaUser /> },
            { path: "/tuition-salary", label: "Quản lý doanh thu", icon: <FaBell /> },
        ],
        ad: [
            { path: "/system-management", label: "Quản lý hệ thống", icon: <FaHome /> },
            { path: "/user-management", label: "Quản lý người dùng", icon: <FaUser /> },
            { path: "/backup-restore", label: "Sao lưu & Khôi phục", icon: <FaDatabase /> },
        ],
    };

    return (
        <div className="home-container">
            <nav className="navbar">
                <h1>Trung Tâm Gia Sư</h1>
                <div className="navbar-buttons">
                    <span className="nav-item" onClick={() => navigate("/home")} title="Trang chủ">
                        <FaHome />
                    </span>

                    <span className="nav-item" onClick={() => navigate("/courses")} title="Khóa học">
                        <FaBook />
                    </span>
                    <span className="nav-item" onClick={() => navigate("/teachers")} title="Giảng viên">
                        <FaChalkboardTeacher />
                    </span>
                    <span className="nav-item" onClick={() => navigate("/payments")} title="Thanh toán">
                        <FaMoneyBill />
                    </span>
                    {user && (
                        <span className="nav-item" onClick={() => navigate("/profile")} title="Hồ sơ cá nhân">
                            <FaUser />
                        </span>
                    )}

                    <span className="nav-item" onClick={toggleDarkMode} title="Chế độ tối">
                        {darkMode ? <FaSun /> : <FaMoon />}
                    </span>
                    <span className="nav-item logout" onClick={handleLogout} title="Đăng xuất">
                        <FaSignOutAlt />
                    </span>

                </div>
            </nav>
            <div className="news-ticker">
                <div className="news-content">
                    {news.length > 0 ? (
                        news.map((item, index) => (
                            <span key={index} className="news-item">
                                {item.title} &nbsp; | &nbsp;
                            </span>
                        ))
                    ) : (
                        <span>Không có tin tức nào.</span>
                    )}
                </div>
            </div>

            <div className="main-content">
                <aside className="sidebar">
                    <ul>
                        {sidebarItems[currentUser.role]?.map((item, index) => (
                            <li key={index} className="sidebar-item" onClick={() => navigate(item.path)}>
                                {item.icon} {item.label}
                            </li>
                        ))}
                    </ul>
                </aside>

                <main className="dashboard">
                    {currentUser.role === "hv" ? (
                        <section className="dashboard-content">
                            <h2>Lịch học của bạn</h2>
                            <div className="schedule-container">{renderSchedule()}</div>
                        </section>
                    ) : (
                        currentUser.role === "ad" || currentUser.role === "cm" ? (
                            <section className="dashboard-content">
                                <h2>Thống kê doanh thu</h2>
                                <div className={darkMode ? "dark-chart" : ""}>
                                    <Revenue />
                                </div>
                            </section>
                        ) : null
                    )}
                    {currentUser.role === "gv" && (
                        <div className="teaching-schedule">
                            <h2>Lịch dạy của bạn</h2>
                            {renderTeachingSchedule()}
                        </div>
                    )}





                </main>
            </div>
            <footer className="footer">
                <div className="footer-container">
                    {/* Thông tin liên hệ */}
                    <div className="contact-info">
                        <p>🏠 Khu II, Đ. 3 Tháng 2, Xuân Khánh, Ninh Kiều, Cần Thơ</p>
                        <p>📞 <a href="tel:0123456789">07028124240</a></p>
                        <p>📧 <a href="mailto:contact@trungtamabc.com">contact@trungtamquanly.com</a></p>
                    </div>

                    {/* Mạng xã hội */}
                    <div className="social-media">
                        <p>Liên hệ với chúng tôi</p>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                            <img src="/images/facebook.png" alt="Facebook" />
                        </a>
                        <a href="https://zalo.me" target="_blank" rel="noopener noreferrer">
                            <img src="/images/tải xuống.png" alt="Zalo" />
                        </a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                            <img src="/images/youtube.png" alt="YouTube" />
                        </a>
                    </div>
                </div>

                <p className="copyright">© 2025 Trung tâm Gia Sư ABC</p>
            </footer>


        </div>
    );
};

export default Home;
