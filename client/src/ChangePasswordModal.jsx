import { useState } from "react";
import "./ChangePasswordModal.css"; // Import CSS riêng

const ChangePasswordModal = ({ closeModal, userId }) => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError("Mật khẩu mới không khớp!");
            return;
        }

        // Send the current password and new password to the backend
        try {
            const response = await fetch("http://localhost:5000/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    oldPassword,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Đổi mật khẩu thành công!");
                closeModal();
            } else {
                setError(data.error || "Có lỗi xảy ra!");
            }
        } catch (error) {
            setError("Lỗi khi đổi mật khẩu!");
            console.error("Lỗi khi đổi mật khẩu:", error);
        }
    };

    return (
        <div className="modal">
            <div className="popup-header">
                <h3>🔑 Đổi mật khẩu</h3>
            </div>
            <div className="modal-body">
                <label>Mật khẩu cũ</label>
                <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                />

                <label>Mật khẩu mới</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />

                <label>Xác nhận mật khẩu</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                {error && <div className="error">{error}</div>}
            </div>
            <div className="modal-footer">
                <button className="confirm-btn" onClick={handleChangePassword}>
                    Xác nhận
                </button>
                <button className="cancel-btn" onClick={closeModal}>
                    Hủy
                </button>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
