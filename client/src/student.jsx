import { useEffect, useState } from "react";
import axios from "axios";

const StudentClasses = ({ userId, onSelectClass }) => {
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        const fetchStudentClasses = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/student/registered-classes/${userId}`);
                setClasses(response.data);
            } catch (error) {
                console.error("❌ Lỗi khi lấy danh sách lớp học viên:", error);
            }
        };

        if (userId) {
            fetchStudentClasses();
        }
    }, [userId]);

    return (
        <div className="class-list">
            {classes.length === 0 ? (
                <p>Học viên chưa đăng ký lớp nào.</p>
            ) : (
                classes.map((cls) => (
                    <button key={cls.id} onClick={() => onSelectClass(cls.id)}>
                        {cls.name} - {cls.type_mapped} ({cls.grade})
                    </button>
                ))
            )}
        </div>
    );
};

export default StudentClasses;
