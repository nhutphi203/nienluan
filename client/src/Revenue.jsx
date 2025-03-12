import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Revenue = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:5000/manager/revenue")
            .then((response) => {
                console.log("API Response:", response.data);
                setData(response.data);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
            });
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
    };

    const sanitizedData = data.map(item => ({
        ...item,
        date: formatDate(item.date),
        revenue: item.revenue || 0
    }));

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={sanitizedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default Revenue;
