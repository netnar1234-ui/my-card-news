import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';

// 1. API 키 및 설정값 로드
const apiKey = process.env.CLAUDE_API_KEY;
const notionToken = process.env.NOTION_TOKEN;
const notionDbId = process.env.NOTION_DB_ID;

// 클라이언트 초기화 (비어있을 경우를 대비해 ! 사용)
const anthropic = new Anthropic({ apiKey: apiKey! });
const notion = new Client({ auth: notionToken! });

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();

    // 2. Claude 3.5 Sonnet 모델로 카드뉴스 생성 요청
    const completion = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1500,
      system: `당신은 인스타그램 카드뉴스 기획 전문가입니다. 긴 글을 5~7장의 가독성 높은 카드뉴스 형태로 요약하여, 후킹(Hooking)되는 카피를 작성해주세요.
      반드시 JSON 형식으로만 응답하며, 구조는 다음과 같습니다:
      {
        "cards": [
          { "title": "카드제목", "body": "본문내용", "emoji": "이모지", "color": "헥사코드" }
        ]
      }
      한글로 작성하고 5장의 카드를 만들어주세요.`,
      messages: [{ role: "user", content: `${topic} 주제로 카드뉴스를 작성해줘.` }],
    });

    // 3. [에러 해결 포인트] 타입 안전하게 텍스트 추출
    const firstBlock = completion.content[0];
    let responseText = "";

    // 블록이 'text' 타입인지 확인하여 TypeScript 빌드 에러 방지
    if (firstBlock.type === 'text') {
      responseText = firstBlock.text;
    } else {
      throw new Error("AI가 텍스트 응답을 보내지 않았습니다.");
    }

    // JSON 파싱
    const cardContent = JSON.parse(responseText);

    // 4. 노션 데이터베이스에 결과 기록
    await notion.pages.create({
      parent: { database_id: notionDbId! },
      properties: {
        title: {
          title: [{ text: { content: topic } }]
        },
        Content: {
          rich_text: [{ text: { content: responseText } }]
        }
      }
    });

    // 5. 프론트엔드로 데이터 반환
    return NextResponse.json({ success: true, data: cardContent });

  } catch (error: any) {
    console.error('Runtime Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || "알 수 없는 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}