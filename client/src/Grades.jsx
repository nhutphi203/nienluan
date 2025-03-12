import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Grades.css";

const Grades = ({ user }) => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]); // Danh sách lớp
    const [selectedClass, setSelectedClass] = useState(null);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            const storedUser = JSON.parse(localStorage.getItem("user"));
            if (!storedUser) {
                navigate("/login");
                return;
            }
            fetchClasses(storedUser.id);
        } else {
            fetchClasses(user.id);
        }
    }, [user, navigate]);

    const fetchClasses = async (userId) => {
        try {
            const response = await fetch(`http://localhost:5000/student/registered-classes/${userId}`);
            if (!response.ok) throw new Error("Lỗi khi lấy danh sách lớp học.");
            const data = await response.json();
            setClasses(data);

            if (data.length > 0) {
                setSelectedClass(data[0]);
                fetchGrades(userId, data[0].id);
            }
        } catch (error) {
            console.error("❌ Lỗi:", error);
        }
    };

    const fetchGrades = async (userId, classId) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/student/grades/${userId}/${classId}`);
            if (!response.ok) throw new Error("Lỗi khi lấy điểm số.");
            const data = await response.json();
            setGrades(data);
        } catch (error) {
            console.error("❌ Lỗi:", error);
            setGrades([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grades-container">
            <h2>📚 Danh sách lớp học</h2>

            {classes.length === 0 ? (
                <p>❌ Bạn chưa đăng ký lớp học nào.</p>
            ) : (
                <table className="class-table">
                    <thead>
                        <tr>
                            <th>Tên lớp</th>
                            <th>Môn học</th>
                            <th>Lịch học</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classes.map((cls) => (
                            <tr
                                key={cls.id}
                                className={cls.id === selectedClass?.id ? "selected" : ""}
                                onClick={() => {
                                    setSelectedClass(cls);
                                    fetchGrades(user.id, cls.id);
                                }}
                            >
                                <td>{cls.name}</td>
                                <td>{cls.subject}</td>
                                <td>{cls.schedule}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {selectedClass && (
                <div className="grades-section">
                    <h2>📊 Điểm số của lớp {selectedClass.name}</h2>
                    {loading ? (
                        <p>Đang tải...</p>
                    ) : grades.length === 0 ? (
                        <p>📌 Chưa có điểm.</p>
                    ) : (
                        <table className="grades-table">
                            <thead>
                                <tr>
                                    <th>📝 Tên bài kiểm tra</th>
                                    <th>📊 Điểm số</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.map((grade, index) => (
                                    <tr key={index}>
                                        <td>{grade.exam_name}</td>
                                        <td>{grade.score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

        </div>
    );
};

export default Grades;
