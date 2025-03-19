import { useEffect, useState } from "react";

const TeacherClassRegister = () => {
    const [classes, setClasses] = useState([]);
    const teacherId = JSON.parse(localStorage.getItem("user"))?.id; // Lấy ID giáo viên từ localStorage

    useEffect(() => {
        fetch("http://localhost:5000/teacher/classes/unassigned")
            .then((res) => res.json())
            .then((data) => setClasses(data))
            .catch((error) => console.error("❌ Lỗi khi tải danh sách lớp:", error));
    }, []);

    const handleRegisterClass = (classId, className) => {
        fetch(`http://localhost:5000/teacher/classes/${classId}/assign-teacher`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teacher_id: teacherId }), // Dùng teacherId lấy từ localStorage
        })
            .then((res) => res.json())
            .then((data) => {
                alert(`✅ Bạn đã đăng ký dạy lớp ${className} thành công!`);
                setClasses(classes.filter((cls) => cls.id !== classId));
            })
            .catch((error) => console.error("❌ Lỗi khi đăng ký lớp:", error));
    };

    return (
        <div>
            <h2>Danh sách lớp chưa có giáo viên</h2>
            <table border="1" cellPadding="8" cellSpacing="0">
                <thead>
                    <tr>
                        <th>Tên lớp</th>
                        <th>Trình độ</th>
                        <th>Khối</th>
                        <th>Sĩ số</th>
                        <th>Lịch học</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {classes.length > 0 ? (
                        classes.map((cls) => (
                            <tr key={cls.id}>
                                <td>{cls.name}</td>
                                <td>{cls.type_mapped}</td>
                                <td>{cls.grade}</td>
                                <td>{cls.current_student}/{cls.max_student}</td>
                                <td>{cls.schedule || "Chưa có lịch"}</td>
                                <td>
                                    <button onClick={() => handleRegisterClass(cls.id, cls.name)}>
                                        Đăng ký dạy
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" style={{ textAlign: "center" }}>Không có lớp nào cần giáo viên.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TeacherClassRegister;
