// app/page.tsx
"use client";

import { useState } from "react";
import CardPreview from "../components/CardPreview";

export default function Dashboard() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<any[]>([]);

  // API 서버에 요청 보내기
  const generateCardNews = async () => {
    if (!topic) return alert("주제를 입력해주세요!");
    
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ topic }),
      });
      const result = await response.json();
      
      if (result.success) {
        setCards(result.data.cards); // 이미지 image_7759ee.png의 JSON 구조(cards 배열)를 받음
      }
    } catch (error) {
      console.error("생성 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">AI 카드뉴스 대시보드</h1>

        {/* 1. 입력 섹션 */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="제작할 주제를 입력하세요 (예: 미스터리 런던탑 유령)"
              className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button
              onClick={generateCardNews}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? "생성 중..." : "제작하기"}
            </button>
          </div>
        </div>

        {/* 2. 결과 섹션: 로딩 시 스켈레톤, 완료 시 카드 목록 */}
        {loading ? (
          <div className="flex justify-center py-20 text-gray-400">데이터를 분석하고 기획안을 작성 중입니다...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((card, index) => (
              <CardPreview key={index} data={card} index={index + 1} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}