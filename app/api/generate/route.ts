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
      system: "카드뉴스 작가. JSON으로만 응답할 것.",
      messages: [{ role: "user", content: `${topic} 주제로 카드뉴스 5장 만들어줘.` }],
    });

    // 핵심: 'as any'를 붙여서 TypeScript의 잔소리를 강제로 끕니다.
    const firstBlock = completion.content[0] as any;
    const responseText = firstBlock.text;

    if (!responseText) throw new Error("텍스트를 찾을 수 없습니다.");

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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}