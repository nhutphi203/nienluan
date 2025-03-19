import { useEffect, useState } from "react";
import axios from "axios";

const TeacherSchedule = () => {
    const [schedule, setSchedule] = useState([]);
    const [teacherId, setTeacherId] = useState(null);

    const fetchTeacherSchedule = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/teacher/teacher/classes/${teacherId}`);

            console.log("📅 Dữ liệu lịch dạy nhận được:", response.data); // Log dữ liệu API
            setSchedule(response.data);
        } catch (error) {
            console.error("❌ Lỗi khi lấy lịch giảng dạy:", error);
        }
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.id) {
            setTeacherId(user.id); // Lấy ID giáo viên từ localStorage
        }
    }, []);

    useEffect(() => {
        if (teacherId) {
            fetchTeacherSchedule(); // Gọi API khi có teacherId
        }
    }, [teacherId]);

    return (
        <div className="schedule-container">
            <h2 className="schedule-title">📅 Lịch giảng dạy của bạn</h2>

            {schedule.length === 0 ? (
                <p className="no-schedule">Không có lịch giảng dạy nào.</p>
            ) : (
                <table className="schedule-table">
                    <thead>
                        <tr>
                            <th>📚 Tên lớp</th>
                            <th>📖 Loại lớp</th>
                            <th>🎓 Khối</th>
                            <th>👨‍🎓 Số học viên</th>
                            <th>📅 Lịch học</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedule.map((item, index) => (
                            <tr key={index}>
                                <td>{item.name}</td> {/* Tên lớp */}
                                <td>{item.type_mapped}</td> {/* Loại lớp đã được ánh xạ */}
                                <td>{item.grade}</td> {/* Khối lớp */}
                                <td>{item.current_student} / {item.max_student}</td> {/* Số học viên */}
                                <td>{item.schedule}</td> {/* Lịch học */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TeacherSchedule;
