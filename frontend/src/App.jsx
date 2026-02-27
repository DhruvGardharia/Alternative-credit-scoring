import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Role1Dashboard from "./pages/Dashboard";
import CreditAnalysis from "./pages/CreditAnalysis";
import TaxSummary from "./pages/TaxSummary";

// Redirects to /dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

// Redirects to /login if not logged in
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/login" replace />;
};

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — redirect to dashboard if already logged in */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected — redirect to login if not logged in */}
        <Route path="/dashboard" element={<ProtectedRoute><Role1Dashboard /></ProtectedRoute>} />
        <Route path="/credit-analysis" element={<ProtectedRoute><CreditAnalysis /></ProtectedRoute>} />
        <Route path="/tax-summary" element={<ProtectedRoute><TaxSummary /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;