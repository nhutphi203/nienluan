import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TeacherGradesInput.css";  // Import CSS

const TeacherGradeInput = () => {
    const [classes, setClasses] = useState([]);  // Danh sách nhóm
    const [selectedClass, setSelectedClass] = useState("");  // Nhóm đã chọn
    const [students, setStudents] = useState([]);  // Học viên trong nhóm
    const [scores, setScores] = useState({});  // Lưu điểm nhập vào

    // Lấy danh sách nhóm từ API
    useEffect(() => {
        axios.get("http://localhost:5000/teacher/class")
            .then(res => setClasses(res.data))
            .catch(err => console.error("Lỗi khi lấy danh sách nhóm:", err));
    }, []);

    useEffect(() => {
        if (!selectedClass) return;
        axios.get(`http://localhost:5000/teacher/students?class_id=${selectedClass}`)
            .then(res => {
                console.log("Dữ liệu học viên nhận được:", res.data); // Debug
                setStudents(res.data);
            })
            .catch(err => console.error("Lỗi khi lấy danh sách học viên:", err));
    }, [selectedClass]);


    const handleScoreChange = (studentId, value) => {
        setScores(prev => ({ ...prev, [studentId]: value }));
    };
    const handleSubmit = (studentId) => {
        const score = parseFloat(scores[studentId]);

        if (isNaN(score)) {
            return alert("Vui lòng nhập điểm hợp lệ!");
        }

        if (!selectedClass) {
            return alert("Lỗi: Không tìm thấy class_id!");
        }

        axios.post("http://localhost:5000/teacher/grades", {
            student_id: studentId,
            class_id: selectedClass,
            score,
            exam_name: "Bài kiểm tra",
            exam_date: new Date().toISOString().split('T')[0]
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(() => {
                alert("Nhập điểm thành công!");
                setScores(prev => ({ ...prev, [studentId]: "" }));
            })
            .catch(err => {
                console.error("❌ Lỗi khi nhập điểm:", err);
                alert("Lỗi khi nhập điểm! Vui lòng thử lại.");
            });
    };


    return (
        <div className="teacher-container">
            <h2 className="teacher-title">Nhập Điểm Học Viên</h2>

            {/* Dropdown chọn nhóm */}
            <div className="teacher-select-group">
                <label>Chọn Nhóm: </label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                    <option value="">-- Chọn nhóm --</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                            {cls.name}
                        </option>
                    ))}
                </select>
            </div>

            <table className="teacher-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Họ Tên</th>
                        <th>Nhập Điểm</th>
                        <th>Xác Nhận</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => (
                        <tr key={student.id}>
                            <td>{student.id}</td>
                            <td>{student.fullName || "(Không có tên)"}</td> {/* Kiểm tra hiển thị */}
                            <td>
                                <input
                                    type="number"
                                    className="teacher-input"
                                    value={scores[student.id] || ""}
                                    onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                    placeholder="0-100"
                                    min="0"
                                    max="100"
                                />
                            </td>
                            <td>
                                <button
                                    onClick={() => handleSubmit(student.id)}
                                    className="teacher-btn"
                                >
                                    Xác nhận
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TeacherGradeInput;
