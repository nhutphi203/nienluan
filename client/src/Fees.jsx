import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Fees.css";

const Fees = ({ user }) => {
    const navigate = useNavigate();
    const [fees, setFees] = useState([]);

    useEffect(() => {
        if (!user) {
            const storedUser = JSON.parse(localStorage.getItem("user"));
            if (!storedUser) {
                navigate("/login");
                return;
            }
            fetchFees(storedUser.id);
        } else {
            fetchFees(user.id);
        }
    }, [user, navigate]);

    const fetchFees = async (studentId) => {
        try {
            const response = await fetch(`http://localhost:5000/student/fees/${studentId}`);
            if (!response.ok) throw new Error("Lỗi khi tải học phí");
            const data = await response.json();
            setFees(data);
        } catch (error) {
            console.error(error);
            setFees([]);
        }
    };

    return (
        <div className="fees-container">
            <h2>💸 Học phí của bạn</h2>
            {fees.length === 0 ? (
                <p>Chưa có dữ liệu học phí.</p>
            ) : (
                <table className="fees-table">
                    <thead>
                        <tr>
                            <th>📚 Số nhóm đăng ký</th> {/* 🔥 Đổi "Số môn đăng ký" → "Số nhóm đăng ký" */}
                            <th>💰 Tổng học phí</th>
                            <th>📅 Ngày đóng gần nhất</th>
                            <th>💳 Đã thanh toán</th>
                            <th>💸 Còn lại</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fees.map((fee) => (
                            <tr key={fee.student_id}>  {/* 🔥 Sửa `fee.id` → `fee.student_id` */}
                                <td>{fee.group_count}</td>  {/* 🔥 Đổi `subject_count` → `group_count` */}
                                <td>{fee.total_fee ? fee.total_fee.toLocaleString() : "N/A"} VNĐ</td>
                                <td>{fee.latest_pay_at ? new Date(fee.latest_pay_at).toLocaleDateString() : "Chưa đóng"}</td>
                                <td>{(fee.already_pay || 0).toLocaleString()} VNĐ</td>
                                <td>{(fee.remaining || 0).toLocaleString()} VNĐ</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            )}
        </div>
    );
};

export default Fees;
