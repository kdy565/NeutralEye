document.getElementById("analyze-btn").addEventListener("click", async () => {
    const loadingEl = document.getElementById("loading");
    const resultEl = document.getElementById("result");
    const errorEl = document.getElementById("error");
  
    loadingEl.style.display = "block";
    resultEl.style.display = "none";
    errorEl.style.display = "none";
    resultEl.textContent = "";
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
      const data = JSON.parse(rawData.result);
      
      console.log("파싱된 GPT 응답 데이터:", data);
      if (!data || typeof data.score === "undefined" || typeof data.summary === "undefined" || typeof data.analysis === "undefined") {
        throw new Error("API 응답 데이터가 올바르지 않습니다.");
      }
      
      // 결과를 줄마다 표시
        loadingEl.style.display = "none";
        resultEl.style.display = "block";
        resultEl.innerHTML = `
            <p><strong>점수:</strong> ${data.score}</p>
            <p><strong>한줄평:</strong> ${data.summary}</p>
            <p><strong>근거:</strong> ${data.analysis}</p>
        `;
    } catch (error) {
      loadingEl.style.display = "none";
      errorEl.style.display = "block";
      errorEl.textContent = `오류: ${error.message}`;
    }
  });