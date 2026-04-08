import { useState } from "react";
import { Link, useNavigate } from "react-router";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    // 임시 로그인 처리
    localStorage.setItem(
      "safeway-user",
      JSON.stringify({
        email,
        isLoggedIn: true,
      }),
    );

    navigate("/home");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">SafeWay</h1>
          <p className="mt-2 text-sm text-slate-500">
            케어 종사자를 위한 안전 경로 안내 서비스
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 transition outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 transition outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            로그인
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          계정이 없으신가요?{" "}
          <Link
            to="/signup"
            className="font-medium text-emerald-600 hover:underline"
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
