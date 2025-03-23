import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

import { Server as SocketServer } from "socket.io";
import http from "http";

dotenv.config();

const app = express();
const server = http.createServer(app); // Tạo server HTTP trước

const io = new SocketServer(server, { cors: { origin: "*" } }); // Khởi tạo Socket.IO




const router = express.Router();

// Sử dụng createPool thay vì createConnection
const db = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "11111111",
    database: process.env.DB_NAME || "tutoring_center",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
router.get("/notifications", async (req, res) => {
    const { class_id } = req.query;

    try {
        const [notifications] = await db.execute(
            `SELECT 
                n.id, 
                n.title, 
                n.message, 
                n.recipient, 
                n.created_at, 
                IFNULL(JSON_ARRAYAGG(JSON_OBJECT('id', d.id, 'name', d.title, 'url', d.file_path)), '[]') AS files
            FROM notifications n
            LEFT JOIN documents d ON n.id = d.notification_id
            WHERE n.class_id = ?
            GROUP BY n.id
            ORDER BY n.created_at DESC`,
            [class_id]
        );

        const updatedNotifications = notifications.map((notif) => ({
            ...notif,
            files: JSON.parse(notif.files) // Giờ chắc chắn đúng định dạng JSON
        }));

        res.json(updatedNotifications);
    } catch (error) {
        console.error("❌ Lỗi khi lấy thông báo:", error);
        res.status(500).json({ error: "Lỗi server khi lấy thông báo!" });
    }
});




import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cấu hình nơi lưu file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, "../uploads"); // Đảm bảo đúng thư mục
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname); // Thêm timestamp để tránh trùng tên file
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
const insertNotification = async (class_id, teacher_id, title, message) => {
    try {
        const sql = "INSERT INTO notifications (class_id, teacher_id, title, message) VALUES (?, ?, ?, ?)";
        const [result] = await db.execute(sql, [class_id, teacher_id, title, message]);
        return result;
    } catch (error) {
        console.error("❌ Lỗi khi chèn thông báo:", error);
        throw error;
    }
};
router.post("/notifications", upload.single("file"), async (req, res) => {
    try {
        // Kiểm tra dữ liệu đầu vào
        const { class_id, teacher_id, title, message } = req.body;
        if (!class_id || !teacher_id || !title || !message) {
            return res.status(400).json({ error: "Thiếu dữ liệu cần thiết!" });
        }

        const file_path = req.file ? `/uploads/${req.file.filename}` : null;
        const recipient = "hv"; // Mặc định gửi cho học viên

        // Lưu thông báo vào DB
        const [result] = await db.execute(
            "INSERT INTO notifications (title, message, class_id, recipient) VALUES (?, ?, ?, ?)",
            [title, message, class_id, recipient]
        );

        console.log(`✅ Thêm thông báo thành công! ID: ${result.insertId}`);

        // Nếu có file, lưu vào bảng documents
        if (file_path) {
            await db.execute(
                "INSERT INTO documents (class_id, teacher_id, title, file_path) VALUES (?, ?, ?, ?)",
                [class_id, teacher_id, title, file_path]
            );
        }
        if (req.io) {
            req.io.emit("newNotification", {
                id: result.insertId,
                title,
                message,
                class_id,
                recipient,
                file_path,
            });
        } else {
            console.error("❌ req.io không tồn tại! Kiểm tra middleware.");
        }


        res.status(201).json({ message: "Thông báo đã được tạo!", file_path });

    } catch (error) {
        console.error("❌ Lỗi khi thêm thông báo:", error);
        res.status(500).json({ error: "Lỗi server khi thêm thông báo!" });
    }
});


router.delete("/notifications/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Lấy tiêu đề của thông báo để tìm tài liệu liên quan
        const [notifications] = await db.query("SELECT title FROM notifications WHERE id = ?", [id]);

        if (!notifications || notifications.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy thông báo" });
        }

        const title = notifications[0].title;

        // Xóa tài liệu có cùng title
        await db.query("DELETE FROM documents WHERE title = ?", [title]);

        // Xóa thông báo
        await db.query("DELETE FROM notifications WHERE id = ?", [id]);

        res.status(200).json({ message: "Thông báo và tài liệu liên quan đã bị xóa" });
    } catch (error) {
        console.error("Lỗi khi xóa thông báo:", error);
        res.status(500).json({ error: "Không thể xóa thông báo" });
    }
});


export default router;
