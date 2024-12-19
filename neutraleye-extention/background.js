console.log("백그라운드 스크립트 실행 중...");

chrome.action.onClicked.addListener((tab) => {
  console.log("확장 프로그램 아이콘이 클릭되었습니다.");
});
