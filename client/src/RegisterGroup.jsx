import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RegisterGroup = () => {
    const navigate = useNavigate();
    const storedUser = localStorage.getItem("user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    const [classes, setClasses] = useState([]);
    const [noClassesAvailable, setNoClassesAvailable] = useState(false);
    const fetchClasses = useCallback(async () => {
        if (!currentUser?.id) return; // 🔥 Kiểm tra có user ID trước khi gọi API

        try {
            console.log("📌 Fetching classes..."); // Debug tránh spam log

            const res = await axios.get(`http://localhost:5000/student/available-classes`);
            console.log("📩 Dữ liệu từ API:", res.data); // Kiểm tra dữ liệu

            if (Array.isArray(res.data) && res.data.length > 0) {
                setNoClassesAvailable(false);
                setClasses(groupByClass(res.data));
            } else {
                setNoClassesAvailable(true);
                setClasses([]);
            }
        } catch (err) {
            console.error("❌ Lỗi tải danh sách lớp học:", err);
        }
    }, [currentUser?.id]); // 🔥 Chỉ phụ thuộc vào user ID (tránh dependency thay đổi liên tục)


    useEffect(() => {
        if (!currentUser) {
            navigate("/login");
        } else {
            console.log("🔥 Component mounted, fetching classes...");
            fetchClasses(); // Chỉ gọi một lần
        }
    }, []); // ⚠️ XÓA `fetchClasses` khỏi dependency list


    const handleRegister = async (classId) => {
        try {
            const response = await axios.post(
                "http://localhost:5000/student/register-group",
                { userId: currentUser.id, classId },
                { headers: { Authorization: `Bearer ${currentUser.token}` } }
            );
            console.log("📌 Phản hồi từ API:", response.data); // Debug
            alert(response.data.message || "Đăng ký thành công!");
            localStorage.setItem("classId", classId);
            console.log("✅ classId đã lưu:", classId);
            await fetchClasses(); // 🔥 Cập nhật danh sách lớp học sau khi đăng ký
        } catch (error) {
            console.error("❌ Lỗi đăng ký lớp học:", error);

            // 📌 Kiểm tra lỗi từ server trả về
            if (error.response) {
                console.error("📩 Lỗi từ server:", error.response.data);
                alert(error.response.data.error || "Đăng ký thất bại!");
            } else {
                alert("Lỗi kết nối, vui lòng thử lại!");
            }
        }
    };

    const groupByClass = (data) => {
        console.log("📌 Dữ liệu trước khi xử lý:", data);
        const grouped = data.map((item) => ({
            id: item.id,
            name: item.name,
            subject: item.subject,
            type: item.type,
            grade: item.grade,
            max_student: item.max_student,
            current_student: item.current_student || 0,
            remaining_students: item.max_student - (item.current_student || 0),
            schedule: item.schedule
                ? item.schedule.split(", ").map((sch) => { // Sửa lại ở đây
                    const match = sch.match(/(\w+) \((\d{2}:\d{2}:\d{2}) - (\d{2}:\d{2}:\d{2})\)/);
                    return match ? { date_of_week: match[1], start_at: match[2], end_at: match[3] } : null;
                }).filter(Boolean)
                : [],
        }));
        console.log("✅ Dữ liệu sau khi xử lý:", grouped);
        return grouped;
    };


    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Đăng ký lớp học</h2>
            <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse border border-gray-200">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Tên lớp</th>
                            <th className="border p-2 text-left">Loại</th>
                            <th className="border p-2 text-left">Môn học</th>
                            <th className="border p-2 text-left">Khối</th>
                            <th className="border p-2 text-left">Còn lại</th>
                            <th className="border p-2 text-left">Lịch học</th>
                            <th className="border p-2 text-center">Đăng ký</th>
                        </tr>
                    </thead>
                    <tbody>
                        {noClassesAvailable ? (
                            <tr>
                                <td colSpan="6" className="border p-4 text-center text-gray-500">
                                    Đã đăng ký hết lớp học. Không còn lớp nào để đăng ký.
                                </td>
                            </tr>
                        ) : (
                            classes.map((cls) => (
                                <tr key={cls.id} className="hover:bg-gray-50">
                                    <td className="border p-2">{cls.name}</td>
                                    <td className="border p-2">{cls.type}</td>
                                    <td className="border p-2">{cls.subject}</td>

                                    <td className="border p-2">{cls.grade}</td>
                                    <td className="border p-2">{cls.remaining_students} chỗ trống</td>
                                    <td className="border p-2">
                                        <ul className="list-disc pl-4">
                                            {cls.schedule.length > 0 ? (
                                                cls.schedule.map((sch, index) => (
                                                    <li key={index}>
                                                        {sch.date_of_week}: {sch.start_at} - {sch.end_at}
                                                    </li>
                                                ))
                                            ) : (
                                                <span className="text-gray-500">Chưa có lịch học</span>
                                            )}
                                        </ul>
                                    </td>
                                    <td className="border p-2 text-center">
                                        <button
                                            onClick={() => handleRegister(cls.id)}
                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Đăng ký
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <button
                onClick={() => navigate("/")}
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
                Quay lại
            </button>
        </div>
    );
};

export default RegisterGroup;
