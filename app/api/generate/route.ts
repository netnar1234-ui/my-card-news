// app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
const notion = new Client({ auth: process.env.NOTION_TOKEN });

// 이 부분이 export되어야 Next.js가 '모듈'로 인식합니다.
export async function POST(request: Request) {
  try {
    const { topic } = await request.json();

    // 1. Claude API 호출
    const completion = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      system: "카드뉴스 전문 작가 역할. 반드시 JSON 형식으로만 응답할 것. 핵심 내용만 간추려 텍스트를 카드별로 분할. 2.디자인 스타일 사이즈: 1080 x 1350px (인스타 4:5 비율).톤앤매너: [예: 깔끔한 베이지 배경 + 오렌지 포인트 톤, 미니멀리즘].폰트: 가독성이 좋은 고딕 계열. 3.구성 카드 1: 후킹 제목, 썸네일용.카드 2~6: 본문 내용 (구조도, 코드 블록 등 시각화 요소 포함). 마지막 카드: 행동 유도(CTA - 좋아요, 저장, 팔로우). 4.출력 HTML과 CSS로 구현하여 바로 렌더링 가능한 코드로 제공해 주세요. 구조: { \"cards\": [{ \"title\": \"...\", \"body\": \"...\", \"emoji\": \"...\", \"color\": \"...\" }] }",
      messages: [{ role: "user", content: `${topic} 주제로 카드뉴스 5장 만들어줘.` }],
    });

    const completionText = (completion as any).content?.find((block: any) => block?.type === "output_text")?.text ?? (completion as any).content?.[0]?.text ?? "";
    const cardContent = JSON.parse(completionText);

    // 2. 노션 기록 (데이터베이스 ID 확인 필수)
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DB_ID! },
      properties: {
        title: { title: [{ text: { content: topic } }] },
        Content: { rich_text: [{ text: { content: JSON.stringify(cardContent) } }] }
      }
    });

    return NextResponse.json({ success: true, data: cardContent });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}