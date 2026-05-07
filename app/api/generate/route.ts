// app/api/generate/route.ts 수정
import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';

// 환경 변수가 없을 때를 대비한 안전 장치
const apiKey = process.env.CLAUDE_API_KEY;
const notionToken = process.env.NOTION_TOKEN;
const notionDbId = process.env.NOTION_DB_ID;

if (!apiKey || !notionToken || !notionDbId) {
  console.error("환경 변수 중 일부가 누락되었습니다.");
}

const anthropic = new Anthropic({ apiKey }); // 여기서 키를 인식하지 못하면 에러가 납니다.
const notion = new Client({ auth: notionToken });

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();

    const completion = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620", // 최신 모델로 변경!
      max_tokens: 1000,
      system: "카드뉴스 전문 작가 역할. 반드시 JSON 형식으로만 응답할 것.",
      messages: [{ role: "user", content: `${topic} 주제로 카드뉴스 5장 만들어줘.` }],
    });

    // 29번 줄 대체 코드
const contentBlock = completion.content[0];

// 텍스트 블록인지 확인하고 데이터를 안전하게 꺼냅니다.
let responseText = "";
if ("text" in contentBlock) {
  responseText = contentBlock.text;
} else {
  throw new Error("AI가 텍스트 응답을 보내지 않았습니다.");
}

const cardContent = JSON.parse(responseText);

    await notion.pages.create({
      parent: { database_id: notionDbId! },
      properties: {
        title: { title: [{ text: { content: topic } }] },
        Content: { rich_text: [{ text: { content: JSON.stringify(cardContent) } }] }
      }
    });

    return NextResponse.json({ success: true, data: cardContent });

  } catch (error: any) {
    console.error('Runtime Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}