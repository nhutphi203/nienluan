import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa"; // Import icon
import "./Login.css";

const Login = ({ setUser }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();
    useEffect(() => {
        document.body.classList.add("login-page");
        return () => {
            document.body.classList.remove("login-page"); // Xóa khi rời trang
        };
    }, []);
    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            console.log("Dữ liệu từ API:", data);

            if (response.ok) {
                localStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);
                navigate("/home");
            } else {
                setErrorMessage(data.error || "Đăng nhập thất bại");
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
            setErrorMessage("Lỗi kết nối đến server!");
        }
    };

    return (
        <div className="auth-container">
            <h2>Đăng Nhập</h2>
            <form onSubmit={handleLogin}>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Nhập tên đăng nhập"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <FaUser className="icon" />
                </div>
                <div className="input-group">
                    <input
                        type="password"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <FaLock className="icon" />
                </div>
                <button type="submit">Đăng Nhập</button>
            </form>
            {errorMessage && <p className="error">{errorMessage}</p>}
            <p>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
        </div>
    );
};

export default Login;
