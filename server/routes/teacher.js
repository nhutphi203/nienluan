import express from "express";
import mysql from "mysql";

const router = express.Router();

// Kết nối database
const db = mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "11111111",
    database: process.env.DB_NAME || "tutoring_center",
    port: process.env.DB_PORT || 3306
});
// Đổi đường dẫn API thành /manager/classes
router.get("/manager/classes", async (req, res) => {
    try {
        const [classes] = await db.query("SELECT * FROM class");
        res.json(classes);
    } catch (err) {
        res.status(500).json({ error: "Lỗi lấy danh sách lớp!" });
    }
});

router.post("/manager/classes", async (req, res) => {
    try {
        const { name, subject, type, grade, max_student } = req.body;
        await db.query("INSERT INTO class (name, subject, type, grade, max_student) VALUES (?, ?, ?, ?, ?)",
            [name, subject, type, grade, max_student]);

        res.status(201).json({ message: "Lớp học đã được tạo!" });
    } catch (err) {
        res.status(500).json({ error: "Lỗi tạo lớp học!" });
    }
});

router.post("/manager/classes/:id/periods", async (req, res) => {
    try {
        const { periods } = req.body;
        const classId = req.params.id;

        for (let periodId of periods) {
            await db.query("INSERT INTO period_time_class (period_time_id, class_id) VALUES (?, ?)", [periodId, classId]);
        }

        res.json({ message: "Đã cập nhật lịch học!" });
    } catch (err) {
        res.status(500).json({ error: "Lỗi cập nhật lịch học!" });
    }
});
// API: Lấy lịch dạy của giáo viên
router.get("/schedule/:teacher_id", (req, res) => {
    const teacherId = req.params.teacher_id; // Lấy teacher_id từ URL

    // Câu lệnh SQL để lấy lịch dạy của giáo viên
    const sql = `
    SELECT 
        s.schedule_date, 
        sg.group_name, 
        pt.date_of_week,           -- Ngày trong tuần từ bảng period_time
        pt.start_at,             -- Thời gian bắt đầu từ bảng period_time
        pt.end_at,               -- Thời gian kết thúc từ bảng period_time
        c.name AS classroom_name,
        t.name AS teacher_name
    FROM 
        schedule s
    JOIN 
        study_groups sg ON s.group_id = sg.id
    JOIN 
        period_time pt ON s.period_time_id = pt.id
    JOIN 
        class c ON s.classroom_id = c.id
    JOIN 
        teacher t ON s.teacher_id = t.id
    WHERE 
        s.teacher_id = 1
    ORDER BY 
        s.schedule_date, pt.start_at;
`;


    db.query(sql, [teacherId], (err, results) => {
        if (err) {
            console.error("❌ Lỗi khi lấy lịch dạy:", err);
            return res.status(500).json({ error: "Lỗi khi lấy lịch dạy!" });
        }

        // Trả về lịch dạy
        res.json(results);
    });
});


router.post("/grades", (req, res) => {
    const { student_id, class_id, exam_name, score, exam_date } = req.body;

    if (!student_id || !class_id || !exam_name || score === undefined || !exam_date) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc!" });
    }

    // 🔥 Kiểm tra xem học viên có thuộc lớp này không
    const checkStudentQuery = `
        SELECT * FROM registrations WHERE user_id = ? AND class_id = ?
    `;

    db.query(checkStudentQuery, [student_id, class_id], (err, results) => {
        if (err) {
            console.error("❌ Lỗi kiểm tra học viên:", err);
            return res.status(500).json({ error: "Lỗi server khi kiểm tra học viên!" });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: "Học viên không thuộc lớp này!" });
        }

        // ✅ Chỉ lưu điểm nếu học viên thuộc lớp
        const insertScoreQuery = `
            INSERT INTO student_scores (student_id, class_id, exam_name, score, exam_date) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE score = VALUES(score), exam_date = VALUES(exam_date);
        `;

        db.query(insertScoreQuery, [student_id, class_id, exam_name, score, exam_date], (err, result) => {
            if (err) {
                console.error("❌ Lỗi khi nhập điểm:", err);
                return res.status(500).json({ error: "Lỗi server khi lưu điểm!" });
            }
            res.json({ message: "Lưu điểm thành công!" });
        });
    });
});


router.get("/class", (req, res) => {
    db.query("SELECT id, name FROM class", (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi lấy danh sách nhóm!" });
        res.json(results);
    });
});

router.get("/students", (req, res) => {
    const { class_id } = req.query;  // Lấy class_id từ query string

    if (!class_id) {
        return res.status(400).json({ error: "Thiếu class_id" });
    }

    const sql = `
        SELECT u.id, u.fullName 
        FROM users u
        JOIN registrations r ON u.id = r.user_id
        WHERE u.role = 'hv' AND r.class_id = ?;
    `;

    db.query(sql, [class_id], (err, results) => {
        if (err) {
            console.error("❌ Lỗi khi lấy danh sách học viên:", err);
            return res.status(500).json({ error: "Lỗi lấy danh sách học viên!" });
        }
        res.json(results);
    });
});




// 📌 API: Giáo viên cập nhật điểm
router.put("/grades/:scoreId", (req, res) => {
    const scoreId = req.params.scoreId;
    const { score } = req.body;

    if (!score) {
        return res.status(400).json({ error: "Thiếu điểm số!" });
    }

    const sql = `UPDATE student_scores SET score = ? WHERE id = ?`;

    db.query(sql, [score, scoreId], (err, result) => {
        if (err) {
            console.error("❌ Lỗi khi cập nhật điểm:", err);
            return res.status(500).json({ error: "Lỗi khi cập nhật điểm!" });
        }
        res.json({ message: "Cập nhật điểm thành công!" });
    });
});

export default router;
