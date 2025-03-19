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
import newsRoutes from "./routes/news.js";
app.use("/news", newsRoutes);

import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, "uploads");
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // ✅ Giữ nguyên tên file
    }
});



const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [".pdf", ".docx", ".pptx"];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedTypes.includes(ext)) {
            return cb(new Error("Chỉ chấp nhận file PDF, DOCX, PPTX!"));
        }
        cb(null, true);
    },
});

app.post("/upload", upload.single("file"), (req, res) => {
    console.log("🔍 Debug req.file:", req.file); // Kiểm tra file nhận được

    if (!req.file) {
        return res.status(400).json({ error: "Không có tệp được tải lên!" });
    }

    const classId = req.body.class_id;
    const filePath = "/uploads/" + req.file.filename;

    console.log("✅ Đã nhận file:", req.file.filename, "Lưu vào:", filePath);

    const teacherId = req.body.teacher_id; // Nhận từ request body
    console.log("Teacher ID:", teacherId);


    const sql = "INSERT INTO documents (class_id, title, file_path, teacher_id) VALUES (?, ?, ?, ?)";

    db.query(sql, [classId, req.file.originalname, filePath, teacherId], (err) => {
        if (err) {
            console.error("🔥 Lỗi MySQL:", err);
            return res.status(500).json({ error: "Lỗi khi lưu tài liệu vào database" });
        }
        res.json({ message: "Tải tài liệu lên thành công!" });
    });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API lấy file tài liệu
app.get("/documents/:id", (req, res) => {
    const docId = req.params.id;

    // 🔍 Giả sử bạn lấy thông tin tài liệu từ database
    const sql = "SELECT file_path FROM documents WHERE id = ?";
    db.query(sql, [docId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Lỗi truy vấn database" });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Tài liệu không tồn tại" });
        }

        const filePath = path.join(__dirname, results[0].file_path);
        res.sendFile(filePath);
    });
});

// API kiểm tra server hoạt động
app.get("/", (req, res) => {
    res.send("API đang hoạt động! 🚀");
});

app.get("/documents/class/:class_id", (req, res) => {
    const classId = req.params.class_id;
    const sql = "SELECT * FROM documents WHERE class_id = ?";

    db.query(sql, [classId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(result.length > 0 ? result : []); // Luôn trả về danh sách, dù có dữ liệu hay không
    });
});


app.get("/download/:filename", (req, res) => {
    const filePath = `uploads/${req.params.filename}`;

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ message: "File không tồn tại" });
    }
});
// 🛠 XÓA TÀI LIỆU

app.delete("/documents/:id", (req, res) => {
    const docId = req.params.id;

    // Lấy đường dẫn file từ database
    const sql = "SELECT file_path FROM documents WHERE id = ?";
    db.query(sql, [docId], (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi database" });
        if (results.length === 0) return res.status(404).json({ error: "Không tìm thấy tài liệu" });

        const filePath = path.join(__dirname, results[0].file_path);

        // Xóa file trong thư mục uploads
        fs.unlink(filePath, (err) => {
            if (err && err.code !== "ENOENT") {
                console.error("❌ Lỗi khi xóa file:", err);
                return res.status(500).json({ error: "Lỗi khi xóa file" });
            }

            // Xóa khỏi database
            const deleteSql = "DELETE FROM documents WHERE id = ?";
            db.query(deleteSql, [docId], (err, result) => {
                if (err) return res.status(500).json({ error: "Lỗi database khi xóa" });

                res.json({ message: "Đã xóa tài liệu thành công!" });
            });
        });
    });
});

// 🛠 CẬP NHẬT THÔNG TIN TÀI LIỆU
app.put("/documents/:id", (req, res) => {
    const documentId = req.params.id;
    const { title, class_id, teacher_id } = req.body;

    const updateQuery = "UPDATE documents SET title = ?, class_id = ?, teacher_id = ? WHERE id = ?";
    db.query(updateQuery, [title, class_id, teacher_id, documentId], (err, result) => {
        if (err) {
            console.error("Lỗi khi cập nhật tài liệu:", err);
            return res.status(500).json({ message: "Lỗi server khi cập nhật tài liệu" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy tài liệu!" });
        }
        res.json({ message: "Cập nhật tài liệu thành công!" });
    });
});

// 🛠 TẢI XUỐNG TÀI LIỆU
import fs from "fs";

app.get("/documents/download/:id", (req, res) => {
    const documentId = req.params.id;

    const query = "SELECT file_path FROM documents WHERE id = ?";
    db.query(query, [documentId], (err, results) => {
        if (err) {
            console.error("Lỗi truy vấn file:", err);
            return res.status(500).json({ message: "Lỗi server khi tìm tài liệu" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy tài liệu!" });
        }

        const filePath = results[0].file_path;
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "File không tồn tại trên server!" });
        }

        res.download(filePath, (err) => {
            if (err) {
                console.error("Lỗi khi tải xuống file:", err);
                res.status(500).json({ message: "Lỗi server khi tải xuống tài liệu" });
            }
        });
    });
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
app.get("/teachers", (req, res) => {
    db.query(
        "SELECT id, username, fullName, email, phone FROM users WHERE role = 'gv'",
        (error, results) => {
            if (error) {
                console.error("❌ Lỗi khi lấy danh sách giáo viên:", error);
                res.status(500).json({ error: "Lỗi server" });
            } else {
                res.json(results);
            }
        }
    );
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
