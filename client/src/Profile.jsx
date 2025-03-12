import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DraggablePopup from "./DraggablePopup"; // Import DraggablePopup
import "./Profile.css";
import "./ChangePasswordModal.jsx"

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [popupMessage, setPopupMessage] = useState(""); // State for popup message
    const [isPopupSuccess, setIsPopupSuccess] = useState(null); // Whether it's success or error for popup

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) {
            navigate("/login");
        } else {
            setUser(storedUser);
        }
    }, [navigate]);

    const handlePasswordChange = async (oldPassword, newPassword, confirmPassword) => {
        if (newPassword !== confirmPassword) {
            setPopupMessage("Mật khẩu mới không khớp!");
            setIsPopupSuccess(false); // Failure message
            return;
        }

        // Logic to change password...
        // giả sử đổi mật khẩu thành công
        setPopupMessage("Đổi mật khẩu thành công!");
        setIsPopupSuccess(true); // Success message
    };

    const closePopup = () => {
        setIsModalOpen(false);
        setPopupMessage(""); // Clear message when closing the popup
        setIsPopupSuccess(null); // Reset the success or error state
    };

    if (!user) {
        return <p>Đang tải...</p>;
    }

    return (
        <div className="profile-container">
            <h2>👤 Thông tin cá nhân</h2>
            <div className="profile-card">
                <p><strong>👤 Họ và tên:</strong> {user.fullName}</p>
                <p><strong>📧 Email:</strong> {user.email}</p>
                <p><strong>📞 Số điện thoại:</strong> {user.phone || "Chưa cập nhật"}</p>
                <p><strong>🎭 Vai trò:</strong> {user.role.toUpperCase()}</p>
            </div>

            <button onClick={() => setIsModalOpen(true)} className="change-password-btn">
                🔑 Đổi mật khẩu
            </button>

            <button onClick={() => navigate("/home")} className="back-btn">⬅️ Quay lại</button>

            {/* Đổi mật khẩu sẽ được hiển thị trong DraggablePopup */}
            {isModalOpen && (
                <DraggablePopup>
                    <div className="modal-header popup-header">
                        <h4>Đổi mật khẩu</h4>
                    </div>
                    <div className="modal-body">
                        {popupMessage && (
                            <p style={{ color: isPopupSuccess ? "green" : "red" }}>
                                {popupMessage}
                            </p>
                        )}
                        <input type="password" placeholder="Mật khẩu cũ" />
                        <input type="password" placeholder="Mật khẩu mới" />
                        <input type="password" placeholder="Xác nhận mật khẩu mới" />
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => handlePasswordChange("oldPassword", "newPassword", "confirmPassword")} className="confirm-btn">Xác nhận</button>

                        <button onClick={closePopup} className="back-btn">Đóng</button>
                    </div>

                </DraggablePopup>
            )}

        </div>
    );
};

export default Profile;
