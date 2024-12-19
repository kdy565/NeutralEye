const OpenAI = require("openai");
require("dotenv").config();

if (!process.env.OPENAI_API_KEY) {
  console.error("환경 변수 OPENAI_API_KEY가 설정되지 않았습니다.");
  process.exit(1); // 서버 실행 중단
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const isDebug = process.env.DEBUG_MODE === "true"; // 디버깅 모드 여부

exports.analyzeNews = async (req, res) => {
  const { title, content, publisher } = req.body;

  if (!title || !content || !publisher) {
    return res.status(400).json({ error: "제목, 본문, 또는 언론사가 누락되었습니다." });
  }

  try {
    console.log("수신된 데이터:", { title, content, publisher });

    if (isDebug) {
      // 디버깅 모드: 더미 데이터 반환
      console.log("디버깅 모드 활성화 - GPT 호출 건너뜀");
      const dummyResult = {
        result: "디버깅 중입니다. 이 기사는 중립적으로 보입니다. (더미 데이터)",
      };
      return res.status(200).json(dummyResult);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // 사용할 GPT 모델
      messages: [
        {
          role: "system",
          content: `뉴스 제목, 본문, 그리고 언론사에 대한 정보가 주어지면, 이를 다각도로 분석하여 결과를 내는 것이 당신의 역할입니다. 다음 세 가지를 반드시 수행하세요:
      
      1. -10부터 +10까지의 정수 점수를 통해 기사 내용이 정치적으로 보수(10)인지 진보(-10)인지 판단하세요.
      2. 해당 기사에 대한 한줄평을 생성하세요 (40자 이내).
      3. 점수와 한줄평의 근거와 설명을 해당 기사의 내용을 인용한 분석글로 작성하세요.
      
      결과는 JSON 형식으로 반환되어야 합니다. 예시는 다음과 같습니다:
      
      점수: 6
      한줄평: 이재명에 대해 검찰 수사의 부당함만을 강조하고 있는 편향된 기사입니다.
      근거: 글 전체에 이재명의 혐의에 대한 언급을 최대한 배제하면서 억울함만을 피력하는 기사로 보아, ~입니다.
      
      반환 형식:
      {
        "score": 6,
        "summary": "이재명에 대해 검찰 수사의 부당함만을 강조하고 있는 편향된 기사입니다.",
        "analysis": "글 전체에 이재명의 혐의에 대한 언급을 최대한 배제하면서 억울함만을 피력하는 기사로 보아, ~입니다."
      }`
        },
        {
          role: "user",
          content: `제목: ${title}\n\n본문: ${content}\n\n언론사: ${publisher}`
        }
      ]      
    });

    const result = response.choices[0].message.content;
    res.status(200).json({ result });
  } catch (error) {
    console.error("GPT API 호출 실패:", error);
    res.status(500).json({ error: "GPT 요청 실패" });
  }
};
