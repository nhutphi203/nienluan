import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TeacherGradesInput.css"; // Import CSS

const TeacherGradeInput = () => {
    const [classes, setClasses] = useState([]); // Chỉ lưu danh sách tên nhóm
    const [selectedClass, setSelectedClass] = useState(""); // Nhóm đã chọn
    const [students, setStudents] = useState([]); // Học viên trong nhóm
    const [scores, setScores] = useState({}); // Lưu điểm nhập vào
    const [examName, setExamName] = useState("Bài kiểm tra"); // Mặc định là "Bài kiểm tra"

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            console.error("❌ Không tìm thấy thông tin người dùng trong localStorage");
            return;
        }

        const userData = JSON.parse(storedUser);
        const teacherId = userData.id; // Đảm bảo rằng ID giáo viên tồn tại

        if (!teacherId) {
            console.error("❌ Không tìm thấy teacherId!");
            return;
        }

        axios.get(`http://localhost:5000/teacher/teacher/classes/${teacherId}`)
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

    const handleScoreChange = (studentId, value) => {
        if (/^[1-9]$/.test(value) || value === "") {
            setScores(prev => ({ ...prev, [studentId]: value }));
        }
    };
    const handleSubmit = (studentId) => {
        const score = parseInt(scores[studentId], 10);

        if (isNaN(score) || score < 0 || score > 9) {
            return alert("⚠️ Vui lòng nhập điểm từ 1 đến 9!");
        }

        if (!selectedClass) {
            return alert("Lỗi: Không tìm thấy class_id!");
        }

        axios.post("http://localhost:5000/teacher/grades", {
            student_id: studentId,
            class_id: selectedClass,
            score,
            exam_name: examName, // Gửi tên bài kiểm tra
            exam_date: new Date().toISOString().split('T')[0]
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(() => {
                alert("✅ Nhập điểm thành công!");
                setScores(prev => ({ ...prev, [studentId]: "" }));
            })
            .catch(err => {
                console.error("❌ Lỗi khi nhập điểm:", err);
                alert("⚠️ Lỗi khi nhập điểm! Vui lòng thử lại.");
            });
    };

    return (
        <div className="teacher-container">
            <h2 className="teacher-title">Nhập Điểm Học Viên</h2>
            <div className="teacher-header">
                <div className="teacher-exam-name">
                    <label>Tên bài kiểm tra:</label>
                    <input
                        type="text"
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        placeholder="Nhập tên bài kiểm tra"
                    />
                </div>

                <div className="teacher-select-group">
                    <label>Chọn Nhóm:</label>
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                        <option value="">-- Chọn nhóm --</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name}
                            </option>
                        ))}
                    </select>
                </div>
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
                            <td>{student.fullName || "(Không có tên)"}</td>
                            <td>
                                <input
                                    type="text"
                                    className="teacher-input"
                                    value={scores[student.id] || ""}
                                    onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                    placeholder="1-9"
                                    maxLength={2}
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

// ✅ Xuất component đúng vị trí
export default TeacherGradeInput;
