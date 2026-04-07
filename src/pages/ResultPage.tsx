import { useNavigate } from "react-router";
import RouteCard from "../components/route/routeCard";
import { mockRoutes } from "../data/mockRoutes";

export default function ResultPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <div className="flex items-center justify-between border-b bg-white p-4">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-slate-600"
        >
          ← 뒤로
        </button>
        <h1 className="text-lg font-bold text-slate-800">경로 결과</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex h-72 items-center justify-center bg-slate-200 text-slate-500">
          지도 영역
        </div>

        <div className="space-y-3 p-4">
          {mockRoutes.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
      </div>
    </div>
  );
}
