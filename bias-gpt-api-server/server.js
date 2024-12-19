const express = require("express");
const dotenv = require("dotenv");
const gptRoutes = require("./routes/gptRoutes");

dotenv.config();
const app = express();

app.use(express.json()); // JSON 요청 본문 파싱

// 미들웨어: 요청 데이터를 로깅
app.use((req, res, next) => {
  console.log("새로운 요청 수신:");
  console.log(`URL: ${req.originalUrl}`);
  console.log(`HTTP Method: ${req.method}`);
  console.log("Body:", req.body); // 요청 본문 출력
  next();
});

// 라우트 설정
app.use("/api/gpt", gptRoutes);

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
