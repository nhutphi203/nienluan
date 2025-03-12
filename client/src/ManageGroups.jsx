import { useEffect, useState } from "react";
import axios from "axios";

export default function ManageGroups() {
    const [classes, setClasses] = useState([]);
    const [formData, setFormData] = useState({
        name: "", subject: "", type: "", grade: "", max_student: "", fee_amount: "", current_student: 0
    });

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await axios.get("http://localhost:5000/manager/classes");
            setClasses(res.data);
        } catch (error) {
            console.error("Lỗi khi tải danh sách lớp:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:5000/manager/classes", formData);
            fetchClasses();
            setFormData({ name: "", subject: "", type: "", grade: "", max_student: "", fee_amount: "", current_student: 0 });
        } catch (error) {
            console.error("Lỗi khi thêm lớp:", error);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Tạo lớp học</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <input name="name" placeholder="Tên lớp" value={formData.name} onChange={handleChange} required className="border p-2 w-full" />
                <input name="subject" placeholder="Môn học" value={formData.subject} onChange={handleChange} required className="border p-2 w-full" />
                <input name="type" placeholder="Loại lớp" value={formData.type} onChange={handleChange} required className="border p-2 w-full" />
                <input name="grade" placeholder="Cấp độ" value={formData.grade} onChange={handleChange} required className="border p-2 w-full" />
                <input name="max_student" type="number" placeholder="Số lượng tối đa" value={formData.max_student} onChange={handleChange} required className="border p-2 w-full" />
                <input name="fee_amount" type="number" placeholder="Học phí" value={formData.fee_amount} onChange={handleChange} required className="border p-2 w-full" />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Thêm lớp</button>
            </form>

            <h2 className="text-xl font-semibold mt-6">Danh sách lớp</h2>
            <table className="mt-4 w-full border-collapse border">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border p-2">ID</th>
                        <th className="border p-2">Tên lớp</th>
                        <th className="border p-2">Môn học</th>
                        <th className="border p-2">Loại lớp</th>
                        <th className="border p-2">Cấp độ</th>
                        <th className="border p-2">Số lượng tối đa</th>
                        <th className="border p-2">Học phí</th>
                    </tr>
                </thead>
                <tbody>
                    {classes.map(cls => (
                        <tr key={cls.id} className="border">
                            <td className="border p-2">{cls.id}</td>
                            <td className="border p-2">{cls.name}</td>
                            <td className="border p-2">{cls.subject}</td>
                            <td className="border p-2">{cls.type}</td>
                            <td className="border p-2">{cls.grade}</td>
                            <td className="border p-2">{cls.max_student}</td>
                            <td className="border p-2">{cls.fee_amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
