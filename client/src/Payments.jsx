import React, { useEffect, useState } from 'react';
import axios from 'axios';

import 'jspdf-autotable';
import './Payments.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const Payments = ({ studentId }) => {
    const [fees, setFees] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (studentId) {
            fetchFees();
        } else {
            setMessage('Không tìm thấy ID học viên!');
        }
    }, [studentId]);

    const fetchFees = async () => {
        setMessage('');
        try {
            const response = await axios.get(`http://localhost:5000/student/fees/${studentId}`);
            const newFees = Array.isArray(response.data) ? response.data : [];
            setFees(newFees);
        } catch (error) {
            console.error('Lỗi khi tải học phí:', error.response || error);
            setMessage('Có lỗi xảy ra khi tải dữ liệu!');
            setFees([]);
        }
    };

    const handlePayment = async () => {
        if (window.confirm('Bạn có chắc chắn muốn thanh toán học phí?')) {
            try {
                const response = await axios.post(`http://localhost:5000/student/pay`, { studentId });
                if (response.data.success) {
                    setMessage('Thanh toán thành công!');
                    fetchFees();
                } else {
                    setMessage('Thanh toán thất bại!');
                }
            } catch (error) {
                console.error('Lỗi thanh toán:', error);
                setMessage('Có lỗi xảy ra khi thanh toán!');
            }
        }
    };

    // Kiểm tra xem có ít nhất một môn đã thanh toán không
    const hasPaidCourses = fees.some(fee => fee.is_paid);

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Hóa đơn học phí', 14, 10);

        const tableColumn = ['Tên lớp', 'ID lớp', 'Số tiền', 'Trạng thái'];
        const tableRows = [];

        fees.forEach(fee => {
            if (fee.is_paid) {  // Chỉ xuất môn đã thanh toán
                tableRows.push([
                    fee.class_name || 'Không có tên',
                    fee.class_id,
                    `${fee.amount.toLocaleString('vi-VN')} VNĐ`,
                    'Đã thanh toán'
                ]);
            }
        });

        // Gọi autoTable theo cách mới
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save(`HoaDon_${studentId}.pdf`);
    };


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

            <button
                className={`pay-button ${!fees.some(fee => !fee.is_paid) ? 'disabled' : ''}`}
                onClick={handlePayment}
                disabled={!fees.some(fee => !fee.is_paid)}
            >
                Xác nhận thanh toán
            </button>

            {/* Nút Xuất PDF chỉ hiển thị nếu có ít nhất một môn đã thanh toán */}
            {hasPaidCourses && (
                <button className="pdf-button" onClick={exportToPDF}>
                    Xuất hóa đơn PDF
                </button>
            )}

            {message && <div className="message">{message}</div>}
        </div>
    );
};

export default Payments;
