import { useEffect, useState } from "react";

const ManageStudents = () => {
    const [students, setStudents] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5000/manager/students")
            .then((response) => response.json())
            .then((data) => setStudents(data))
            .catch((error) => console.error("Lỗi khi lấy học viên:", error));
    }, []);

    return (
        <div>
            <h2>Quản lý học viên</h2>
            <table border="1">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên đăng nhập</th>
                        <th>Email</th>
                        <th>Ngày tạo</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((student) => (
                        <tr key={student.id}>
                            <td>{student.id}</td>
                            <td>{student.username}</td>
                            <td>{student.email}</td>
                            <td>{new Date(student.created_at).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageStudents;
