import requests
from bs4 import BeautifulSoup
import re
import openai
import json
from dotenv import load_dotenv
import os

# .env 파일 로드
load_dotenv()

# 환경 변수에서 API 키 가져오기
openai.api_key = os.getenv("OPENAI_API_KEY")

# 전역 데이터베이스 (리스트 형태로 저장)
articles_db = []

def extract_article_info(url):
    """
    주어진 네이버 뉴스 URL에서 기사 제목, 날짜, 본문, 원문 링크를 추출하여 딕셔너리 형태로 반환.
    """
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 기사 제목 추출
        title_tag = soup.find('h2', {'class': 'media_end_head_headline'})
        title = title_tag.get_text(strip=True) if title_tag else '제목 없음'
        
        # 기사 날짜 추출
        date_tag = soup.find('span', {'class': 'media_end_head_info_datestamp_time'})
        date = date_tag['data-date-time'] if date_tag and 'data-date-time' in date_tag.attrs else '날짜 없음'
        
        # 기사 본문 추출
        content_tag = soup.find('article', {'id': 'dic_area'})
        content = content_tag.get_text(strip=True) if content_tag else '본문 없음'
        
        # 원문 링크 추출
        original_link_tag = soup.find('a', {'class': 'media_end_head_origin_link'})
        original_link = original_link_tag['href'] if original_link_tag else '원문 링크 없음'
        
        # 기사 정보 딕셔너리 생성
        article_info = {
            'title': title,
            'date': date,
            'original_link': original_link,
            'content': content
        }
        
        return article_info
    
    except Exception as e:
        print(f"Error extracting article info: {e}")
        return None

def analyze_bias_with_gpt(article_text):
    """
    기사를 GPT API에 전달하여 정치적 편향성을 분석하는 함수.
    GPT의 출력 형식을 JSON 형태로 고정함.
    """
    try:
        prompt = f"""
        아래는 뉴스 기사입니다. 이 기사를 읽고 정치적 편향성을 판단해주세요.
        결과는 반드시 아래의 JSON 형식만 사용해서 답변하세요:

        {{
            "score": 결과는 -50(매우 진보적)에서 +50(매우 보수적)까지의 점수로 편향성을 평가,
            "reason": "위 점수에 대해 판단한 근거"
        }}

        기사 내용:
        {article_text}
        """
        
        # 최신 API 호출 (openai v1.x)
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant for political bias analysis. Respond ONLY in JSON format."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.7
        )

        # GPT 응답 텍스트 추출
        result = response.choices[0].message.content.strip()
        # JSON 파싱 시도
        try:
            parsed_result = json.loads(result)
            return parsed_result
        except json.JSONDecodeError:
            return {"error": "Invalid JSON format returned by GPT."}
    
    except Exception as e:
        return {"error": f"Error analyzing bias: {e}"}

def add_article_to_db(article_info):
    """
    기사 제목, 날짜, 원문 링크, 점수, 근거를 데이터베이스에 저장.
    """
    if article_info:
        article_info.pop('content', None)  # 본문 삭제
        articles_db.append(article_info)
        print(f"기사 '{article_info['title']}'가 데이터베이스에 추가되었습니다.")
    else:
        print("유효한 기사 정보가 없어 데이터베이스에 추가하지 않았습니다.")

def main():
    # 예시 URL (동아일보 기사)
    example_url = 'https://n.news.naver.com/mnews/article/020/0003604553'

    # 1. 기사 정보 추출
    article_info = extract_article_info(example_url)
    if article_info:
        # 2. GPT로 편향성 분석
        print("\n정치적 편향성 분석 중...")
        bias_analysis = analyze_bias_with_gpt(article_info['content'])
        print("\n정치적 편향성 분석 결과:")
        print(json.dumps(bias_analysis, ensure_ascii=False, indent=4))

        # 3. 점수와 근거를 article_info에 추가 후 저장
        article_info['score'] = bias_analysis.get('score')
        article_info['reason'] = bias_analysis.get('reason')
        add_article_to_db(article_info)

    # 데이터베이스 출력
    print("\n현재 데이터베이스 내용:")
    for article in articles_db:
        print(article)

if __name__ == "__main__":
    main()
