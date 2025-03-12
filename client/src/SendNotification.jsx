import { useState } from "react";
import { FaEnvelope, FaUsers, FaPaperPlane } from "react-icons/fa";
import "./SendNotification.css";


const SendNotification = () => {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [recipient, setRecipient] = useState("all"); // 'all', 'hv', 'gv', 'cm', 'ad'

    const handleSendNotification = async () => {
        if (!title || !message) {
            alert("Vui lòng nhập tiêu đề và nội dung thông báo!");
            return;
        }

        const notificationData = { title, message, recipient };

        try {
            const response = await fetch("http://localhost:5000/admin/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(notificationData),
            });

            if (response.ok) {
                alert("Gửi thông báo thành công!");
                setTitle("");
                setMessage("");
            } else {
                alert("Lỗi khi gửi thông báo!");
            }
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Không thể kết nối đến server!");
        }
    };

    return (
        <div className="notification-container">
            <h2><FaEnvelope /> Gửi Thông Báo</h2>
            <div className="input-group">
                <label>Tiêu đề:</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề thông báo..."
                />
            </div>
            <div className="input-group">
                <label>Nội dung:</label>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Nhập nội dung thông báo..."
                ></textarea>
            </div>
            <div className="input-group">
                <label>Gửi đến:</label>
                <select value={recipient} onChange={(e) => setRecipient(e.target.value)}>
                    <option value="all">Tất cả người dùng</option>
                    <option value="hv">Học viên</option>
                    <option value="gv">Giảng viên</option>
                    <option value="cm">Quản lý trung tâm</option>
                    <option value="ad">Quản trị viên</option>
                </select>
            </div>
            <button onClick={handleSendNotification} className="send-btn">
                <FaPaperPlane /> Gửi Thông Báo
            </button>
        </div>
    );
};

export default SendNotification;
