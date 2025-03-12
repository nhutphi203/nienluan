import mysql from "mysql";
import express from "express";
const router = express.Router();


// Kết nối database sử dụng pool
const db = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "11111111",
    database: process.env.DB_NAME || "tutoring_center",
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10 // Giới hạn số kết nối tối đa
});

// Kiểm tra kết nối
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
    connection.release(); // Giải phóng kết nối sau khi kiểm tra
});

// 📌 API: Lấy thông tin cá nhân học viên
router.get("/profile/:id", (req, res) => {
    const studentId = req.params.id;
    const query = "SELECT id, fullName, username, phone, email, role, created_at FROM users WHERE id = ? AND role = 'hv'";

    db.query(query, [studentId], (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi truy vấn cơ sở dữ liệu!" });
        if (results.length === 0) return res.status(404).json({ error: "Không tìm thấy học viên!" });
        res.json(results[0]);
    });
});
router.get("/available-classes", (req, res) => {
    const sql = `
SELECT 
    c.id, 
    c.name, 
    c.subject, 
    c.type, 
    CASE 
        WHEN c.grade = 1 THEN 10
        WHEN c.grade = 2 THEN 11
        WHEN c.grade = 3 THEN 12
        ELSE c.grade
    END AS grade,
    c.max_student,
    (SELECT COUNT(*) FROM registrations WHERE class_id = c.id) AS current_student,
    GROUP_CONCAT(
        DISTINCT CONCAT(pt.date_of_week, ' (', pt.start_at, ' - ', pt.end_at, ')') 
        ORDER BY FIELD(pt.date_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
        SEPARATOR ', '
    ) AS schedule
FROM class c
JOIN period_time_class ptc ON c.id = ptc.class_id
JOIN period_time pt ON ptc.period_time_id = pt.id
GROUP BY c.id, c.name, c.subject, c.type, grade, c.max_student;
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Lỗi khi lấy danh sách lớp học còn đủ chỗ:", err);
            return res.status(500).json({ error: "Lỗi khi lấy danh sách lớp học", details: err.message });
        }

        // Map lại type theo trình độ
        const typeMapping = {
            "NORMAL": "Lớp cơ bản",
            "Advanced": "Lớp nâng cao",
            "Math": "Lớp ôn thi học sinh giỏi",
            "VIP": "Lớp ôn thi vào 10, thi đại học"
        };

        // Chuyển đổi dữ liệu
        const formattedResults = results.map(classItem => ({
            ...classItem,
            type: typeMapping[classItem.type] || classItem.type // Nếu không có trong map thì giữ nguyên
        }));

        res.json(formattedResults);
    });
});


router.get("/classes/:userId", (req, res) => {
    const { userId } = req.params;

    const sql = `
        SELECT 
            c.id, c.name, c.type, c.grade, c.max_student,
            (SELECT COUNT(*) FROM registrations WHERE class_id = c.id) AS current_student,
            GROUP_CONCAT(DISTINCT CONCAT(s.schedule_date, ': ', p.start_at, ' - ', p.end_at) SEPARATOR '; ') AS schedule
        FROM class c
        JOIN schedule s ON c.id = s.class_id
        JOIN period_time p ON s.period_time_id = p.id
        LEFT JOIN registrations r ON c.id = r.class_id AND r.user_id = ?
        WHERE r.user_id IS NULL
        GROUP BY c.id
        ORDER BY c.id;
    `;

    db.query(sql, [userId], (err, results) => {
        if (results.length === 0) {
            return res.status(200).json([]); // ✅ Trả về danh sách rỗng thay vì lỗi 404
        }
        if (err) return res.status(500).json({ error: "Lỗi server khi truy vấn dữ liệu" });
        res.json(results);
    });
});// 📌 API: Đăng ký lớp học và cập nhật số lượng học viên trong lớp
// 📌 API: Đăng ký lớp học và cập nhật số lượng học viên trong lớp
router.post("/register-group", (req, res) => {
    const { userId, classId } = req.body;

    // ✅ Kiểm tra dữ liệu đầu vào
    if (!userId || !classId) {
        console.error("❌ Thiếu userId hoặc classId!");
        return res.status(400).json({ error: "Thiếu userId hoặc classId!" });
    }

    // 🔍 Truy vấn để lấy thông tin lớp học & môn học
    const checkClassQuery = `
        SELECT subject, max_student, fee_amount, current_student 
        FROM class 
        WHERE id = ?
    `;

    db.query(checkClassQuery, [classId], (err, classResults) => {
        if (err) {
            console.error("❌ Lỗi truy vấn lớp học: ", err);
            return res.status(500).json({ error: "Lỗi truy vấn lớp học", details: err.message });
        }
        if (classResults.length === 0) {
            return res.status(404).json({ error: "Lớp học không tồn tại!" });
        }

        const { subject, max_student, fee_amount, current_student } = classResults[0];
        console.log(`📌 DEBUG: Lớp ${classId} - current: ${current_student}, max: ${max_student}`);

        // 🛑 Kiểm tra nếu lớp đã đầy
        if (current_student >= max_student) {
            return res.status(400).json({ error: "Lớp đã đầy, không thể đăng ký!" });
        }

        // 🔍 Kiểm tra số môn học mà học viên đã đăng ký
        const checkSubjectsQuery = `
            SELECT DISTINCT c.subject 
            FROM registrations r
            JOIN class c ON r.class_id = c.id
            WHERE r.user_id = ?
        `;

        db.query(checkSubjectsQuery, [userId], (err, subjectResults) => {
            if (err) {
                console.error("❌ Lỗi kiểm tra môn học đã đăng ký: ", err);
                return res.status(500).json({ error: "Lỗi kiểm tra môn học đã đăng ký", details: err.message });
            }

            const registeredSubjects = subjectResults.map(row => row.subject);

            // 🛑 Kiểm tra số môn học đã đăng ký (tối đa 3 môn)
            if (registeredSubjects.length >= 3) {
                return res.status(400).json({ error: "Bạn chỉ có thể đăng ký tối đa 3 môn học!" });
            }

            // 🛑 Kiểm tra trùng môn
            if (registeredSubjects.includes(subject)) {
                return res.status(400).json({ error: `Bạn đã đăng ký môn ${subject} rồi!` });
            }

            // ✅ Nếu hợp lệ, tiến hành đăng ký lớp học
            const insertQuery = "INSERT INTO registrations (user_id, class_id) VALUES (?, ?)";
            db.query(insertQuery, [userId, classId], (err) => {
                if (err) {
                    console.error("❌ Lỗi đăng ký lớp học: ", err);
                    return res.status(500).json({ error: "Lỗi đăng ký lớp học!", details: err.message });
                }

                // 💰 Cập nhật học phí
                const updateFeeQuery = `
                    INSERT INTO student_fee (student_id, class_id, amount, start_at, end_at) 
                    VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH))
                    ON DUPLICATE KEY UPDATE amount = amount + ?;
                `;

                db.query(updateFeeQuery, [userId, classId, fee_amount, fee_amount], (err) => {
                    if (err) {
                        console.error("❌ Lỗi cập nhật học phí: ", err);
                        return res.status(500).json({ error: "Lỗi cập nhật học phí", details: err.message });
                    }

                    // 👥 Cập nhật số lượng học viên trong lớp
                    const updateClassQuery = "UPDATE class SET current_student = current_student + 1 WHERE id = ?";
                    db.query(updateClassQuery, [classId], (err) => {
                        if (err) {
                            console.error("❌ Lỗi cập nhật số lượng học viên: ", err);
                            return res.status(500).json({ error: "Lỗi cập nhật số lượng học viên", details: err.message });
                        }

                        res.json({ message: "Đăng ký lớp học thành công và học phí đã được cập nhật!" });
                    });
                });
            });
        });
    });
});



router.get("/registered-classes/:userId", (req, res) => {
    const userId = req.params.userId;

    const sql = `
  SELECT 
            c.id, 
            c.name, 
            c.subject, 
            c.type, 
            c.grade, 
            c.max_student,
            (SELECT COUNT(*) FROM registrations WHERE class_id = c.id) AS current_student,
            GROUP_CONCAT(
                DISTINCT CONCAT(pt.date_of_week, ' (', pt.start_at, ' - ', pt.end_at, ')') 
                ORDER BY FIELD(pt.date_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
                SEPARATOR ', '
            ) AS schedule
        FROM class c
        JOIN registrations r ON c.id = r.class_id
        JOIN period_time_class ptc ON c.id = ptc.class_id
        JOIN period_time pt ON ptc.period_time_id = pt.id
        WHERE r.user_id = ?
        GROUP BY c.id, c.name, c.subject, c.type, c.grade, c.max_student;

    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("❌ Lỗi khi lấy lớp học:", err);
            return res.status(500).json({ error: "Lỗi server khi lấy lớp học!" });
        }

        // ✅ Nếu không còn lớp nào, trả về danh sách rỗng
        return res.status(200).json(results);
    });
});

// 📌 API: Hủy đăng ký nhóm học
router.delete("/unregister-group/:studentId/:classId", (req, res) => {
    const { studentId, classId } = req.params;

    db.getConnection((err, connection) => {
        if (err) {
            console.error("❌ Lỗi lấy kết nối từ pool:", err);
            return res.status(500).json({ error: "Lỗi kết nối cơ sở dữ liệu!" });
        }

        // Bắt đầu transaction
        connection.beginTransaction(() => {
            // 1️⃣ Kiểm tra xem học viên có điểm trong lớp này không
            const checkScoreSql = `SELECT COUNT(*) AS count FROM student_scores WHERE student_id = ? AND class_id = ?`;
            connection.query(checkScoreSql, [studentId, classId], (err, scoreResult) => {
                if (err) {
                    connection.rollback(() => connection.release());
                    return res.status(500).json({ error: "Lỗi kiểm tra điểm!", details: err.message });
                }

                if (scoreResult[0].count > 0) {
                    connection.rollback(() => connection.release());
                    return res.status(400).json({ error: "Bạn đã có điểm, không thể hủy đăng ký!" });
                }

                // 2️⃣ Xóa đăng ký khỏi bảng registrations
                const deleteRegistrationSql = `DELETE FROM registrations WHERE user_id = ? AND class_id = ?`;
                connection.query(deleteRegistrationSql, [studentId, classId], (err) => {
                    if (err) {
                        connection.rollback(() => connection.release());
                        return res.status(500).json({ error: "Lỗi khi hủy đăng ký lớp!", details: err.message });
                    }

                    // 3️⃣ Cập nhật số lượng học viên trong lớp
                    const updateClassSql = `UPDATE class SET current_student = current_student - 1 WHERE id = ?`;
                    connection.query(updateClassSql, [classId], (err) => {
                        if (err) {
                            connection.rollback(() => connection.release());
                            return res.status(500).json({ error: "Lỗi khi cập nhật lớp học!", details: err.message });
                        }

                        // ✅ Hoàn thành transaction
                        connection.commit((err) => {
                            if (err) {
                                connection.rollback(() => connection.release());
                                return res.status(500).json({ error: "Lỗi khi xác nhận transaction!", details: err.message });
                            }
                            connection.release();
                            return res.json({ message: "Hủy đăng ký thành công!" });
                        });
                    });
                });
            });
        });
    });
});





// API: Lấy danh sách học phí theo số nhóm (class)
router.get("/fees/:studentId", (req, res) => {
    const { studentId } = req.params;

    const query = `
      SELECT 
    r.user_id AS student_id, 
    COUNT(DISTINCT c.name) AS group_count,  
    COALESCE(COUNT(DISTINCT c.name) * 500000, 0) AS total_fee,  
    (SELECT COALESCE(SUM(amount), 0) FROM student_payments WHERE student_id = r.user_id) AS already_pay,
    (COALESCE(COUNT(DISTINCT c.name) * 500000, 0) - 
        (SELECT COALESCE(SUM(amount), 0) FROM student_payments WHERE student_id = r.user_id)
    ) AS remaining
FROM registrations r
LEFT JOIN class c ON r.class_id = c.id
WHERE r.user_id = ?  
GROUP BY r.user_id;

    `;

    db.query(query, [studentId], (err, results) => {
        if (err) {
            console.error("❌ Lỗi lấy danh sách học phí:", err);
            return res.status(500).json({ error: "Lỗi lấy danh sách học phí", details: err.message });
        }
        res.json(results);
    });
});

router.get("/grades/:student_id/:class_id", (req, res) => {
    const { student_id, class_id } = req.params;

    const getScoresQuery = `
        SELECT class_id, exam_name, score, exam_date 
        FROM student_scores 
        WHERE student_id = ? AND class_id = ?
    `;

    db.query(getScoresQuery, [student_id, class_id], (err, results) => {
        if (err) {
            console.error("❌ Lỗi lấy điểm:", err);
            return res.status(500).json({ error: "Lỗi server khi lấy điểm!" });
        }
        res.json(results);
    });
});


// 📌 API: Lấy danh sách học viên
router.get("/user", (req, res) => {
    const sql = "SELECT id, username AS fullName FROM users WHERE role = 'hv'";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi server" });
        res.json(results);
    });
});

export default router;

