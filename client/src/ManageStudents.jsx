import { useEffect, useState } from "react";

const ManageStudents = () => {
    const [students, setStudents] = useState([]);
    const [newStudent, setNewStudent] = useState({
        username: "",
        email: "",
        phone: "",
        fullName: "",
        password: "",
    });
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = () => {
        fetch("http://localhost:5000/manager/students")
            .then((response) => response.json())
            .then((data) => setStudents(data))
            .catch(() => setMessage("Lỗi khi lấy học viên!"));
    };
    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/manager/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newStudent),
            });

            const data = await response.json();
            console.log("Response:", response);  // ✅ Xem phản hồi từ server
            console.log("Data:", data);  // ✅ Kiểm tra nội dung trả về

            if (!response.ok) throw new Error(data.message || "Lỗi khi thêm học viên!");

            setMessage("Thêm học viên thành công!");
            setStudents((prevStudents) => [...prevStudents, { ...newStudent, id: data.id, created_at: new Date() }]);
            setNewStudent({ username: "", email: "", phone: "", fullName: "", password: "" });
        } catch (error) {
            console.error("Lỗi khi thêm học viên:", error);  // ✅ Debug lỗi nếu có
            setMessage(error.message);
        }
    };

    const handleDeleteStudent = async (id) => {
        console.log("Đang xóa ID:", id); // ✅ Kiểm tra ID trước khi gửi request
        if (!window.confirm("Bạn có chắc chắn muốn xóa học viên này?")) return;

        try {
            const response = await fetch(`http://localhost:5000/manager/students/${id}`, { method: "DELETE" });
            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                setStudents((prevStudents) => prevStudents.filter((student) => student.id !== id));
            }
        } catch (error) {
            console.error("Lỗi khi xóa học viên:", error);
            setMessage("Lỗi khi xóa học viên!");
        }
    };

    const handleChange = (e) => {
        setNewStudent({ ...newStudent, [e.target.name]: e.target.value });
    };

    return (
        <div>
            <h2>Quản lý học viên</h2>

            {/* Hiển thị thông báo */}
            {message && <p style={{ color: "red", fontWeight: "bold" }}>{message}</p>}

            {/* Form thêm học viên */}
            <form onSubmit={handleAddStudent}>
                <input type="text" placeholder="Tên đăng nhập" name="username"
                    value={newStudent.username} onChange={handleChange} required />

                <input type="email" placeholder="Email" name="email"
                    value={newStudent.email} onChange={handleChange} required />

                <input type="tel" placeholder="Số điện thoại" name="phone"
                    value={newStudent.phone} onChange={handleChange} required />

                <input type="text" placeholder="Họ và tên" name="fullName"
                    value={newStudent.fullName} onChange={handleChange} required />

                <input type="password" placeholder="Mật khẩu" name="password"
                    value={newStudent.password} onChange={handleChange}
                    minLength="6" maxLength="20" required />

                <button type="submit">Thêm học viên</button>
            </form>

            {/* Bảng danh sách học viên */}
            <table border="1">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên đăng nhập</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Họ và tên</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((student) => (
                        <tr key={student.id}>
                            <td>{student.id}</td>
                            <td>{student.username}</td>
                            <td>{student.email}</td>
                            <td>{student.phone}</td>
                            <td>{student.fullName}</td>
                            <td>{new Date(student.created_at).toLocaleDateString()}</td>
                            <td>
                                <button onClick={() => handleDeleteStudent(student.id)}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageStudents;
