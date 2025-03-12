import { useEffect, useState } from "react";

const ManageSchedules = () => {
    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5000/manager/schedules") // Kiểm tra URL này
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Lỗi HTTP! Status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => setSchedules(data))
            .catch((error) => console.error("Lỗi khi lấy thời khóa biểu:", error));
    }, []);


    return (
        <div>
            <h2>Quản lý Thời Khóa Biểu</h2>
            <table border="1">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Lớp</th>
                        <th>Giáo viên</th>
                        <th>Thứ</th>
                        <th>Giờ bắt đầu</th>
                        <th>Giờ kết thúc</th>
                    </tr>
                </thead>
                <tbody>
                    {schedules.map((schedule) => (
                        <tr key={schedule.id}>
                            <td>{schedule.id}</td>
                            <td>{schedule.class_name}</td>
                            <td>{schedule.teacher_name}</td>
                            <td>{schedule.day_of_week}</td>
                            <td>{schedule.start_time}</td>
                            <td>{schedule.end_time}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageSchedules;
