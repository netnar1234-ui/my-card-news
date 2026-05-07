// components/CardPreview.tsx
export default function CardPreview({ data, index }: { data: any; index: number }) {
  return (
    <div 
      className="aspect-square p-8 rounded-2xl shadow-lg flex flex-col justify-between text-white transition-transform hover:scale-[1.02]"
      style={{ backgroundColor: data.color || "#1a1a1a" }} // JSON에서 받은 컬러 적용
    >
      <div>
        <span className="text-sm font-bold opacity-70">PAGE {index}</span>
        <h2 className="text-2xl font-extrabold mt-4 leading-tight">
          {data.title}
        </h2>
      </div>

      <div className="flex-1 flex items-center justify-center text-6xl">
        {data.emoji}
      </div>

      <p className="text-lg font-medium opacity-90 break-keep">
        {data.body}
      </p>
    </div>
  );
}