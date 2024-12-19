const express = require("express");
const { analyzeNews } = require("../controllers/gptController");

const router = express.Router();

// 뉴스 중립성 평가 API
router.post("/analyze", analyzeNews);

module.exports = router;

