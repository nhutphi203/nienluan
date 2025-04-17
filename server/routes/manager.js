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
router.get("/group-options", async (req, res) => {
    try {
        const [subjects] = await db.query("SELECT DISTINCT subject FROM class");
        const [types] = await db.query("SELECT DISTINCT type FROM class");
        const [grades] = await db.query("SELECT DISTINCT grade.grade FROM grade");
        const [max_students] = await db.query("SELECT DISTINCT max_student FROM class");

        // 🔥 Lấy lịch học từ period_time thông qua period_time_class
        const [schedules] = await db.query(`
           SELECT pt.id, pt.name, pt.date_of_week, pt.start_at, pt.end_at
            FROM period_time pt
        `);

        // Định dạng lại lịch học
        const formattedSchedules = schedules.map(row => ({
            id: row.id,
            name: row.name,
            time: `${row.date_of_week} - ${row.start_at} đến ${row.end_at}`,
        }));

        // Ánh xạ dữ liệu từ DB sang loại mong muốn
        const typeMapping = {
            NORMAL: "Lớp cơ bản",
            Math: "Lớp ôn thi vào 10, thi đại học",
            VIP: "Lớp ôn thi học sinh giỏi",
            Advanced: "Lớp nâng cao",
        };

        const mappedTypes = types
            .map(row => typeMapping[row.type] || "Khác") // Nếu không có trong mapping, gán "Khác"
            .filter((value, index, self) => self.indexOf(value) === index); // Xóa trùng lặp

        res.json({
            subjects: subjects.map(row => row.subject).filter(Boolean),
            types: mappedTypes,
            grades: grades.map(row => row.grade).filter(Boolean),
            max_students: max_students.map(row => row.max_student).filter(Boolean),
            schedules: schedules.map(row => ({
                id: row.id,
                name: row.name,
                date: row.date_of_week,
                start: row.start_at,
                end: row.end_at
            }))
        });
    } catch (err) {
        console.error("Lỗi truy vấn dữ liệu:", err);
        res.status(500).json({ message: "Lỗi lấy dữ liệu nhóm học" });
    }
});


router.delete('/group/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction(); // Bắt đầu transaction

        // Xóa dữ liệu thanh toán học phí của sinh viên trong nhóm
        await connection.query('DELETE FROM student_pay_fee WHERE student_id IN (SELECT id FROM student WHERE class_id = ?)', [id]);

        // Xóa điểm danh của buổi học bù
        await connection.query('DELETE FROM roll_call WHERE make_up_class_id IN (SELECT id FROM make_up_class WHERE class_id = ?)', [id]);

        // Xóa các buổi học bù
        await connection.query('DELETE FROM make_up_class WHERE class_id = ?', [id]);

        // Xóa sinh viên khỏi nhóm học
        await connection.query('DELETE FROM student WHERE class_id = ?', [id]);

        // Xóa nhóm học (class)
        const [result] = await connection.query('DELETE FROM class WHERE id = ?', [id]);

        if (result.affectedRows > 0) {
            await connection.commit(); // Xác nhận xóa thành công
            res.json({ message: 'Xóa nhóm học thành công' });
        } else {
            await connection.rollback(); // Hoàn tác nếu không xóa được
            res.status(404).json({ error: 'Nhóm học không tồn tại' });
        }
    } catch (error) {
        await connection.rollback(); // Hoàn tác nếu có lỗi
        console.error('💥 Lỗi xóa nhóm:', error);
        res.status(500).json({ error: 'Lỗi server' });
    } finally {
        connection.release(); // Giải phóng kết nối
    }
});


router.post("/group", async (req, res) => {
    try {
        const { name, subject, type, grade, max_student, period_time_ids } = req.body;

        if (!name || !subject || !type || !grade || !max_student || !period_time_ids || period_time_ids.length === 0) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin nhóm học và thời gian học!" });
        }

        // Kiểm tra grade
        const [gradeRows] = await db.execute("SELECT id FROM grade WHERE grade = ?", [grade]);
        if (gradeRows.length === 0) {
            return res.status(400).json({ message: `Giá trị grade '${grade}' không tồn tại trong bảng grade!` });
        }
        const gradeId = gradeRows[0].id;

        // Thêm vào bảng class
        const sql = `INSERT INTO class (name, subject, type, grade, max_student) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.execute(sql, [name, subject, type, gradeId, max_student]);

        const classId = result.insertId; // ID của nhóm học vừa tạo

        // Thêm dữ liệu vào bảng trung gian class_period_time
        const periodSql = `INSERT INTO period_time_class (class_id, period_time_id) VALUES (?, ?)`;
        for (const periodId of period_time_ids) {
            await db.execute(periodSql, [classId, periodId]);
        }

        res.status(201).json({ message: "Nhóm học đã được tạo thành công!", id: classId });
    } catch (err) {
        console.error("Lỗi khi tạo nhóm học:", err);
        res.status(500).json({ message: "Lỗi server, không thể tạo nhóm học!" });
    }
});


// API lấy danh sách lớp
router.get("/classes", async (req, res) => {
    try {
        const [classes] = await db.execute("SELECT * FROM `class`");
        res.json(classes);
    } catch (error) {
        res.status(500).json({ error: "Lỗi lấy danh sách lớp", details: error.message });
    }
});

router.post("/group", async (req, res) => {
    try {
        const { name, subject, type, grade, max_student } = req.body;

        if (!name || !subject || !type || !grade || !max_student) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin nhóm học!" });
        }

        // Kiểm tra giá trị grade truyền vào
        console.log("Grade nhận được từ request:", grade);

        // Kiểm tra nếu grade là số hoặc chuỗi
        const [gradeRows] = await db.execute("SELECT id FROM grade WHERE id = ?", [grade]);

        console.log("Kết quả truy vấn grade:", gradeRows);

        if (gradeRows.length === 0) {
            return res.status(400).json({ message: `Giá trị grade '${grade}' không tồn tại trong bảng grade!` });
        }

        const gradeId = gradeRows[0].id; // Lấy ID hợp lệ của grade

        // Thêm vào bảng class
        const sql = `INSERT INTO class (name, subject, type, grade, max_student) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.execute(sql, [name, subject, type, gradeId, max_student]);

        res.status(201).json({ message: "Nhóm học đã được tạo thành công!", id: result.insertId });
    } catch (err) {
        console.error("Lỗi khi tạo nhóm học:", err);
        res.status(500).json({ message: "Lỗi server, không thể tạo nhóm học!" });
    }
});



// API xóa lớp học
router.delete("/classes/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute("SELECT * FROM `class` WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Lớp học không tồn tại" });
        }
        await db.execute("DELETE FROM `class` WHERE id = ?", [id]);
        res.json({ message: "Lớp học đã được xóa" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa lớp học", details: error.message });
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
router.post("/students", async (req, res) => {
    const { fullName, username, email, phone, password } = req.body;
    if (!fullName || !username || !email || !phone || !password) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // 🔥 Thêm vào database và lấy id vừa thêm
        const [result] = await db.execute(
            "INSERT INTO users (fullName, username, email, phone, password, role) VALUES (?, ?, ?, ?, ?, 'hv')",
            [fullName, username, email, phone, hashedPassword]
        );

        // 🔥 Lấy danh sách học viên mới nhất, đảm bảo có `id`
        const [students] = await db.execute("SELECT id, fullName, username, email, phone FROM users WHERE role = 'hv'");

        res.json({ message: "Thêm học viên thành công", id: result.insertId, students }); // ✅ Trả về cả id và danh sách mới
    } catch (error) {
        console.error("Lỗi khi thêm học viên:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
});

router.delete("/students/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Học viên không tồn tại!" });
        }
        res.json({ message: "Xóa học viên thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa học viên", details: error.message });
    }
});

router.get("/students/paid", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                u.id, 
                u.fullName, 
                u.phone, 
                COALESCE(SUM(spf.already_pay), 0) AS total_pay, 
                MAX(spf.latest_pay_at) AS latest_pay_at
            FROM student_pay_fee spf
            JOIN users u ON spf.student_id = u.id
            WHERE spf.already_pay > 0
            GROUP BY u.id, u.fullName, u.phone
            ORDER BY latest_pay_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
