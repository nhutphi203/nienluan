import { useEffect, useState } from "react";
import "./MakeUpClasses.css";

const MakeUpClasses = ({ studentId }) => {
    const [makeUpClasses, setMakeUpClasses] = useState([]);

    useEffect(() => {
        const fetchMakeUpClasses = async () => {
            try {
                const response = await fetch(`http://localhost:5000/student/make-up-classes/${studentId}`);
                const data = await response.json();
                setMakeUpClasses(data);
            } catch (error) {
                console.error("Lỗi khi tải lớp học bù:", error);
            }
        };

        if (studentId) {
            fetchMakeUpClasses();
        }
    }, [studentId]);

    return (
        <div className="makeup-classes-container">
            <h2>Lớp học bù</h2>
            {makeUpClasses.length === 0 ? (
                <p>Không có lớp học bù.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Tên lớp</th>
                            <th>Ngày học bù</th>
                        </tr>
                    </thead>
                    <tbody>
                        {makeUpClasses.map((makeUpClass) => (
                            <tr key={makeUpClass.class_name}>
                                <td>{makeUpClass.class_name}</td>
                                <td>{new Date(makeUpClass.make_up_date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default MakeUpClasses;
