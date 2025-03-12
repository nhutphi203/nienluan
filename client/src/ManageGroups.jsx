import { useState, useEffect } from "react";

function ManageGroups() {
    const [groups, setGroups] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [types, setTypes] = useState([]);
    const [grades, setGrades] = useState([]);
    const [maxStudents, setMaxStudents] = useState([]);
    const [editingClass, setEditingClass] = useState(null); // Lưu thông tin lớp đang chỉnh sửa
    const [newGroup, setNewGroup] = useState({
        name: "",
        subject: "",
        type: "",
        grade: "",
        max_student: "",
    });
    // Lấy dữ liệu từ API
    useEffect(() => {
        fetch("http://localhost:5000/student/available-classes")
            .then((res) => res.json())
            .then((data) => {
                console.log("📌 Dữ liệu API trước khi xử lý:", data);
                setGroups(groupByClass(data))
                console.log("📌 Dữ liệu sau khi groupByClass:", groupByClass);
            })

            .catch((err) => console.error("Lỗi khi lấy danh sách lớp:", err));

        fetch("http://localhost:5000/manager/group-options") // API trả về các danh mục
            .then((res) => res.json())
            .then((data) => {
                setSubjects(data.subjects);
                setTypes(data.types);
                setGrades(data.grades);
                setMaxStudents(data.max_students);
            })
            .catch((err) => console.error("Lỗi khi lấy dữ liệu danh mục:", err));
    }, []);
    const handleEdit = (cls) => {
        setEditingClass(cls);
    };

    const handleDelete = (id) => {
        if (window.confirm("Bạn có chắc muốn xóa lớp này?")) {
            fetch(`http://localhost:5000/manager/group/${id}`, {
                method: "DELETE",
            })
                .then((res) => res.json())
                .then((data) => {
                    alert(data.message);
                    setGroups(groups.filter((g) => g.id !== id));
                })
                .catch((err) => console.error("Lỗi khi xóa nhóm học:", err));
        }
    };

    const handleCreateGroup = () => {
        fetch("http://localhost:5000/manager/group", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newGroup),
        })
            .then((res) => res.json())
            .then((data) => {
                alert(data.message);
                setGroups([...groups, { ...newGroup, id: data.id }]);
                setNewGroup({ name: "", subject: "", type: "", grade: "", max_student: "" });
            })
            .catch((err) => console.error("Lỗi khi tạo nhóm học:", err));
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
                ? item.schedule.split(", ").map((sch) => {
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
                                    <td className="border p-2">{cls.type}</td>
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
                                            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                                            onClick={() => handleEdit(cls)}
                                        >
                                            Chỉnh sửa
                                        </button>
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
