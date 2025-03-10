import express from "express";
import mysql from "mysql2";

const router = express.Router();

const db = mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "11111111",
    database: process.env.DB_NAME || "tutoring_center",
    port: process.env.DB_PORT || 3306
});

// Định nghĩa route
router.get("/", (req, res) => {
    res.send("Admin route is working!");
});

export default router;
