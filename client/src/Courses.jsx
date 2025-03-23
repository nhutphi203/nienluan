import { useState, useEffect, useRef } from "react";
import StudentClasses from "./student";
import TeacherClasses from "./teacher";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import io from "socket.io-client";
import "./Documents.css";

const socket = io("http://localhost:5000", { transports: ["websocket"] });

const Courses = ({ user }) => {
    const [selectedClass, setSelectedClass] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [submittedAssignments, setSubmittedAssignments] = useState([]);
    const [students, setStudents] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);

    const [newAnnouncement, setNewAnnouncement] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const storedUser = localStorage.getItem("user");
    const [currentUser, setCurrentUser] = useState(user || (storedUser ? JSON.parse(storedUser) : null));

    useEffect(() => {
        if (!currentUser) {
            navigate("/login");
        } else {
            fetchNotifications(currentUser.role);
        }
    }, [currentUser, navigate]);
    useEffect(() => {
        if (selectedClass) {
            fetchNotifications(selectedClass);
        }
    }, [selectedClass]);
    useEffect(() => {
        console.log("📢 Thông báo mới cập nhật:", announcements);
    }, [announcements]);
    useEffect(() => {
        socket.on("newNotification", (notification) => {
            console.log("🔔 Nhận thông báo mới từ server:", notification);
            setAnnouncements((prev) => [notification, ...prev]);
        });

        return () => socket.off("newNotification");
    }, []);
    useEffect(() => {
        const socket = io("http://localhost:5000");

        socket.on("newNotification", (notification) => {
            console.log("🔔 Nhận thông báo mới từ server:", notification);
            setAnnouncements((prev) => [notification, ...prev]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchNotifications = async (selectedClass) => {
        try {
            const res = await axios.get(`http://localhost:5000/notifications/notifications?class_id=${selectedClass}`);
            console.log("📢 Dữ liệu thông báo nhận được từ API:", res.data); // Kiểm tra dữ liệu
            setAnnouncements(res.data);
            console.log("🔔 State thông báo sau khi cập nhật:", res.data); // In ra dữ liệu mới thay vì announcements
        } catch (error) {
            console.error("❌ Lỗi khi lấy thông báo:", error);
            toast.error("⚠️ Không thể tải thông báo!");
        }
    };


    const [newTitle, setNewTitle] = useState(""); // 🔹 Thêm state cho tiêu đề
    const handleAddAnnouncement = async () => {
        if (!newAnnouncement.trim()) {
            toast.error("⚠️ Nội dung thông báo không được để trống!");
            return;
        }

        try {
            let data;
            if (selectedFile) {
                data = new FormData();
                data.append("class_id", selectedClass);
                data.append("teacher_id", currentUser.id);
                data.append("title", newTitle); // 🆕 Giáo viên nhập title
                data.append("message", newAnnouncement);
                data.append("file", selectedFile);
            } else {
                data = {
                    class_id: selectedClass,
                    teacher_id: currentUser.id,
                    title: newTitle, // 🆕 Giáo viên nhập title
                    message: newAnnouncement,
                };
            }

            const response = await axios.post("http://localhost:5000/notifications/notifications", data, {
                headers: selectedFile ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" },
            });

            if (response.status === 201) {
                toast.success("✅ Thông báo đã được đăng!");
            } else {
                toast.warn("⚠️ Gửi thông báo không thành công, vui lòng thử lại!");
            }

            setNewAnnouncement("");
            setSelectedFile(null);
            setNewTitle(""); // Reset title
            setSelectedFile("");
            fetchNotifications("class_" + selectedClass);
        } catch (error) {
            console.error("❌ Lỗi khi gửi thông báo:", error);
            toast.error("⚠️ Không thể đăng thông báo!");
        }
    };


    const handleSelectClass = async (class_Id) => {
        console.log("Chọn lớp:", class_Id); // Debug: kiểm tra dữ liệu
        try {
            const response = await axios.get(`http://localhost:5000/documents/class/${class_Id}`);
            console.log("Dữ liệu tài liệu:", response.data); // Debug: kiểm tra dữ liệu trả về
            setDocuments(response.data);
            setSelectedClass(class_Id);
        } catch (error) {
            console.error("❌ Lỗi khi lấy tài liệu:", error);
            toast.error("⚠️ Không thể tải tài liệu!");
        }
    };



    const handleDeleteAnnouncement = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa thông báo này không?")) return;

        try {
            const response = await axios.delete(`http://localhost:5000/notifications/notifications/${id}`);
            if (response.status === 200) {
                toast.success("🗑️ Đã xóa thông báo và tài liệu!");
                // Gửi thông báo mới qua socket.io
                socket.emit("newNotification", response.data);

                // Cập nhật state ngay lập tức mà không cần gọi API
                setAnnouncements((prev) => [response.data, ...prev]);
                // Gọi lại API để lấy danh sách thông báo mới nhất
                fetchNotifications(selectedClass);
            } else {
                toast.error("❌ Xóa không thành công!");
            }
        } catch (error) {
            console.error("Lỗi khi xóa thông báo:", error);
            toast.error("⚠️ Không thể xóa thông báo!");
        }
    };



    return (
        <div className="courses-container">


            {!selectedClass ? (
                <>
                    <h3>Chọn lớp học</h3>
                    {currentUser?.role === "hv" ? (
                        <StudentClasses userId={currentUser.id} onSelectClass={handleSelectClass} />
                    ) : currentUser?.role === "gv" ? (
                        <TeacherClasses userId={currentUser.id} onSelectClass={handleSelectClass} />
                    ) : null}
                </>
            ) : (
                <div>
                    <h2>📢 Danh sách thông báo</h2>
                    {announcements.length === 0 ? (
                        <p>📭 Chưa có thông báo nào!</p>
                    ) : (
                        <ul>
                            {announcements.length > 0 ? (
                                announcements.map((notif) => (
                                    <li key={notif.id} className="notification-item">
                                        <p className="font-medium">{notif?.title}</p>
                                        <p className="text-sm text-gray-600">{notif?.message}</p>

                                        {documents.length > 0 ? (
                                            documents.map((doc) => (
                                                <li key={doc.id}>
                                                    <a
                                                        href={`http://localhost:5000${doc.file_path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {doc.title}
                                                    </a>

                                                </li>
                                            ))
                                        ) : (
                                            <p>Không có tài liệu nào.</p>
                                        )}

                                        {/* Nếu là giáo viên, hiển thị nút xóa */}
                                        {currentUser?.role === "gv" && (
                                            <button
                                                onClick={() => handleDeleteAnnouncement(notif.id)}
                                                className="delete-btn"
                                            >
                                                ❌ Xóa
                                            </button>
                                        )}
                                    </li>
                                ))
                            ) : (
                                <li className="text-center text-gray-500">Không có thông báo</li>
                            )}
                        </ul>

                    )}
                </div>
            )}

            {/* Form tạo thông báo: đặt ngoài khối trên để luôn hiển thị nếu là giáo viên và đã chọn lớp */}
            {currentUser?.role === "gv" && selectedClass && (
                <div className="add-announcement">
                    <h3>📢 Thêm Thông Báo</h3>
                    <input
                        type="text"
                        placeholder="Nhập tiêu đề thông báo..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="border p-2 w-full rounded"
                    />

                    <textarea
                        placeholder="Nhập nội dung thông báo..."
                        value={newAnnouncement}
                        onChange={(e) => setNewAnnouncement(e.target.value)}
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                    <button onClick={handleAddAnnouncement}>📩 Gửi thông báo</button>
                </div>
            )}


        </div>
    );
};

export default Courses;
