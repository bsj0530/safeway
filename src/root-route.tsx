import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NavigationPage from "./pages/NavigationPage";
import ResultPage from "./pages/ResultPage";
import SignupPage from "./pages/SignupPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const savedUser = localStorage.getItem("safeway-user");

  if (!savedUser) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(savedUser);
    if (!user?.isLoggedIn) {
      return <Navigate to="/" replace />;
    }
  } catch {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function RootRoute() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/result"
          element={
            <ProtectedRoute>
              <ResultPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/navigate"
          element={
            <ProtectedRoute>
              <NavigationPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
