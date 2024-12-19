// content.js: HTML 본문 텍스트 추출 및 제목, 언론사 추출
console.log("content.js 로드됨");

function extractMainContent() {
    const articleElement = document.querySelector("article.go_trans._article_content");
  
    if (!articleElement) {
      console.warn("본문을 찾을 수 없습니다.");
      return null;
    }
  
    const mainContent = Array.from(articleElement.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE || node.tagName === "BR")
      .map((node) => (node.nodeType === Node.TEXT_NODE ? node.textContent.trim() : "\n"))
      .join("")
      .replace(/\n+/g, "\n")
      .trim();
  
    return mainContent;
  }
  
  function extractTitle() {
    const titleElement = document.querySelector("h2");
    if (!titleElement) {
      console.warn("제목을 찾을 수 없습니다.");
      return null;
    }
    return titleElement.textContent.trim();
  }
  
  function extractPublisher() {
    // 시도 1: og:article:author 메타 태그에서 추출
    const metaElement = document.querySelector("meta[property='og:article:author']");
    if (metaElement && metaElement.content) {
      return metaElement.content.split("|")[0].trim(); // '동아사이언스 | 네이버'에서 '동아사이언스'만 추출
    }
  
    // 시도 2: 언론사 로고 또는 텍스트가 포함된 요소에서 추출
    const logoElement = document.querySelector(".media_end_head_top_logo_text");
    if (logoElement) {
      return logoElement.textContent.trim();
    }
  
    console.warn("언론사를 찾을 수 없습니다.");
    return null;
  }
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("content.js 메시지 수신:", message);
  
    if (message.action === "extractContent") {
      const content = extractMainContent();
      const title = extractTitle();
      const publisher = extractPublisher();
  
      sendResponse({
        content: content || "본문을 찾을 수 없습니다.",
        title: title || "제목을 찾을 수 없습니다.",
        publisher: publisher || "언론사를 찾을 수 없습니다.",
      });
    }
  });
  