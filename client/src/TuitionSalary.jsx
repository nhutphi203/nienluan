import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import './TuitionSalary.css';
const TuitionSalary = () => {
    const [revenues, setRevenues] = useState([]);
    const [studentsPaid, setStudentsPaid] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRevenueData();
        fetchStudentsPaidData();
    }, []);

    const fetchRevenueData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('http://localhost:5000/manager/revenue');
            const data = response.data || [];
            setRevenues(data);
            calculateSummary(data);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu doanh thu:', error);
            setError('Không thể tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentsPaidData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/manager/students/paid');
            setStudentsPaid(response.data || []);
        } catch (error) {
            console.error('Lỗi khi tải danh sách sinh viên đóng tiền:', error);
        }
    };

    const calculateSummary = (data) => {
        const total = data.reduce((sum, item) => sum + parseFloat(item.revenue), 0);
        setTotalRevenue(total);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Báo cáo doanh thu & Danh sách sinh viên đã đóng tiền', 14, 10);

        autoTable(doc, {
            head: [['Ngày', 'Doanh thu']],
            body: revenues.map(item => [
                new Date(item.date).toLocaleDateString('vi-VN'),
                `${parseFloat(item.revenue).toLocaleString('vi-VN')} VNĐ`
            ])
        });

        doc.addPage();
        autoTable(doc, {
            head: [['#', 'Họ và Tên', 'Số điện thoại', 'Số tiền đã đóng', 'Ngày đóng']],
            body: studentsPaid.map((student, index) => [
                index + 1,
                student.fullName || 'N/A',
                student.phone || 'N/A',
                `${parseFloat(student.already_pay).toLocaleString('vi-VN')} VNĐ`,
                new Date(student.latest_pay_at).toLocaleDateString('vi-VN')
            ])
        });

        doc.save('BaoCaoDoanhThu_SinhVienDaDongTien.pdf');
    };

    const exportToExcel = () => {
        const revenueSheet = XLSX.utils.json_to_sheet(
            revenues.map(item => ({
                'Ngày': new Date(item.date).toLocaleDateString('vi-VN'),
                'Doanh thu': `${parseFloat(item.revenue).toLocaleString('vi-VN')} VNĐ`
            }))
        );

        const studentsSheet = XLSX.utils.json_to_sheet(
            studentsPaid.map((student, index) => ({
                '#': index + 1,
                'Họ và Tên': student.fullName || 'N/A',
                'Số điện thoại': student.phone || 'N/A',
                'Số tiền đã đóng': student.total_pay
                    ? `${parseFloat(student.total_pay || 0).toLocaleString('vi-VN')} VNĐ`
                    : '0 VNĐ',
                'Ngày đóng': new Date(student.latest_pay_at).toLocaleDateString('vi-VN')
            }))
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue');
        XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students Paid');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(data, 'BaoCaoDoanhThu_SinhVienDaDongTien.xlsx');
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quản lý Doanh Thu & Thanh Toán Học Phí</h2>

            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <><input
                    type="text"
                    placeholder="Tìm kiếm theo họ tên hoặc số điện thoại..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border p-2 mb-4 w-full"
                />

                    <h3 className="text-lg font-semibold mt-4">Doanh thu theo ngày</h3>
                    <table className="w-full border-collapse border border-gray-300 my-4">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2">Ngày</th>
                                <th className="border p-2">Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {revenues.map((item, index) => (
                                <tr key={index}>
                                    <td className="border p-2">{new Date(item.date).toLocaleDateString('vi-VN')}</td>
                                    <td className="border p-2">{parseFloat(item.revenue).toLocaleString('vi-VN')} VNĐ</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p><strong>Tổng doanh thu:</strong> {totalRevenue.toLocaleString('vi-VN')} VNĐ</p>

                    <h3 className="text-lg font-semibold mt-6">Sinh viên đã đóng tiền</h3>
                    <table className="w-full border-collapse border border-gray-300 my-4">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2">#</th>
                                <th className="border p-2">Họ và Tên</th>
                                <th className="border p-2">Số điện thoại</th>
                                <th className="border p-2">Số tiền đã đóng</th>
                                <th className="border p-2">Ngày đóng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentsPaid.filter(student =>
                                (student.fullName && student.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                (student.phone && student.phone.includes(searchTerm)) ||
                                (student.latest_pay_at &&
                                    new Date(student.latest_pay_at).toLocaleDateString('vi-VN').includes(searchTerm))
                            ).length > 0 ? (
                                studentsPaid
                                    .filter(student =>
                                        (student.fullName && student.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                        (student.phone && student.phone.includes(searchTerm)) ||
                                        (student.latest_pay_at &&
                                            new Date(student.latest_pay_at).toLocaleDateString('vi-VN').includes(searchTerm))
                                    )
                                    .map((student, index) => (
                                        <tr key={index}>
                                            <td className="border p-2">{index + 1}</td>
                                            <td className="border p-2">{student.fullName || 'N/A'}</td>
                                            <td className="border p-2">{student.phone || 'N/A'}</td>
                                            <td className="border p-2">
                                                {student.total_pay
                                                    ? `${parseFloat(student.total_pay).toLocaleString('vi-VN')} VNĐ`
                                                    : '0 VNĐ'}
                                            </td>
                                            <td className="border p-2">{new Date(student.latest_pay_at).toLocaleDateString('vi-VN')}</td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="border p-2 text-center text-gray-500">⭐ Không có dữ liệu phù hợp ⭐</td>
                                </tr>
                            )}
                        </tbody>


                    </table>

                    <div className="mt-4">
                        <button onClick={exportToPDF} className="bg-blue-500 text-white px-4 py-2 mr-2 rounded">Xuất PDF</button>
                        <button onClick={exportToExcel} className="bg-green-500 text-white px-4 py-2 rounded">Xuất Excel</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default TuitionSalary;
