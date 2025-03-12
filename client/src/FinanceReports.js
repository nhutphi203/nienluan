import { useState, useEffect } from "react";
import { FaFileExcel, FaEye } from "react-icons/fa";
import * as XLSX from "xlsx";


const FinancialReports = () => {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        // Giả lập dữ liệu báo cáo tài chính
        const fakeReports = [
            { id: 1, month: "Tháng 1", revenue: 50000000, expenses: 20000000, profit: 30000000 },
            { id: 2, month: "Tháng 2", revenue: 60000000, expenses: 25000000, profit: 35000000 },
            { id: 3, month: "Tháng 3", revenue: 55000000, expenses: 22000000, profit: 33000000 },
        ];
        setReports(fakeReports);
    }, []);

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(reports);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Báo Cáo Tài Chính");
        XLSX.writeFile(workbook, "FinancialReports.xlsx");
    };

    return (
        <div className="financial-reports-container">
            <h2>Quản lý báo cáo tài chính</h2>
            <button className="export-btn" onClick={exportToExcel}>
                <FaFileExcel /> Xuất Excel
            </button>
            <table>
                <thead>
                    <tr>
                        <th>Tháng</th>
                        <th>Doanh thu</th>
                        <th>Chi phí</th>
                        <th>Lợi nhuận</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {reports.map((report) => (
                        <tr key={report.id}>
                            <td>{report.month}</td>
                            <td>{report.revenue.toLocaleString()} VNĐ</td>
                            <td>{report.expenses.toLocaleString()} VNĐ</td>
                            <td>{report.profit.toLocaleString()} VNĐ</td>
                            <td>
                                <button className="view-btn">
                                    <FaEye /> Xem
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FinancialReports;
