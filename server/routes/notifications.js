import express from "express";
import mysql from "mysql2/promise";
import jwt from 'jsonwebtoken';

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
    const { role } = req.query; // Lấy vai trò của user từ query parameter

    if (!role) {
        return res.status(400).json({ error: "Vui lòng cung cấp vai trò của người dùng" });
    }

    try {
        const [notifications] = await db.execute(
            "SELECT * FROM notifications WHERE recipient = ? OR recipient IN ('all', 'users') ORDER BY created_at DESC",
            [role]
        );

        res.json(notifications);
    } catch (error) {
        console.error("❌ Lỗi khi lấy thông báo:", error);
        res.status(500).json({ error: "Lỗi server khi lấy thông báo" });
    }
});

// Tạo thông báo mới
router.post("/notifications", async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { title, message, recipient } = req.body; // Đổi recipient_role thành recipient

        if (!title || !message || !recipient) {
            return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin" });
        }

        const sql = `INSERT INTO notifications (title, message, recipient, created_at) VALUES (?, ?, ?, NOW())`;
        const values = [title, message, recipient];

        const [result] = await connection.execute(sql, values);

        res.status(201).json({ message: "Thông báo đã được tạo", id: result.insertId });
    } catch (error) {
        console.error("❌ Lỗi khi tạo thông báo:", error);
        res.status(500).json({ error: "Lỗi server khi tạo thông báo" });
    } finally {
        connection.release(); // Giải phóng kết nối
    }
});

// Xóa thông báo
router.delete("/notifications/:id", async (req, res) => {
    const connection = await db.getConnection();
    const { id } = req.params;
    try {
        const [result] = await connection.execute("DELETE FROM notifications WHERE id = ?", [id]);

        if (result.affectedRows > 0) {
            res.json({ message: "✅ Thông báo đã được xóa thành công!" });
        } else {
            res.status(404).json({ error: "❌ Không tìm thấy thông báo!" });
        }
    } catch (error) {
        console.error("❌ Lỗi khi xóa thông báo:", error);
        res.status(500).json({ error: "Lỗi server khi xóa thông báo" });
    } finally {
        connection.release(); // Giải phóng kết nối
    }
});

export default router;
