import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Register.css";
import { AiOutlineUser, AiOutlineMail, AiOutlineLock } from "react-icons/ai";
import { MdPhone, MdAccountCircle } from "react-icons/md";


const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        username: "",
        password: "",
        confirmPassword: "",
        role: "hv", // Mặc định là học viên
    });
    useEffect(() => {
        document.body.classList.add("register-page");
        return () => {
            document.body.classList.remove("register-page"); // Xóa khi rời trang
        };
    }, []);

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = () => {
        let newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Họ và tên không được để trống!";
        if (!formData.email.trim()) newErrors.email = "Email không được để trống!";
        if (!formData.phone.trim()) {
            newErrors.phone = "Số điện thoại không được để trống!";
        } else if (!/^\d{10,11}$/.test(formData.phone)) {
            newErrors.phone = "Số điện thoại phải có 10-11 chữ số!";
        }
        if (!formData.username.trim()) newErrors.username = "Tên đăng nhập không được để trống!";
        if (formData.username.length < 4) newErrors.username = "Tên đăng nhập phải có ít nhất 4 ký tự!";
        if (formData.password.length < 6) newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự!";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp!";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            const { confirmPassword, ...dataToSend } = formData;
            const response = await axios.post("http://localhost:5000/register", dataToSend);
            alert(response.data.message);
            navigate("/login");
        } catch (error) {
            console.error("❌ Lỗi đăng ký:", error.response?.data || error.message);
            alert("Đăng ký thất bại, vui lòng thử lại!");
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <h2>📝 Đăng Ký</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <AiOutlineUser className="icon" />
                        <input type="text" name="fullName" placeholder="Họ và tên" value={formData.fullName} onChange={handleChange} required />
                        {errors.fullName && <p className="error">{errors.fullName}</p>}
                    </div>

                    <div className="input-group">
                        <AiOutlineMail className="icon" />
                        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                        {errors.email && <p className="error">{errors.email}</p>}
                    </div>

                    <div className="input-group">
                        <MdPhone className="icon" />
                        <input type="text" name="phone" placeholder="Số điện thoại" value={formData.phone} onChange={handleChange} required />
                        {errors.phone && <p className="error">{errors.phone}</p>}
                    </div>

                    <div className="input-group">
                        <MdAccountCircle className="icon" />
                        <input type="text" name="username" placeholder="Tên đăng nhập" value={formData.username} onChange={handleChange} required />
                        {errors.username && <p className="error">{errors.username}</p>}
                    </div>

                    <div className="input-group">
                        <AiOutlineLock className="icon" />
                        <input type="password" name="password" placeholder="Mật khẩu" value={formData.password} onChange={handleChange} required />
                        {errors.password && <p className="error">{errors.password}</p>}
                    </div>

                    <div className="input-group">
                        <AiOutlineLock className="icon" />
                        <input type="password" name="confirmPassword" placeholder="Xác nhận mật khẩu" value={formData.confirmPassword} onChange={handleChange} required />
                        {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
                    </div>

                    <button type="submit" className="register-btn">Đăng ký</button>
                </form>
                <p>Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link></p>
            </div>
        </div>
    );
};

export default Register;
