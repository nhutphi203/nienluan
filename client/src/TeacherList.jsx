import React, { useEffect, useState } from "react";
import axios from "axios";

const TeacherList = () => {
    const [teachers, setTeachers] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:5000/teachers")
            .then(res => {
                console.log("✅ Danh sách giáo viên:", res.data);
                setTeachers(res.data);
            })
            .catch(err => console.error("❌ Lỗi khi lấy danh sách giáo viên:", err));
    }, []);

    return (
        <div className="teacher-container">
            <h2>Danh Sách Giảng Viên</h2>
            <table className="teacher-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên Đăng Nhập</th>
                        <th>Họ Tên</th>
                        <th>Email</th>
                        <th>Điện Thoại</th>
                    </tr>
                </thead>
                <tbody>
                    {teachers.map(teacher => (
                        <tr key={teacher.id}>
                            <td>{teacher.id}</td>
                            <td>{teacher.username}</td>
                            <td>{teacher.fullName || "Chưa cập nhật"}</td>
                            <td>{teacher.email}</td>
                            <td>{teacher.phone || "Không có"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TeacherList;
