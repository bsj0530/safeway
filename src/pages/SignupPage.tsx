import { useState } from "react";
import { Link, useNavigate } from "react-router";

export default function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("요양보호사");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("필수 정보를 모두 입력해 주세요.");
      return;
    }

    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 임시 회원가입 저장
    localStorage.setItem(
      "safeway-user",
      JSON.stringify({
        name,
        email,
        role,
        isLoggedIn: true,
      }),
    );

    alert("회원가입이 완료되었습니다.");
    navigate("/home");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">회원가입</h1>
          <p className="mt-2 text-sm text-slate-500">
            SafeWay 서비스를 시작해 보세요
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 transition outline-none focus:border-emerald-500"
            />
          </div>

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
              케어 직군
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 transition outline-none focus:border-emerald-500"
            >
              <option value="요양보호사">요양보호사</option>
              <option value="활동보조사">활동보조사</option>
              <option value="사회복지사">사회복지사</option>
              <option value="기타">기타</option>
            </select>
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

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 transition outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            회원가입
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          이미 계정이 있으신가요?{" "}
          <Link to="/" className="font-medium text-emerald-600 hover:underline">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
