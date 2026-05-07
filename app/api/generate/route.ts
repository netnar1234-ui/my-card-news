import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';

const apiKey = process.env.CLAUDE_API_KEY;
const notionToken = process.env.NOTION_TOKEN;
const notionDbId = process.env.NOTION_DB_ID;

const anthropic = new Anthropic({ apiKey: apiKey! });
const notion = new Client({ auth: notionToken! });

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();

    const completion = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1500,
      system: "당신은 카드뉴스 작가입니다. 반드시 JSON 형식으로 응답하세요. { \"cards\": [] } 구조를 사용하세요.",
      messages: [{ role: "user", content: `${topic} 주제로 카드뉴스 5장 만들어줘.` }],
    });

    // 핵심 수정 부분: 'as any'를 사용하여 타입 검사를 강제로 통과시킵니다.
    const responseBlock = completion.content[0] as any;
    const responseText = responseBlock.text; 

    if (!responseText) {
      throw new Error("AI 응답에서 텍스트를 찾을 수 없습니다.");
    }

    const cardContent = JSON.parse(responseText);

    await notion.pages.create({
      parent: { database_id: notionDbId! },
      properties: {
        title: { title: [{ text: { content: topic } }] },
        Content: { rich_text: [{ text: { content: responseText } }] }
      }
    });

    return NextResponse.json({ success: true, data: cardContent });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}