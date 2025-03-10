import dotenv from "dotenv";
import express from "express";
import mysql from "mysql";
import cors from "cors";
import bcrypt from "bcrypt"; // 🛠 Thêm bcrypt vào đây!
import process from "process";
const router = express.Router();
import { Server as SocketServer } from "socket.io";
import http from "http"; // Tạo server HTTP



dotenv.config();

const app = express();
app.use(cors());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "11111111",
    database: process.env.DB_NAME || "tutoring_center",
    port: process.env.DB_PORT || 3306,
    charset: "utf8mb4"  // ✅ Thêm charset để hỗ trợ Unicode

});

// Kiểm tra kết nối
db.connect(err => {
    if (err) {
        console.error("❌ Lỗi kết nối database:", err);
        process.exit(1);
    } else {
        console.log("✅ Kết nối database thành công!");
    }
    // Thiết lập bảng mã UTF-8
    db.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;", (err) => {
        if (err) {
            console.error("⚠️ Lỗi khi thiết lập UTF-8:", err);
        } else {
            console.log("✅ Thiết lập UTF-8 thành công!");
        }
    });
});

import studentRoutes from "./routes/student.js";  // 🛠 Thêm dòng này
app.use("/student", studentRoutes);

import teacherRoutes from "./routes/teacher.js";

app.use("/teacher", teacherRoutes);

import managerRoutes from "./routes/manager.js";

app.use("/manager", managerRoutes);

import adminRoutes from "./routes/admin.js";
app.use("/admin", adminRoutes);

import notificationsRoutes from "./routes/notifications.js";
app.use("/notifications", notificationsRoutes);



// API kiểm tra server hoạt động
app.get("/", (req, res) => {
    res.send("API đang hoạt động! 🚀");
});

app.post("/register", async (req, res) => {
    console.log("Dữ liệu nhận được:", req.body);
    const { fullName, username, phone, email, password, role } = req.body; // Lấy role từ frontend
    console.log("Full name:", fullName);
    console.log("Phone:", phone);
    console.log("Username:", username);
    console.log("Email:", email);
    console.log("Password:", password);

    if (!fullName || !username || !phone || !email || !password) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }
    if (!/^\d{10,11}$/.test(phone)) {
        return res.status(400).json({ message: "Số điện thoại không hợp lệ!" });
    }

    const checkUserQuery = "SELECT * FROM users WHERE username = ? OR email = ?";
    db.query(checkUserQuery, [username, email], async (err, results) => {
        if (err) return res.status(500).json({ message: "Lỗi server khi kiểm tra người dùng" });
        if (results.length > 0) {
            return res.status(400).json({ message: "Tên đăng nhập hoặc email đã tồn tại!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const insertQuery = "INSERT INTO users (fullName, username, phone, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())";
        db.query(insertQuery, [fullName, username, phone, email, hashedPassword, role], (err, result) => {
            if (err) {
                console.error("❌ Lỗi khi chèn user vào MySQL:", err.sqlMessage);
                return res.status(500).json({ message: "Lỗi server khi đăng ký", error: err.sqlMessage });
            }
            res.status(201).json({ message: "Đăng ký thành công!" });
        });

    });
});




// 🚀 API ĐĂNG NHẬP
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    console.log("Yêu cầu đăng nhập:", username, password);

    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], async (err, results) => {
        if (err) {
            console.error("Lỗi truy vấn database:", err);
            return res.status(500).json({ error: "Lỗi server" });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: "Sai tài khoản hoặc mật khẩu" });
        }

        // Lấy thông tin user từ database
        const user = results[0];

        // 🛠 So sánh mật khẩu đã mã hóa
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Sai tài khoản hoặc mật khẩu" });
        }

        res.json({
            message: "Đăng nhập thành công",
            user: {
                id: user.id,
                fullName: user.fullName,
                username: user.username,
                phone: user.phone,
                role: user.role,
                email: user.email
            }
        });
    });
});
app.get("/profile", (req, res) => {
    const userId = req.query.id; // Lấy user ID từ query

    if (!userId) {
        return res.status(400).json({ error: "Thiếu ID người dùng" });
    }

    const query = "SELECT id, username, email, role, created_at FROM users WHERE id = ?";
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Lỗi truy vấn profile:", err);
            return res.status(500).json({ error: "Lỗi server" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Người dùng không tồn tại" });
        }

        res.json(results[0]);
    });
});

// 🚀 API Đổi Mật Khẩu
app.post("/change-password", async (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin!" });
    }

    // Kiểm tra người dùng có tồn tại không
    const query = "SELECT * FROM users WHERE id = ?";
    db.query(query, [userId], async (err, results) => {
        if (err) {
            console.error("Lỗi truy vấn database:", err);
            return res.status(500).json({ error: "Lỗi server!" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Người dùng không tồn tại!" });
        }

        const user = results[0];

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Mật khẩu cũ không chính xác!" });
        }

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu mới vào database
        const updateQuery = "UPDATE users SET password = ? WHERE id = ?";
        db.query(updateQuery, [hashedPassword, userId], (updateErr) => {
            if (updateErr) {
                console.error("Lỗi khi cập nhật mật khẩu:", updateErr);
                return res.status(500).json({ error: "Lỗi server khi cập nhật mật khẩu!" });
            }

            res.json({ message: "Đổi mật khẩu thành công!" });
        });
    });
});

const PORT = process.env.PORT || 5000;


// Chạy server
const server = http.createServer(app); // Tạo HTTP server
const io = new SocketServer(server, {
    cors: {
        origin: "http://localhost:3000", // Hoặc domain của frontend
        methods: ["GET", "POST"],
    },
});

server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});

// Lắng nghe kết nối Socket.IO
io.on("connection", (socket) => {
    console.log("🔗 Một client đã kết nối:", socket.id);

    socket.on("disconnect", () => {
        console.log("❌ Client đã ngắt kết nối:", socket.id);
    });

    socket.on("sendMessage", (message) => {
        console.log("📩 Tin nhắn nhận được:", message);
        io.emit("receiveMessage", message); // Gửi tin nhắn đến tất cả client
    });
});
