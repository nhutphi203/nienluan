import express from "express";
import Parser from "rss-parser";

const router = express.Router();
const parser = new Parser();
const RSS_URL = "https://vnexpress.net/rss/giao-duc.rss";

router.get("/news", async (req, res) => {
    try {
        const feed = await parser.parseURL(RSS_URL);

        // Lọc ra 5 tin mới nhất và lấy mô tả đầy đủ hơn
        const news = feed.items.slice(0, 5).map((item) => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            description: item.contentSnippet || item.description || "Không có mô tả.",
        }));

        res.json(news);
    } catch (error) {
        console.error("Lỗi khi lấy tin tức:", error);
        res.status(500).json({ error: "Không thể lấy tin tức" });
    }
});

export default router;
