import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs"; // Cần import bcryptjs
const router = express.Router();
const db = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "11111111",
    database: process.env.DB_NAME || "tutoring_center",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// API lấy danh sách nhóm học
router.get("/groups", async (req, res) => {
    try {
        const [groups] = await db.execute("SELECT * FROM `groups`");
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: "Lỗi lấy danh sách nhóm học", details: error.message });
    }
});

router.post("/groups", async (req, res) => {
    try {
        const { group_name, grade_level, level, schedule } = req.body;

        console.log("📥 Dữ liệu nhận từ frontend:", req.body);

        if (!group_name || !grade_level || !level || !schedule) {
            return res.status(400).json({ error: "Thiếu thông tin nhóm học" });
        }

        const sql = `
            INSERT INTO \`groups\` (group_name, grade_level, level, schedule) 
            VALUES (?, ?, ?, ?)
        `;
        const values = [group_name, grade_level, level, schedule];

        const [result] = await db.execute(sql, values);

        console.log("✅ Nhóm học được thêm:", result);
        res.status(201).json({ message: "Thêm nhóm học thành công", id: result.insertId });
    } catch (error) {
        console.error("❌ LỖI khi thêm nhóm học:", error);
        res.status(500).json({ error: "Lỗi server khi thêm nhóm học" });
    }
});



router.delete("/groups/:id", async (req, res) => {
    const { id } = req.params;

    try {
        console.log(`🗑️ Đang xóa nhóm với ID: ${id}`);

        const [rows] = await db.execute("SELECT * FROM `groups` WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Nhóm học không tồn tại" });
        }

        await db.execute("DELETE FROM `groups` WHERE id = ?", [id]);

        console.log("✔️ Nhóm học đã được xóa!");
        res.json({ message: "Nhóm học đã được xóa" });

    } catch (error) {
        console.error("❌ Lỗi khi xóa nhóm học:", error);
        res.status(500).json({ error: "Lỗi khi xóa nhóm học", details: error.message });
    }
});

// API báo cáo tài chính
router.get("/finance", async (req, res) => {
    try {
        const [totalFeesResult] = await db.execute("SELECT SUM(already_pay) AS totalFees FROM student_pay_fee");
        const totalFees = totalFeesResult[0].totalFees || 0;

        const [totalSalaryResult] = await db.execute("SELECT SUM(salary) AS totalSalary FROM salary");
        const totalSalary = totalSalaryResult[0].totalSalary || 0;

        const profit = totalFees - totalSalary;
        res.json({ totalFees, totalSalary, profit });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy báo cáo tài chính", details: error.message });
    }
});

router.get("/teachers", async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT id, username, email, created_at, fullName,phone
            FROM users 
            WHERE role = 'gv'
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách giáo viên" });
    }
});
router.post("/teachers", async (req, res) => {
    const { fullName, username, email, phone, password } = req.body;

    if (!fullName || !username || !email || !phone || !password) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin" });
    }

    try {
        const checkQuery = "SELECT * FROM users WHERE username = ? OR email = ?";
        const [results] = await db.execute(checkQuery, [username, email]);

        if (results.length > 0) {
            return res.status(400).json({ error: "Tên đăng nhập hoặc email đã tồn tại!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const insertQuery = `
            INSERT INTO users (fullName, username, phone, email, password, role, created_at)
            VALUES (?, ?, ?, ?, ?, 'gv', NOW())`;

        const [result] = await db.execute(insertQuery, [fullName, username, phone, email, hashedPassword]);

        res.status(201).json({ message: "Thêm giáo viên thành công!", teacherId: result.insertId });
    } catch (error) {
        console.error("❌ Lỗi server:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});
router.delete("/teachers/:id", async (req, res) => {
    const teacherId = req.params.id;

    try {
        const [result] = await db.execute("DELETE FROM users WHERE id = ? AND role = 'gv'", [teacherId]);

        if (result.affectedRows > 0) {
            res.json({ message: "✅ Giáo viên đã được xóa thành công!" });
        } else {
            res.status(404).json({ error: "❌ Không tìm thấy giáo viên hoặc giáo viên không tồn tại!" });
        }
    } catch (error) {
        console.error("❌ Lỗi khi xóa giáo viên:", error);
        res.status(500).json({ error: "❌ Lỗi máy chủ khi xóa giáo viên!" });
    }
});

router.get("/schedules", async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT s.id, c.class_name, t.username AS teacher_name, p.start_time, p.end_time, s.day_of_week 
            FROM schedule s
            JOIN class c ON s.class_id = c.id
            JOIN users t ON s.teacher_id = t.id AND t.role = 'gv'
            JOIN period_time p ON s.period_id = p.id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách thời khóa biểu" });
    }
});


router.get("/students", async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT id, username, email, created_at 
            FROM users 
            WHERE role = 'hv'
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách học viên" });
    }
});

router.get("/revenue", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT DATE(latest_pay_at) as date, SUM(already_pay) as revenue
            FROM student_pay_fee
            WHERE MONTH(latest_pay_at) = MONTH(CURRENT_DATE()) 
              AND YEAR(latest_pay_at) = YEAR(CURRENT_DATE())
            GROUP BY DATE(latest_pay_at)
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Đóng kết nối MySQL khi server dừng
process.on("exit", async () => {
    console.log("⚠️ Đóng kết nối MySQL...");
    await db.end();
});

export default router;
