import React, { useState, useEffect } from "react";
import "./AdminStyles.css";

const SystemManagement = () => {
    const [systemSettings, setSystemSettings] = useState({
        maintenanceMode: false,
        maxUsers: 1000,
        autoBackup: true,
    });

    useEffect(() => {
        // Giả lập fetch dữ liệu từ backend
        setTimeout(() => {
            setSystemSettings({
                maintenanceMode: false,
                maxUsers: 1200,
                autoBackup: true,
            });
        }, 1000);
    }, []);

    const handleToggleMaintenance = () => {
        setSystemSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
    };

    return (
        <div className="admin-container">
            <h2>Quản lý hệ thống</h2>
            <div className="admin-content">
                <p>Trang này dùng để quản lý các thiết lập hệ thống quan trọng.</p>
                <div className="settings-list">
                    <div className="setting-item">
                        <span>Chế độ bảo trì:</span>
                        <button className={systemSettings.maintenanceMode ? "btn-danger" : "btn-success"} onClick={handleToggleMaintenance}>
                            {systemSettings.maintenanceMode ? "Tắt" : "Bật"}
                        </button>
                    </div>
                    <div className="setting-item">
                        <span>Số lượng tài khoản tối đa:</span>
                        <strong>{systemSettings.maxUsers}</strong>
                    </div>
                    <div className="setting-item">
                        <span>Sao lưu tự động:</span>
                        <strong>{systemSettings.autoBackup ? "Đã bật" : "Đã tắt"}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemManagement;
