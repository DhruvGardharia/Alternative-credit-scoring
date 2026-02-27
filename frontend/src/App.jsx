import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingNew from "./pages/OnboardingNew";
import Role1Dashboard from "./pages/Dashboard";
import CreditAnalysis from "./pages/CreditAnalysis";
import TaxSummary from "./pages/TaxSummary";
import ExpenseTracker from "./pages/ExpenseTracker";
import PlatformManagement from "./pages/PlatformManagement";
import CreditPolicyBot from "./components/CreditPolicyBot";


// Protected Route Component - Requires Authentication
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Dashboard Protected Route - Requires Authentication Only
// Renders CreditPolicyBot on every authenticated page
const DashboardRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  return (
    <>
      {children}
      <CreditPolicyBot />
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Dashboard Routes */}
        
        {/* Dashboard Routes - Require authentication */}
        <Route
          path="/dashboard"
          element={
            <DashboardRoute>
              <Role1Dashboard />
            </DashboardRoute>
          }
        />
        <Route
          path="/platforms"
          element={
            <DashboardRoute>
              <PlatformManagement />
            </DashboardRoute>
          }
        />
        <Route
          path="/credit-analysis"
          element={
            <DashboardRoute>
              <CreditAnalysis />
            </DashboardRoute>
          }
        />
        <Route
          path="/tax-summary"
          element={
            <DashboardRoute>
              <TaxSummary />
            </DashboardRoute>
          }
        />
        <Route
          path="/expense-tracker"
          element={
            <DashboardRoute>
              <ExpenseTracker />
            </DashboardRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
