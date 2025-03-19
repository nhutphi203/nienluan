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

    const hasPaidCourses = fees.some(fee => fee.is_paid);

    return (
        <div className="fee-container">
            <h2>Thanh toán học phí</h2>
            <table className="fee-table">
                <thead>
                    <tr>
                        <th>Tên lớp</th>
                        <th>ID lớp</th>
                        <th>Số tiền</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {fees.length > 0 ? (
                        fees.map(fee => (
                            <tr key={fee.class_id}>
                                <td>{fee.class_name || 'Không có tên'}</td>
                                <td>{fee.class_id}</td>
                                <td>{fee.amount.toLocaleString('vi-VN')} VNĐ</td>
                                <td className={fee.is_paid ? 'paid' : 'unpaid'}>
                                    {fee.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4">Không có dữ liệu học phí</td>
                        </tr>
                    )}
                </tbody>
            </table>



        </div>
    );
};


export default Fees;
