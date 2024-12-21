document.getElementById("analyze-btn").addEventListener("click", async () => {
    const analyzeBtn = document.getElementById("analyze-btn");
    const loadingEl = document.getElementById("loading");
    const summaryEl = document.getElementById("summary");
    const analysisEl = document.getElementById("analysis");
    const errorEl = document.getElementById("error");
    const gaugeEl = document.getElementById("gauge");
    const needleEl = document.getElementById("needle");
  
    analyzeBtn.style.display = "none"; // 분석 버튼 숨기기
    loadingEl.style.display = "block";
    summaryEl.style.display = "none";
    analysisEl.style.display = "none";
    errorEl.style.display = "none";
    summaryEl.textContent = "";
    analysisEl.textContent = "";
    errorEl.textContent = "";
  
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab.url;
  
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
  
      // 데이터 저장 (현재 URL 기준)
      chrome.storage.local.set({ [currentUrl]: data }, () => {
        console.log(`결과 데이터가 저장되었습니다: ${currentUrl}`, data);
      });
  
      // 점수 시각화
      const score = data.score;
      const rotation = (score / 10) * 90; // -10 ~ +10을 -90deg ~ +90deg로 변환
      gaugeEl.setAttribute("data-score", score); // 계기판에 점수 표시
      needleEl.style.transform = `rotate(${rotation}deg)`;
  
      // 결과 표시
      loadingEl.style.display = "none";
      summaryEl.style.display = "block";
      analysisEl.style.display = "block";
      summaryEl.textContent = `한줄평: ${data.summary}`;
      analysisEl.textContent = `근거: ${data.analysis}`;
    } catch (error) {
      analyzeBtn.style.display = "block"; // 오류 시 버튼 복원
      loadingEl.style.display = "none";
      errorEl.style.display = "block";
      errorEl.textContent = `오류: ${error.message}`;
    }
  });
  
  // 데이터 복원
  document.addEventListener("DOMContentLoaded", async () => {
    const summaryEl = document.getElementById("summary");
    const analysisEl = document.getElementById("analysis");
    const gaugeEl = document.getElementById("gauge");
    const needleEl = document.getElementById("needle");
    const analyzeBtn = document.getElementById("analyze-btn");
  
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tab.url;
  
    // 저장된 데이터 복원
    chrome.storage.local.get(currentUrl, (result) => {
      if (result[currentUrl]) {
        const data = result[currentUrl];
  
        // 점수 시각화
        const score = data.score;
        const rotation = (score / 10) * 90; // -10 ~ +10을 -90deg ~ +90deg로 변환
        gaugeEl.setAttribute("data-score", score);
        needleEl.style.transform = `rotate(${rotation}deg)`;
  
        // 결과 표시
        summaryEl.style.display = "block";
        analysisEl.style.display = "block";
        summaryEl.textContent = `한줄평: ${data.summary}`;
        analysisEl.textContent = `근거: ${data.analysis}`;
  
        // 분석 버튼 숨기기
        analyzeBtn.style.display = "none";
      } else {
        analyzeBtn.style.display = "block"; // 데이터가 없으면 버튼 표시
      }
    });
  });
  