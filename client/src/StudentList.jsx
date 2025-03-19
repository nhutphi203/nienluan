import React, { useState, useEffect } from "react";
import axios from "axios";

const StudentList = () => {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [students, setStudents] = useState([]);
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            console.error("❌ Không tìm thấy thông tin người dùng trong localStorage");
            return;
        }

        const userData = JSON.parse(storedUser);
        const userId = userData.id; // Lấy ID người dùng

        if (!userId) {
            console.error("❌ Không tìm thấy userId!");
            return;
        }

        axios.get(`http://localhost:5000/student/registered-classes/${userId}`)

            .then(res => {
                console.log("✅ Danh sách lớp nhận được:", res.data);
                const classNames = res.data.map(cls => ({ id: cls.id, name: cls.name }));
                setClasses(classNames);
            })
            .catch(err => console.error("❌ Lỗi khi lấy danh sách lớp:", err));
    }, []);

    useEffect(() => {
        if (!selectedClass) return;
        axios.get(`http://localhost:5000/teacher/students?class_id=${selectedClass}`)
            .then(res => setStudents(res.data))
            .catch(err => console.error("❌ Lỗi khi lấy danh sách học viên:", err));
    }, [selectedClass]);

    return (
        <div className="student-container">
            <h2 className="student-title">Danh Sách Học Viên</h2>
            <div className="student-select-group">
                <label>Chọn Lớp:</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                    <option value="">-- Chọn lớp --</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>
            </div>
            <table className="student-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Họ Tên</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => (
                        <tr key={student.id}>
                            <td>{student.id}</td>
                            <td>{student.username}</td>
                            <td>{student.fullName || "(Không có tên)"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StudentList;
