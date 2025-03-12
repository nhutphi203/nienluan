import React, { useState } from "react";


const BackupRestore = () => {
    const [backupStatus, setBackupStatus] = useState(null);
    const [restoreStatus, setRestoreStatus] = useState(null);

    const handleBackup = async () => {
        try {
            // Giả lập API sao lưu dữ liệu
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setBackupStatus("Sao lưu thành công!");
        } catch (error) {
            setBackupStatus("Sao lưu thất bại!");
        }
    };

    const handleRestore = async () => {
        try {
            // Giả lập API khôi phục dữ liệu
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setRestoreStatus("Khôi phục thành công!");
        } catch (error) {
            setRestoreStatus("Khôi phục thất bại!");
        }
    };

    return (
        <div className="backup-restore-container">
            <h2>Quản lý sao lưu và khôi phục dữ liệu</h2>
            <button onClick={handleBackup}>Sao lưu dữ liệu</button>
            {backupStatus && <p>{backupStatus}</p>}
            <button onClick={handleRestore}>Khôi phục dữ liệu</button>
            {restoreStatus && <p>{restoreStatus}</p>}
        </div>
    );
};

export default BackupRestore;
