import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import "./Fees.css";

const Payments = () => {
    const navigate = useNavigate();
    const [fees, setFees] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // 🔥 State loading
    const [paymentMethod, setPaymentMethod] = useState("bank");
    const [showQR, setShowQR] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) {
            navigate("/login"); // Nếu không có người dùng, điều hướng về login
        } else {
            setUser(storedUser); // Cập nhật thông tin người dùng từ localStorage
            fetchFees(storedUser.id); // Gọi API lấy dữ liệu học phí
        }
    }, [navigate]);

    const fetchFees = async (studentId) => {
        setIsLoading(true); // Bắt đầu loading
        try {
            const response = await fetch(`http://localhost:5000/student/fees/${studentId}`);
            if (!response.ok) throw new Error("Lỗi khi tải học phí");
            const data = await response.json();
            setFees(data);
        } catch (error) {
            console.error(error);
            setFees([]);
        }
        setIsLoading(false); // Kết thúc loading
    };

    const handlePayment = () => {
        alert(`Thanh toán thành công bằng ${paymentMethod === "bank" ? "Chuyển khoản" : "Tiền mặt"}!`);
    };

    const generateQRValue = () => {
        const totalAmount = fees.reduce((sum, fee) => sum + (fee.remaining || 0), 0);
        return `BIDV|CTUB${user.id}|HK2, 2024-2025, MSSV${user.id}, So tien ${totalAmount} VNĐ`;
    };

    // 🔥 Hiển thị loading khi dữ liệu chưa tải xong
    if (isLoading) {
        return <p>🔄 Đang tải dữ liệu...</p>;
    }

    return (
        <div className="fees-container">
            <h2>💳 Thanh toán học phí</h2>

            {fees.length === 0 ? (
                <p>Chưa có dữ liệu học phí.</p>
            ) : (
                <>
                    <table className="fees-table">
                        <thead>
                            <tr>
                                <th>📚 Số môn đăng ký</th>
                                <th>💰 Tổng học phí</th>
                                <th>📅 Ngày đóng gần nhất</th>
                                <th>💳 Đã thanh toán</th>
                                <th>💸 Còn lại</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fees.map((fee) => (
                                <tr key={fee.id}>
                                    <td>{fee.subject_count}</td>
                                    <td>{fee.total_fee?.toLocaleString()} VNĐ</td>
                                    <td>{fee.latest_pay_at ? new Date(fee.latest_pay_at).toLocaleDateString() : "Chưa đóng"}</td>
                                    <td>{(fee.already_pay || 0).toLocaleString()} VNĐ</td>
                                    <td>{(fee.remaining || 0).toLocaleString()} VNĐ</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* 🔥 Khu vực thanh toán */}
                    {fees.some(fee => fee.remaining > 0) && (
                        <div className="payment-section">
                            <h3>🔹 Khu vực thanh toán</h3>
                            <p>Tổng số tiền cần thanh toán: <strong>{fees.reduce((sum, fee) => sum + (fee.remaining || 0), 0).toLocaleString()} VNĐ</strong></p>

                            <label>Chọn phương thức thanh toán:</label>
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                <option value="bank">💳 Chuyển khoản</option>
                                <option value="cash">💵 Tiền mặt</option>
                            </select>

                            <button className="pay-button" onClick={handlePayment}>Xác nhận thanh toán</button>

                            {/* 🔥 Nút hiển thị QR */}
                            <button className="qr-button" onClick={() => setShowQR(!showQR)}>
                                {showQR ? "Ẩn QR Code" : "🔍 Hiển thị QR Code"}
                            </button>

                            {/* 🔥 Hiển thị QR Code nếu `showQR = true` */}
                            {showQR && (
                                <div className="qr-container">
                                    <h3>📌 Nộp học phí qua ngân hàng BIDV</h3>
                                    <p><strong>Ngân hàng:</strong> BIDV</p>
                                    <p><strong>Mã giao dịch:</strong> CTUB{user.id}1741590453</p>
                                    <p><strong>Mô tả:</strong> HK2, 2024-2025, MSSV{user.id}, Số tiền {fees.reduce((sum, fee) => sum + (fee.remaining || 0), 0).toLocaleString()} VNĐ</p>
                                    <QRCodeCanvas value={generateQRValue()} size={200} />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Payments;
