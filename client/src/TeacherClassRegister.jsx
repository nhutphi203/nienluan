import { useEffect, useState } from "react";

const TeacherClassRegister = () => {
    const [classes, setClasses] = useState([]);
    const [assignedClasses, setAssignedClasses] = useState([]); // Danh sách lớp đã được giáo viên đăng ký
    const teacherId = JSON.parse(localStorage.getItem("user"))?.id; // Lấy ID giáo viên từ localStorage
    const [loadingAssigned, setLoadingAssigned] = useState(true);
    useEffect(() => {
        // Tải danh sách lớp chưa có giáo viên
        fetch("http://localhost:5000/teacher/classes/unassigned")
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    // Nếu có lỗi từ backend, thông báo và trả về
                    alert(`❌ Lỗi khi tải danh sách lớp: ${data.error || "Không xác định"}`);
                    return;
                }
                setClasses(data);
            })
            .catch((error) => console.error("❌ Lỗi khi tải danh sách lớp:", error));

        // Tải danh sách lớp đã đăng ký của giáo viên
        fetch(`http://localhost:5000/teacher/classes/assigned/${teacherId}`)
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    // Nếu có lỗi từ backend, thông báo và trả về
                    alert(`❌ Lỗi khi tải lớp đã đăng ký: ${data.error || "Không xác định"}`);
                    setLoadingAssigned(false);
                    return;
                }
                console.log("📦 Dữ liệu từ backend:", data);
                setAssignedClasses(data);
                setLoadingAssigned(false); // ✅ Đã load xong
            })
            .catch((error) => {
                console.error("❌ Lỗi khi tải danh sách lớp đã đăng ký:", error);
                setLoadingAssigned(false); // Kể cả lỗi vẫn kết thúc
            });
    }, [teacherId]);



    // Hàm chuẩn hóa lịch học thành dạng mảng ngày/thời gian để so sánh
    const normalizeSchedule = (schedule) => {
        if (!schedule) return [];
        // Giả sử lịch học có định dạng như: "monday (17:20:00 - 19:00:00)", "wednesday (17:20:00 - 19:00:00)"
        return schedule.split("\n").map(item => {
            const match = item.match(/([a-zA-Z]+)\s\(([\d:]+)\s-\s([\d:]+)\)/);
            if (match) {
                return { day: match[1], start: match[2], end: match[3] };
            }
            return null;
        }).filter(Boolean);
    };
    // Chuyển giờ dạng chuỗi thành số phút để dễ so sánh
    const toMinutes = (timeStr) => {
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
    };

    // Kiểm tra hai khoảng thời gian có giao nhau không
    const isTimeOverlap = (startA, endA, startB, endB) => {
        const sA = toMinutes(startA);
        const eA = toMinutes(endA);
        const sB = toMinutes(startB);
        const eB = toMinutes(endB);
        return sA < eB && sB < eA;
    };

    const isScheduleConflict = (newSchedule) => {
        const newScheduleNormalized = normalizeSchedule(newSchedule);

        return assignedClasses.some((assignedClass) => {
            const assignedScheduleNormalized = normalizeSchedule(assignedClass.schedule);

            return newScheduleNormalized.some(newItem =>
                assignedScheduleNormalized.some(assignedItem =>
                    newItem.day.toLowerCase() === assignedItem.day.toLowerCase() &&
                    isTimeOverlap(newItem.start, newItem.end, assignedItem.start, assignedItem.end)
                )
            );
        });
    };
    const handleRegisterClass = (classId, className, classSchedule) => {
        if (loadingAssigned) {
            alert("⏳ Đang tải danh sách lớp đã đăng ký, vui lòng đợi...");
            return;
        }

        // Kiểm tra nếu lịch lớp mới trùng với lịch lớp đã đăng ký
        if (isScheduleConflict(classSchedule)) {
            alert(`❌ Lịch dạy lớp ${className} trùng với lớp đã đăng ký trước đó.`);
            return; // Không tiếp tục đăng ký nếu trùng lịch
        }

        // Gửi yêu cầu đăng ký lớp
        fetch(`http://localhost:5000/teacher/classes/${classId}/assign-teacher`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teacher_id: teacherId }),
        })
            .then((res) => res.json())
            .then((data) => {
                console.log('Dữ liệu phản hồi từ server:', data); // In ra để kiểm tra

                // Kiểm tra thông báo từ server
                if (!data.message || !data.message.includes("Gán giáo viên thành công")) {
                    alert(`❌ Lớp ${className} trùng lịch!`);
                    return; // Nếu không có thông báo thành công, thì đăng ký thất bại
                }

                // Đăng ký thành công, thông báo cho người dùng
                alert(`✅ Bạn đã đăng ký dạy lớp ${className} thành công!`);

                // Cập nhật lại danh sách lớp chưa có giáo viên (xóa lớp đã đăng ký)
                setClasses(classes.filter((cls) => cls.id !== classId));

                // Cập nhật lại danh sách lớp đã đăng ký của giáo viên
                fetch(`http://localhost:5000/teacher/classes/assigned/${teacherId}`)
                    .then((res) => res.json())
                    .then((assignedData) => {
                        if (assignedData && Array.isArray(assignedData)) {
                            setAssignedClasses(assignedData);
                        } else {
                            console.error("Lỗi khi lấy danh sách lớp đã đăng ký.");
                        }
                    })
                    .catch((error) => console.error("❌ Lỗi khi tải lại danh sách lớp đã đăng ký:", error));
            })
            .catch((error) => {
                console.error("❌ Lỗi khi đăng ký lớp:", error);
            });


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
                                    <button
                                        onClick={() => handleRegisterClass(cls.id, cls.name, cls.schedule)}>
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
