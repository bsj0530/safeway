import { BrowserRouter, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";
import NavigationPage from "./pages/NavigationPage";
import ResultPage from "./pages/ResultPage";

export default function RootRoute() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/navigate" element={<NavigationPage />} />
      </Routes>
    </BrowserRouter>
  );
}
