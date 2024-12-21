document.getElementById("analyze-btn").addEventListener("click", async () => {
    const loadingEl = document.getElementById("loading");
    const summaryEl = document.getElementById("summary");
    const analysisEl = document.getElementById("analysis");
    const errorEl = document.getElementById("error");
    const needleEl = document.getElementById("needle");
    const scoreLabelEl = document.getElementById("score-label");
  
    loadingEl.style.display = "block";
    summaryEl.style.display = "none";
    analysisEl.style.display = "none";
    errorEl.style.display = "none";
    summaryEl.textContent = "";
    analysisEl.textContent = "";
    errorEl.textContent = "";
  
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, { action: "extractContent" });
  
      if (!response || !response.content || !response.title || !response.publisher) {
        throw new Error("본문, 제목, 또는 언론사 추출 실패: 페이지 구조를 확인하세요.");
      }
  
      // API 요청
      const res = await fetch("http://localhost:3000/api/gpt/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: response.title,
          content: response.content,
          publisher: response.publisher,
        }),
      });
  
      if (!res.ok) {
        throw new Error("API 요청 실패");
      }
  
      const rawData = await res.json();
      const data = JSON.parse(rawData.result); // result를 다시 파싱
  
      if (!data || typeof data.score === "undefined" || typeof data.summary === "undefined" || typeof data.analysis === "undefined") {
        throw new Error("API 응답 데이터가 올바르지 않습니다.");
      }
  
      // 점수 시각화
      const score = data.score;
      const rotation = (score / 10) * 90; // -10 ~ +10을 -90deg ~ +90deg로 변환
      needleEl.style.transform = `rotate(${rotation}deg)`;
      scoreLabelEl.textContent = score;
  
      // 결과 표시
      loadingEl.style.display = "none";
      summaryEl.style.display = "block";
      analysisEl.style.display = "block";
      summaryEl.textContent = `한줄평: ${data.summary}`;
      analysisEl.textContent = `근거: ${data.analysis}`;
    } catch (error) {
      loadingEl.style.display = "none";
      errorEl.style.display = "block";
      errorEl.textContent = `오류: ${error.message}`;
    }
  });
  