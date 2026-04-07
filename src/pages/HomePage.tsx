import { useNavigate } from "react-router";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800">SafeWay</h1>
        <p className="mt-2 text-sm text-slate-500">
          빠른 길보다 안전한 길을 안내합니다
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <input
          className="w-full rounded-xl border border-slate-200 bg-white p-3"
          placeholder="출발지 입력"
        />
        <input
          className="w-full rounded-xl border border-slate-200 bg-white p-3"
          placeholder="도착지 입력"
        />
      </div>

      <button
        onClick={() => navigate("/result")}
        className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white"
      >
        안전 경로 찾기
      </button>
    </div>
  );
}
