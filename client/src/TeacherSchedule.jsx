import { useEffect, useState } from 'react';
import axios from 'axios';

const TeacherSchedule = () => {
    const [schedule, setSchedule] = useState([]);
    const [teacherId, setTeacherId] = useState(null);

    // Function to fetch teacher schedule
    const fetchTeacherSchedule = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/teacher/schedule/${teacherId}`);
            setSchedule(response.data);
        } catch (error) {
            console.error("Error fetching teacher schedule", error);
        }
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.id) {
            setTeacherId(user.id);  // Set teacher ID from local storage
        }
    }, []);

    useEffect(() => {
        if (teacherId) {
            fetchTeacherSchedule();  // Fetch schedule when teacherId is available
        }
    }, [teacherId]);

    // Function to format the date in "DD-MM-YYYY" format
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    return (
        <div className="schedule-container">
            <h2 className="schedule-title">📅 Lịch giảng dạy của bạn</h2>

            {schedule.length === 0 ? (
                <p className="no-schedule">Không có lịch giảng dạy nào.</p>
            ) : (
                <table className="schedule-table">
                    <thead>
                        <tr>
                            <th>📅 Ngày học</th>
                            <th>📚 Tên nhóm</th>
                            <th>📆 Ngày trong tuần</th>
                            <th>⏰ Giờ bắt đầu</th>
                            <th>⏰ Giờ kết thúc</th>
                            <th>🏫 Phòng học</th>

                        </tr>
                    </thead>
                    <tbody>
                        {schedule.map((item, index) => (
                            <tr key={index}>
                                <td>{formatDate(item.schedule_date)}</td> {/* Format the date here */}
                                <td>{item.group_name}</td>
                                <td>{item.date_of_week}</td>
                                <td>{item.start_at}</td>
                                <td>{item.end_at}</td>
                                <td>{item.classroom_name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TeacherSchedule;
