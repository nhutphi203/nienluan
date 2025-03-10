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
// 📌 API: Lấy danh sách các lớp còn đủ chỗ cho học viên đăng ký
router.get("/available-classes", (req, res) => {
    const sql = `
        SELECT c.id, c.name, c.subject, c.type, c.grade, c.max_student,
               (SELECT COUNT(*) FROM registrations WHERE class_id = c.id) AS current_student
        FROM class c
        WHERE (SELECT COUNT(*) FROM registrations WHERE class_id = c.id) < c.max_student
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Lỗi khi lấy danh sách lớp học còn đủ chỗ:", err);
            return res.status(500).json({ error: "Lỗi khi lấy danh sách lớp học", details: err.message });
        }

        // Trả về danh sách các lớp có chỗ trống
        res.json(results);
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
});
// 📌 API: Đăng ký lớp học và cập nhật số lượng học viên trong lớp
router.post("/register-group", (req, res) => {
    const { userId, classId } = req.body;

    // ✅ Kiểm tra dữ liệu từ frontend có hợp lệ không?
    if (!userId || !classId) {
        console.error("❌ Thiếu userId hoặc classId!");
        return res.status(400).json({ error: "Thiếu userId hoặc classId!" });
    }

    // Truy vấn kiểm tra lớp học, học phí, số lượng học viên...
    const checkQuery = `
        SELECT COUNT(*) AS current_student, 
               (SELECT max_student FROM class WHERE id = ?) AS max_student,
               (SELECT fee_amount FROM class WHERE id = ?) AS fee_amount
        FROM registrations WHERE class_id = ?
    `;

    db.query(checkQuery, [classId, classId, classId], (err, results) => {
        if (err) {
            console.error("❌ Lỗi kiểm tra số lượng học viên: ", err);
            return res.status(500).json({ error: "Lỗi kiểm tra số lượng học viên", details: err.message });
        }

        const { current_student, max_student, fee_amount } = results[0];
        // Kiểm tra nếu lớp đã đầy
        if (current_student >= max_student) {
            return res.status(400).json({ error: "Lớp đã đầy, không thể đăng ký!" });
        }

        const checkDuplicateQuery = "SELECT * FROM registrations WHERE user_id = ? AND class_id = ?";
        db.query(checkDuplicateQuery, [userId, classId], (err, results) => {
            if (err) {
                console.error("❌ Lỗi kiểm tra đăng ký: ", err);
                return res.status(500).json({ error: "Lỗi kiểm tra đăng ký", details: err.message });
            }
            if (results.length > 0) {
                return res.status(400).json({ error: "Bạn đã đăng ký lớp này rồi!" });
            }

            // ✅ Nếu hợp lệ, thêm vào bảng đăng ký
            const insertQuery = "INSERT INTO registrations (user_id, class_id) VALUES (?, ?)";
            db.query(insertQuery, [userId, classId], (err) => {
                if (err) {
                    console.error("❌ Lỗi đăng ký lớp học: ", err);
                    return res.status(500).json({ error: "Lỗi đăng ký lớp học!", details: err.message });
                }

                // Cập nhật học phí
                const updateFeeQuery = `
                    INSERT INTO student_fee (student_id, class_id, amount, start_at, end_at) 
                    VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH))
                    ON DUPLICATE KEY UPDATE amount = amount + ?, fee = fee;
                `;

                db.query(updateFeeQuery, [userId, classId, fee_amount, fee_amount], (err) => {
                    if (err) {
                        console.error("❌ Lỗi cập nhật học phí: ", err);
                        return res.status(500).json({ error: "Lỗi cập nhật học phí", details: err.message });
                    }

                    // Cập nhật số lượng học viên trong lớp
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
        SELECT c.id, c.name, c.subject, c.type, c.grade, c.max_student,
               GROUP_CONCAT(DISTINCT CONCAT(s.schedule_date, ': ', p.start_at, ' - ', p.end_at) SEPARATOR '; ') AS schedule
        FROM registrations r
        JOIN class c ON r.class_id = c.id
        JOIN schedule s ON c.id = s.class_id
        JOIN period_time p ON s.period_time_id = p.id
        WHERE r.user_id = ?
        GROUP BY c.id;
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






// API: Lấy danh sách học phí của sinh viên
router.get("/fees/:studentId", (req, res) => {
    const { studentId } = req.params;

    const query = `
       SELECT 
    sf.student_id, 
    COUNT(DISTINCT sf.class_id) AS subject_count,  
    CASE 
        WHEN COUNT(DISTINCT sf.class_id) = 1 THEN 800000
        WHEN COUNT(DISTINCT sf.class_id) = 2 THEN 1500000
        WHEN COUNT(DISTINCT sf.class_id) >= 3 THEN 2000000
        ELSE 0
    END AS total_fee,
    (SELECT COALESCE(SUM(amount), 0) FROM student_payments WHERE student_id = sf.student_id) AS already_pay,
    (CASE 
        WHEN COUNT(DISTINCT sf.class_id) = 1 THEN 800000
        WHEN COUNT(DISTINCT sf.class_id) = 2 THEN 1500000
        WHEN COUNT(DISTINCT sf.class_id) >= 3 THEN 2000000
        ELSE 0
    END - (SELECT COALESCE(SUM(amount), 0) FROM student_payments WHERE student_id = sf.student_id)) AS remaining
FROM student_fee sf
WHERE sf.student_id = ?   -- 💡 Chỉ lấy dữ liệu của học viên có id cụ thể
GROUP BY sf.student_id;

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

