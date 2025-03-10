import mysql from "mysql";
import bcrypt from "bcrypt";

const db = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "11111111",
    database: "tutoring_center",
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error("❌ Lỗi kết nối database:", err);
        return;
    }
    console.log("✅ Kết nối database thành công!");
});

const updatePasswords = async () => {
    const selectQuery = "SELECT id, password FROM users WHERE id < 14"; // Chỉ cập nhật tài khoản cũ

    db.query(selectQuery, async (err, results) => {
        if (err) {
            console.error("Lỗi truy vấn:", err);
            return;
        }

        for (const user of results) {
            if (user.password.length < 20) { // Nếu là mật khẩu plain text (vì bcrypt hash dài hơn 20 ký tự)
                const hashedPassword = await bcrypt.hash(user.password, 10);
                const updateQuery = "UPDATE users SET password = ? WHERE id = ?";
                db.query(updateQuery, [hashedPassword, user.id], (err, result) => {
                    if (err) {
                        console.error(`❌ Lỗi cập nhật user ${user.id}:`, err);
                    } else {
                        console.log(`✅ Đã cập nhật mật khẩu cho user ID ${user.id}`);
                    }
                });
            }
        }
    });
};

updatePasswords();
