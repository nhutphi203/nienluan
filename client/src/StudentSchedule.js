import axios from "axios";
import { useEffect, useState } from "react";

const StudentSchedule = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🔥 Lấy userID từ localStorage khi người dùng đã đăng nhập
    const userId = localStorage.getItem("userID");
    console.log("🔍 userID:", userId); // Kiểm tra userId có giá trị không
    useEffect(() => {
        if (!userId) {
            console.error("❌ Không tìm thấy userID, vui lòng đăng nhập lại!");
            setError("Bạn cần đăng nhập để xem lịch học!");
            setLoading(false);
            return;
        }

        const fetchSchedule = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/student/registered-classes/${userId}`);
                setSchedule(response.data);
            } catch (error) {
                console.error("❌ Lỗi khi lấy lịch học:", error);
                setError("Không thể tải lịch học, vui lòng thử lại!");
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [userId]);



    if (loading) return <p>⏳ Đang tải lịch học...</p>;
    if (error) return <p style={{ color: "red" }}>⚠️ {error}</p>;
    if (schedule.length === 0) return <p>📌 Bạn chưa đăng ký lớp nào.</p>;

    return (
        <div>
            <h2>📅 Lịch học của bạn</h2>
            <ul>
                {schedule.map((classItem) => (
                    <li key={classItem.id}>
                        <strong>{classItem.name} ({classItem.subject})</strong> <br />
                        ⏰ Lịch học: {classItem.schedule.split("; ").map((time, index) => (
                            <div key={index}>📌 {time}</div>
                        ))}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default StudentSchedule;
