import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DraggablePopup from "./DraggablePopup";
import "./Profile.css";

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [isPopupSuccess, setIsPopupSuccess] = useState(null);
    const [editUser, setEditUser] = useState({ fullName: "", email: "", phone: "" });
    const [isEditing, setIsEditing] = useState(false);
    const [updatedInfo, setUpdatedInfo] = useState({ fullName: "", email: "", phone: "" });
    const [message, setMessage] = useState(null);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordPopupMessage, setPasswordPopupMessage] = useState("");
    const [isPasswordPopupSuccess, setIsPasswordPopupSuccess] = useState(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) {
            navigate("/login");
        } else {
            setUser(storedUser);
            setEditUser({ fullName: storedUser.fullName, email: storedUser.email, phone: storedUser.phone || "" });
        }
    }, [navigate]);
    const handleSaveChanges = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^0\d{9}$/;

        // Kiểm tra các trường thông tin
        if (!editUser.fullName || !editUser.email) {
            setPopupMessage("Vui lòng điền đầy đủ họ tên và email!");
            setIsPopupSuccess(false);
            return;
        }

        if (!emailRegex.test(editUser.email)) {
            setPopupMessage("Email không hợp lệ! Vui lòng nhập đúng định dạng email.");
            setIsPopupSuccess(false);
            return;
        }

        if (editUser.phone && !phoneRegex.test(editUser.phone)) {
            setPopupMessage("Số điện thoại không hợp lệ! (Ví dụ: 0912345678)");
            setIsPopupSuccess(false);
            return;
        }

        try {
            // Gửi yêu cầu cập nhật thông tin
            const response = await fetch("http://localhost:5000/student/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: user.id,
                    fullName: editUser.fullName,
                    email: editUser.email,
                    phone: editUser.phone || "",
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setPopupMessage(data.message || "Cập nhật thành công!");
                setIsPopupSuccess(true); // Đặt trạng thái thành công
                const updatedUser = { ...user, fullName: editUser.fullName, email: editUser.email, phone: editUser.phone };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
                setIsEditOpen(false); // Đóng modal chỉnh sửa thông tin
            } else {
                setPopupMessage(data.message || "Có lỗi xảy ra!");
                setIsPopupSuccess(false); // Đặt trạng thái lỗi
            }
        } catch (error) {
            setPopupMessage("Lỗi kết nối đến server!");
            setIsPopupSuccess(false); // Đặt trạng thái lỗi
        }
    };

    const closePopup = () => {
        setIsModalOpen(false);
        setPopupMessage("");
        setIsPopupSuccess(null);
    };

    if (!user) {
        return <p>Đang tải...</p>;
    }
    const handlePasswordChanges = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            setPasswordPopupMessage("Vui lòng nhập đầy đủ thông tin!");
            setIsPasswordPopupSuccess(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordPopupMessage("Mật khẩu mới không khớp!");
            setIsPasswordPopupSuccess(false);
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/student/update-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: user.id,
                    oldPassword,
                    newPassword,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setPasswordPopupMessage("Đổi mật khẩu thành công!");
                setIsPasswordPopupSuccess(true);
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setTimeout(() => setIsModalOpen(false), 2000);
            } else {
                setPasswordPopupMessage(data.message || "Mật khẩu cũ không đúng!");
                setIsPasswordPopupSuccess(false);
            }
        } catch (error) {
            setPasswordPopupMessage("Lỗi kết nối đến server!");
            setIsPasswordPopupSuccess(false);
        }
    };


    return (
        <div className="profile-container">
            <h2>👤 Thông tin cá nhân</h2>
            <div className="profile-card">
                <p><strong>👤 Họ và tên:</strong> {user.fullName}</p>
                <p><strong>📧 Email:</strong> {user.email}</p>
                <p><strong>📞 Số điện thoại:</strong> {user.phone || "Chưa cập nhật"}</p>
                <p><strong>🎭 Vai trò:</strong> {user.role.toUpperCase()}</p>
            </div>

            <button onClick={() => setIsEditOpen(true)} className="edit-btn">📝 Chỉnh sửa</button>
            <button onClick={() => setIsModalOpen(true)} className="change-password-btn">🔑 Đổi mật khẩu</button>
            <button onClick={() => navigate("/home")} className="back-btn">⬅️ Quay lại</button>

            {isModalOpen && (
                <DraggablePopup>
                    <div className="modal-header popup-header">
                        <h4>Đổi mật khẩu</h4>
                    </div>
                    <div className="modal-body">
                        {passwordPopupMessage && (
                            <p style={{ color: isPasswordPopupSuccess ? "green" : "red" }}>
                                {passwordPopupMessage}
                            </p>
                        )}
                        <input
                            type="password"
                            placeholder="Mật khẩu cũ"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Mật khẩu mới"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Xác nhận mật khẩu mới"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <div className="modal-footer">
                        <button onClick={handlePasswordChanges} className="confirm-btn">
                            Xác nhận
                        </button>
                        <button onClick={closePopup} className="back-btn">Đóng</button>
                    </div>
                </DraggablePopup>
            )}

            {isEditOpen && (
                <DraggablePopup>
                    <div className="modal-header popup-header">
                        <h4>Chỉnh sửa thông tin</h4>
                    </div>
                    <div className="modal-body">
                        {popupMessage && (
                            <p style={{ color: isPopupSuccess ? "green" : "red" }}>
                                {popupMessage}
                            </p>
                        )}
                        <input type="text" value={editUser.fullName} onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })} placeholder="Họ và tên" />
                        <input type="email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} placeholder="Email" />
                        <input type="text" value={editUser.phone} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })} placeholder="Số điện thoại" />
                    </div>
                    <div className="modal-footer">
                        <button onClick={handleSaveChanges} className="save-btn">💾 Lưu thay đổi</button>
                        <button onClick={() => setIsEditOpen(false)} className="back-btn">Đóng</button>
                    </div>
                </DraggablePopup>
            )}

        </div>
    );
};

export default Profile;
