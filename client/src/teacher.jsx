import { useEffect, useState } from "react";
import axios from "axios";

const TeacherClasses = ({ userId, onSelectClass }) => {
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        const fetchTeacherClasses = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/teacher/teacher/classes/${userId}`);
                setClasses(response.data);
            } catch (error) {
                console.error("❌ Lỗi khi lấy danh sách lớp giáo viên:", error);
            }
        };

        if (userId) {
            fetchTeacherClasses();
        }
    }, [userId]);

    return (
        <div className="class-list">
            {classes.length === 0 ? (
                <p>Giáo viên chưa có lớp nào.</p>
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

export default TeacherClasses;
