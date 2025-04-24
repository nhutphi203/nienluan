import { useState, useEffect } from "react";

function ManageGroups() {
    const [groups, setGroups] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [types, setTypes] = useState([]);
    const [grades, setGrades] = useState([]);
    const [maxStudents, setMaxStudents] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const [editingClass, setEditingClass] = useState(null); // Lưu thông tin lớp đang chỉnh sửa
    const [newGroup, setNewGroup] = useState({
        name: "",
        subject: "",
        type: "",
        grade: "",
        max_student: "",
        schedule: [],
        fee_amount: 500000  // ✅ Đặt mặc định học phí ở đây
    });

    const [groupOptions, setGroupOptions] = useState({
        subjects: [],
        types: [],
        grades: [],
        max_students: [],
        schedules: []
    });
    useEffect(() => {
        console.log("📌 Cập nhật groupOptions.schedules:", schedule);
    }, [schedule]);


    // Lấy dữ liệu từ API
    useEffect(() => {
        fetch("http://localhost:5000/student/available-classes")
            .then((res) => res.json())
            .then((data) => {
                console.log("📌 Dữ liệu API trước khi xử lý:", data);
                setGroups(groupByClass(data))
                console.log("groupOptions.schedules:", groupOptions?.schedules);

                console.log("📌 Dữ liệu sau khi groupByClass:", groupByClass(data));
            })

            .catch((err) => console.error("Lỗi khi lấy danh sách lớp:", err));

        fetch("http://localhost:5000/manager/group-options") // API trả về các danh mục
            .then((res) => res.json())
            .then((data) => {
                console.log("📌 Dữ liệu group-options:", data);

                setSubjects(data.subjects || []);
                setTypes(data.types || []);
                setGrades(data.grades || []);
                setMaxStudents(data.max_students || []);
                setGroupOptions(prev => ({ ...prev, schedules: data.schedules || [] }));
            })
            .catch((err) => console.error("Lỗi khi lấy dữ liệu danh mục:", err));
    }, []);
    const handleEdit = (cls) => {
        console.log("📌 Đang chỉnh sửa nhóm:", cls);
        setEditingClass({
            ...cls,
            schedule: cls.schedule || [], // Đảm bảo lịch học tồn tại hoặc là mảng rỗng
        });
    };


    // Hàm này dùng để gọi lại API lấy danh sách lớp
    const fetchGroups = () => {
        fetch("http://localhost:5000/student/available-classes")
            .then((res) => res.json())
            .then((data) => {
                setGroups(groupByClass(data));
            })
            .catch((err) => console.error("Lỗi khi lấy danh sách lớp:", err));
    };

    const handleDelete = (id) => {
        if (window.confirm("Bạn có chắc muốn xóa lớp này?")) {
            fetch(`http://localhost:5000/manager/group/${id}`, { method: "DELETE" })
                .then(async (res) => {
                    console.log("Phản hồi HTTP:", res); // Kiểm tra phản hồi từ server

                    // Kiểm tra nếu phản hồi không phải JSON
                    const text = await res.text();
                    console.log("Phản hồi dạng text:", text);

                    try {
                        const jsonData = JSON.parse(text);
                        console.log("Phản hồi dạng JSON:", jsonData);

                        if (!res.ok) {
                            throw new Error(jsonData.error || "Lỗi khi xóa nhóm");
                        }

                        alert(jsonData.message || "Xóa nhóm thành công");
                        setGroups(prevGroups => prevGroups.filter((g) => g.id !== id));
                    } catch (error) {
                        throw new Error("Phản hồi không phải JSON hợp lệ");
                    }
                })
                .catch((err) => {
                    console.error("❌ Lỗi khi xóa nhóm học:", err);
                    alert("Lỗi khi xóa nhóm học: " + err.message);
                });
        }
    };

    const handleCreateGroup = () => {
        console.log("📌 Danh sách khung giờ khi gửi:", newGroup.schedule);

        if (!newGroup.schedule || newGroup.schedule.length === 0) {
            alert("Vui lòng chọn ít nhất một khung giờ học!");
            return;
        }

        fetch("http://localhost:5000/manager/group", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...newGroup,
                period_time_ids: newGroup.schedule, // Đặt period_time_ids từ schedule
                fee_amount: newGroup.fee_amount // ✅ THÊM DÒNG NÀY
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                alert(data.message);
                fetch("http://localhost:5000/student/available-classes") // Cập nhật danh sách nhóm học
                    .then((res) => res.json())
                    .then((updatedData) => {
                        console.log("📌 Danh sách mới sau khi thêm:", updatedData);
                        setGroups(groupByClass(updatedData));
                    });

                // Reset dữ liệu nhóm mới
                setNewGroup({ name: "", subject: "", type: "", grade: "", max_student: "", schedule: [] });
            })
            .catch((err) => console.error("Lỗi khi tạo nhóm học:", err));
    };
    const handleScheduleChange = (scheduleId) => {
        setNewGroup((prevGroup) => {
            const isSelected = prevGroup.schedule.includes(scheduleId);
            const updatedSchedule = isSelected
                ? prevGroup.schedule.filter(id => id !== scheduleId)  // Bỏ chọn nếu đã chọn trước đó
                : [...prevGroup.schedule, scheduleId];  // Thêm nếu chưa chọn

            console.log("📌 Danh sách khung giờ đã chọn:", updatedSchedule);

            return { ...prevGroup, schedule: updatedSchedule };
        });
    }; const handleUpdateGroup = () => {
        if (!editingClass) {
            alert("Không có nhóm học nào để chỉnh sửa.");
            return;
        }

        // Kiểm tra các trường cần thiết có hợp lệ không
        if (!editingClass.name || !editingClass.subject || !editingClass.type || !editingClass.grade || !editingClass.max_student) {
            alert("Vui lòng điền đầy đủ thông tin nhóm học!");
            return;
        }

        if (editingClass.schedule.length === 0) {
            alert("Vui lòng chọn ít nhất một khung giờ học.");
            return;
        }

        // Gửi yêu cầu PUT đến API
        fetch(`http://localhost:5000/manager/group/${editingClass.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: editingClass.name,
                subject: editingClass.subject,
                type: editingClass.type,
                grade: editingClass.grade,
                max_student: editingClass.max_student,
                period_time_ids: editingClass.schedule, // Gửi các ID của khung giờ học
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) { // Kiểm tra phản hồi từ server
                    alert("Cập nhật thành công!");
                    setEditingClass(null); // Đóng form chỉnh sửa
                    fetchGroups(); // Làm mới danh sách nhóm học
                } else {
                    alert("Cập nhật thất bại. Lý do: " + data.message);
                }
            })
            .catch((err) => {
                console.error("❌ Lỗi khi cập nhật nhóm học:", err);
                alert("Có lỗi xảy ra khi cập nhật.");
            });
    };




    // Xử lý nhóm dữ liệu lớp học
    const groupByClass = (data) => {
        const gradeMapping = { 1: "Lớp 10", 2: "Lớp 11", 3: "Lớp 12" };

        return data.map((item) => ({
            id: item.id,
            name: item.name,
            subject: item.subject,
            type: item.type,

            grade: gradeMapping[item.grade] || item.grade,
            max_student: item.max_student,
            current_student: item.current_student || 0,
            remaining_students: item.max_student - (item.current_student || 0),
            schedule: item.schedule
                ? String(item.schedule).split(", ").map((sch) => {
                    const match = sch.match(/(\w+) \((\d{2}:\d{2}:\d{2}) - (\d{2}:\d{2}:\d{2})\)/);
                    return match ? { date_of_week: match[1], start_at: match[2], end_at: match[3] } : null;
                }).filter(Boolean)
                : [],

        }));
    };


    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Quản lý Nhóm Học</h2>


            {/* Form tạo nhóm mới */}
            <div className="mb-6 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Tạo nhóm mới</h3>
                <input
                    type="text"
                    placeholder="Tên lớp"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    className="w-full p-2 border rounded mb-2"
                />

                <select
                    value={newGroup.subject}
                    onChange={(e) => setNewGroup({ ...newGroup, subject: e.target.value })}
                    className="w-full p-2 border rounded mb-2"
                >
                    <option value="">Chọn môn học</option>
                    {subjects
                        .filter((subj) => subj !== null) // 🔥 Bỏ giá trị null
                        .map((subj, index) => (
                            <option key={subj || index} value={subj}>{subj}</option> // 🔥 Dùng index nếu subj bị null
                        ))}
                </select>

                <select
                    value={newGroup.type}
                    onChange={(e) => setNewGroup({ ...newGroup, type: e.target.value })}
                    className="w-full p-2 border rounded mb-2"
                >
                    <option value="">Chọn loại lớp</option>
                    {types
                        .filter((type) => type !== null)
                        .map((type, index) => (
                            <option key={type || index} value={type}>{type}</option>
                        ))}
                </select>

                <select

                    value={newGroup.grade}
                    onChange={(e) => setNewGroup({ ...newGroup, grade: e.target.value })}
                    className="w-full p-2 border rounded mb-2"
                >
                    <option value="">Chọn khối</option>
                    {grades
                        .filter((grade) => grade !== null)
                        .map((grade, index) => (
                            <option key={grade || index} value={grade}>{grade}</option>
                        ))}
                </select>
                <input
                    type="number"
                    placeholder="Học phí"
                    value={newGroup.fee_amount}
                    onChange={(e) => setNewGroup({ ...newGroup, fee_amount: e.target.value })}
                    className="w-full p-2 border rounded mb-2"
                />

                <select
                    value={newGroup.max_student}
                    onChange={(e) => setNewGroup({ ...newGroup, max_student: e.target.value })}
                    className="w-full p-2 border rounded mb-2"
                >
                    <option value="">Chọn số học sinh tối đa</option>
                    {maxStudents
                        .filter((num) => num !== null)
                        .map((num, index) => (
                            <option key={num || index} value={num}>{num}</option>
                        ))}
                </select>
                <div className="border p-3 rounded-md w-full bg-white">
                    <p className="font-semibold mb-2">Chọn lịch học:</p>

                    <div className="grid grid-cols-2 gap-2">
                        {groupOptions.schedules.map((schedule) => (
                            <label
                                key={schedule.id}
                                className="flex items-center space-x-2 border p-2 rounded-md cursor-pointer hover:bg-gray-100"
                            >
                                <input
                                    type="checkbox"
                                    value={schedule.id}
                                    checked={newGroup.schedule.includes(schedule.id)}
                                    onChange={() => handleScheduleChange(schedule.id)}
                                />
                                <span>{schedule.date}: {schedule.start} - {schedule.end}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleCreateGroup}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Tạo nhóm
                </button>
            </div>




            {/* Bảng danh sách nhóm học */}
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
                            <th className="border p-2 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(groups) && groups.length > 0 ? (
                            groups.map((cls) => (
                                <tr key={`group-${cls.id}`} className="hover:bg-gray-50">
                                    <td className="border p-2">{cls.name}</td>
                                    <td className="border p-2">{cls.type_mapped}</td>
                                    <td className="border p-2">{cls.subject}</td>
                                    <td className="border p-2">{cls.grade}</td>
                                    <td className="border p-2">
                                        {cls.remaining_students !== null && cls.remaining_students !== undefined
                                            ? `${cls.remaining_students} chỗ trống`
                                            : "Không xác định"}
                                    </td>
                                    <td className="border p-2">
                                        <ul className="list-disc pl-4">
                                            {Array.isArray(cls.schedule) && cls.schedule.length > 0 ? (
                                                cls.schedule.map((sch, index) => (
                                                    sch ? ( // Kiểm tra sch có tồn tại không
                                                        <li key={index}>
                                                            {sch.date_of_week ? sch.date_of_week : "Chưa có ngày"}:
                                                            {sch.start_at ? sch.start_at : "Chưa có giờ bắt đầu"} -
                                                            {sch.end_at ? sch.end_at : "Chưa có giờ kết thúc"}
                                                        </li>
                                                    ) : (
                                                        <li key={index} className="text-gray-500">Dữ liệu không hợp lệ</li>
                                                    )
                                                ))
                                            ) : (
                                                <span className="text-gray-500">Chưa có lịch học</span>
                                            )}
                                        </ul>
                                    </td>

                                    <td className="border p-2 text-center">


                                        <button
                                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                            onClick={() => handleDelete(cls.id)}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="border p-4 text-center text-gray-500">
                                    Không có lớp nào.
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>
            </div>
        </div>
    );
}

export default ManageGroups;
