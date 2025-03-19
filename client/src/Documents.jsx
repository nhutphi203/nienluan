import { useState, useEffect } from "react";
import StudentClasses from "./student";
import TeacherClasses from "./teacher";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import "./Documents.css";
import { useRef } from "react";


const Documents = ({ user }) => {
    const [selectedClass, setSelectedClass] = useState(null);
    const [documents, setDocuments] = useState([]);
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const storedUser = localStorage.getItem("user");
    const [currentUser, setCurrentUser] = useState(user || (storedUser ? JSON.parse(storedUser) : null));

    useEffect(() => {
        if (!currentUser) {
            navigate("/login");
        }
    }, [currentUser, navigate]);
    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click(); // Mở hộp thoại chọn file
        }
    };
    const handleSelectClass = async (class_Id) => {
        try {
            const response = await axios.get(`http://localhost:5000/documents/class/${class_Id}`);
            setDocuments(response.data);
            setSelectedClass(class_Id);
        } catch (error) {
            console.error("❌ Lỗi khi lấy tài liệu:", error);
            toast.error("⚠️ Không thể tải tài liệu!");
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!currentUser || !currentUser.id) {
            toast.error("⚠️ Không thể xác định giảng viên! Hãy đăng nhập lại.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("class_id", selectedClass);
        formData.append("teacher_id", currentUser.id);

        try {
            await axios.post("http://localhost:5000/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("✅ Tải tài liệu lên thành công!");
            handleSelectClass(selectedClass);
        } catch (error) {
            console.error("❌ Lỗi khi tải tài liệu:", error);
            toast.error("⚠️ Không thể tải lên tài liệu!");
        }
    };


    const handleDeleteDocument = async (docId) => {
        if (!window.confirm("Bạn có chắc muốn xóa tài liệu này?")) return;

        try {
            await axios.delete(`http://localhost:5000/documents/${docId}`);
            toast.success("✅ Tài liệu đã được xóa!");
            setDocuments(documents.filter(doc => doc.id !== docId));
        } catch (error) {
            console.error("❌ Lỗi khi xóa tài liệu:", error);
            toast.error("⚠️ Không thể xóa tài liệu!");
        }
    };

    return (
        <div className="documents-container">
            <h2>Tài liệu lớp học</h2>

            {!selectedClass ? (
                <>
                    <h3>Chọn lớp để xem tài liệu</h3>
                    {currentUser?.role === "hv" ? (
                        <StudentClasses userId={currentUser.id} onSelectClass={handleSelectClass} />
                    ) : currentUser?.role === "gv" ? (
                        <TeacherClasses userId={currentUser.id} onSelectClass={handleSelectClass} />
                    ) : (
                        <p>Đang tải dữ liệu người dùng...</p>
                    )}
                </>
            ) : (
                <div className="document-list">
                    <button onClick={() => setSelectedClass(null)}>🔙 Quay lại danh sách lớp</button>
                    <h3>Danh sách tài liệu</h3>
                    {currentUser?.role === "gv" && (
                        <div className="upload-section">
                            {/* Input file ẩn */}
                            <input
                                type="file"
                                accept=".pdf,.docx,.pptx"
                                ref={fileInputRef}
                                style={{ display: "none" }}
                                onChange={handleFileChange}
                            />

                            {/* Nút nhấn để mở hộp thoại chọn file */}
                            <button onClick={handleUploadClick}>
                                📤 Tải lên tài liệu
                            </button>
                        </div>
                    )}

                    <ul>
                        {documents.length > 0 ? (
                            documents.map((doc) => (
                                <li key={doc.id}>
                                    <a
                                        href={`http://localhost:5000${doc.file_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {doc.title}
                                    </a>
                                    {currentUser?.role === "gv" && (
                                        <button onClick={() => handleDeleteDocument(doc.id)}>
                                            <FaTrash />
                                        </button>
                                    )}
                                </li>
                            ))
                        ) : (
                            <p>Không có tài liệu nào.</p>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Documents;
