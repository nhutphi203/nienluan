import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Bell } from "lucide-react";
import { io } from "socket.io-client"; // Thêm WebSocket client

const socket = io("http://localhost:5000"); // Kết nối WebSocket với backend

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [userRole, setUserRole] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchUserRole();
        document.addEventListener("mousedown", handleClickOutside);

        // Lắng nghe sự kiện "newNotification" từ server WebSocket
        socket.on("newNotification", (notification) => {
            console.log("📢 Nhận thông báo mới:", notification);
            setNotifications((prev) => [notification, ...prev]); // Cập nhật danh sách thông báo
        });

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            socket.off("newNotification"); // Hủy lắng nghe khi component bị unmount
        };
    }, []);

    const fetchUserRole = () => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.role) {
            setUserRole(user.role);
            fetchNotifications(user.role);
        }
    };

    const fetchNotifications = async (role) => {
        try {
            const response = await axios.get(`http://localhost:5000/notifications/notifications?role=${role}`);
            setNotifications(response.data);
        } catch (error) {
            console.error("❌ Lỗi khi tải thông báo:", error.response?.data || error.message);
        }
    };

    const handleDelete = async (id) => {
        if (userRole !== "ad" && userRole !== "cm") {
            alert("Bạn không có quyền xóa thông báo.");
            return;
        }
        try {
            await axios.delete(`http://localhost:5000/notifications/notifications/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setNotifications(notifications.filter((notification) => notification.id !== id));
        } catch (error) {
            console.error("❌ Lỗi khi xóa thông báo:", error.message);
        }
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setDropdownOpen(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative p-2 rounded-full hover:bg-gray-200 transition"
            >
                <Bell size={24} />
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {notifications.length}
                    </span>
                )}
            </button>

            <div
                className={`absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border z-50 transform transition-all duration-300 ${dropdownOpen ? "scale-100 opacity-100 visible" : "scale-95 opacity-0 invisible"
                    }`}
            >
                <div className="p-3 border-b font-semibold bg-gray-100">📢 Thông báo</div>
                <ul className="max-h-60 overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map((noti) => (
                            <li key={noti.id} className="p-3 border-b flex justify-between items-center hover:bg-gray-100 transition">
                                <div>
                                    <p className="font-medium">{noti.title}</p>
                                    <p className="text-sm text-gray-600">{noti.message}</p>
                                </div>
                                {(userRole === "ad" || userRole === "cm") && (
                                    <button
                                        onClick={() => handleDelete(noti.id)}
                                        className="text-red-500 text-sm hover:text-red-700"
                                    >
                                        Xóa
                                    </button>
                                )}
                            </li>
                        ))
                    ) : (
                        <li className="p-3 text-center text-gray-500">Không có thông báo mới</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Notifications;
