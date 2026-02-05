import { BrowserRouter, Routes, Route } from "react-router-dom";
import Onboarding from "./pages/Onboarding";
import UploadStatement from "./pages/UploadStatement";
import Dashboard from "./pages/Dashboard";
import CreditResult from "./pages/CreditResult";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/upload/:userId" element={<UploadStatement />} />
        <Route path="/dashboard/:userId" element={<Dashboard />} />
        <Route path="/credit-result/:userId" element={<CreditResult />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;