import { useEffect, useState } from "react";
import "./ManageTeachers.css";

const ManageTeachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = () => {
        fetch("http://localhost:5000/manager/teachers")
            .then((response) => response.json())
            .then((data) => setTeachers(data))
            .catch((error) => console.error("Lỗi khi lấy giáo viên:", error));
    };

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const newTeacher = { fullName, username, email, phone, password };

        try {
            const response = await fetch("http://localhost:5000/manager/teachers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTeacher),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage("✅ Thêm giáo viên thành công!");
                fetchTeachers();
                setFullName(""); setUsername(""); setEmail(""); setPhone(""); setPassword("");
                alert("✅ Thêm giáo viên thành công!");
            } else {
                setError(data.error || "Lỗi không xác định!");
                alert("❌ Lỗi: " + (data.error || "Không xác định!"));
            }
        } catch (error) {
            console.error("❌ Lỗi khi thêm giáo viên:", error);
            setError("❌ Lỗi kết nối đến server!");
            alert("❌ Lỗi kết nối đến server!");
        }
    };

    // 🛑 Hàm xóa giáo viên
    const handleDeleteTeacher = async (id) => {
        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa giáo viên này?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`http://localhost:5000/manager/teachers/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                alert("✅ Xóa giáo viên thành công!");
                fetchTeachers(); // Cập nhật danh sách sau khi xóa
            } else {
                alert("❌ Lỗi khi xóa giáo viên!");
            }
        } catch (error) {
            console.error("❌ Lỗi khi xóa giáo viên:", error);
            alert("❌ Lỗi kết nối đến server!");
        }
    };

    return (
        <div>
            <h2>Quản lý giáo viên</h2>

            {/* Hiển thị thông báo */}
            {message && <p style={{ color: "green" }}>{message}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <form onSubmit={handleAddTeacher}>
                <input
                    type="text"
                    placeholder="Họ và tên"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Thêm giáo viên</button>
            </form>

            <table border="1">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Họ và tên</th>
                        <th>Tên đăng nhập</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th> {/* Cột Xóa */}
                    </tr>
                </thead>
                <tbody>
                    {teachers.map((teacher) => (
                        <tr key={teacher.id}>
                            <td>{teacher.id}</td>
                            <td>{teacher.fullName}</td>
                            <td>{teacher.username}</td>
                            <td>{teacher.email}</td>
                            <td>{teacher.phone}</td>
                            <td>{new Date(teacher.created_at).toLocaleDateString()}</td>
                            <td>
                                <button onClick={() => handleDeleteTeacher(teacher.id)} style={{ color: "red" }}>
                                    ❌ Xóa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageTeachers;
