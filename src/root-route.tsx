import { BrowserRouter, Routes, Route } from "react-router";
import HomePage from "./pages/HomePage";
import ResultPage from "./pages/ResultPage";

export default function RootRoute() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  );
}
