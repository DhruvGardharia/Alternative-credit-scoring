import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const languages = [
    { code: "en", label: "English", native: "EN" },
    { code: "hi", label: "हिंदी", native: "HI" },
    { code: "mr", label: "मराठी", native: "MR" },
  ];

  const currentLang = languages.find((l) => l.code === language);

  // Get initials for avatar
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <nav className="bg-blue-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">

        {/* Logo Section */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
          <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">CreditFlow</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          <span className="text-white text-sm hidden sm:block">
            {t("welcome")}, {user?.name}
          </span>

          {/* Nav Links */}
          <button
            onClick={() => navigate("/dashboard")}
            className="px-3 py-1.5 text-sm text-gray-200 hover:text-yellow-400 hover:bg-blue-800 rounded-lg transition font-medium"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/emergency-loan")}
            className="px-3 py-1.5 text-sm text-gray-200 hover:text-yellow-400 hover:bg-blue-800 rounded-lg transition font-medium"
          >
            Emergency Loan
          </button>
          <button
            onClick={() => navigate("/insurance")}
            className="px-3 py-1.5 text-sm text-gray-200 hover:text-yellow-400 hover:bg-blue-800 rounded-lg transition font-medium"
          >
            Micro Insurance
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-yellow-400 hover:bg-blue-800 transition text-sm font-semibold"
              aria-label="Select language"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389 21.034 21.034 0 01-.554-.6 19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-3.54 1 1 0 111.94-.484c.303.968.72 1.9 1.239 2.777a17.502 17.502 0 001.303-3.492H3a1 1 0 110-2h3V3a1 1 0 011-1zm8 8a1 1 0 01.707.293l4 4a1 1 0 01-1.414 1.414L17 14.414V17a1 1 0 11-2 0v-2.586l-1.293 1.293a1 1 0 01-1.414-1.414l4-4A1 1 0 0115 10z" clipRule="evenodd" />
              </svg>
              <span>{currentLang?.native}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${showLangDropdown ? "rotate-180" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {showLangDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowLangDropdown(false)}
                />
                <div className="absolute right-0 mt-1 w-36 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition hover:bg-blue-50 dark:hover:bg-gray-700 ${language === lang.code
                        ? "bg-blue-50 dark:bg-gray-700 text-blue-900 dark:text-yellow-400 font-semibold"
                        : "text-gray-700 dark:text-gray-300"
                        }`}
                    >
                      <span>{lang.label}</span>
                      {language === lang.code && (
                        <svg className="w-4 h-4 text-blue-900 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? t("switchToLight") : t("switchToDark")}
            className="p-2 rounded-lg text-yellow-400 hover:bg-blue-800 transition"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* User Avatar with Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setShowUserDropdown((prev) => !prev)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-yellow-400 transition focus:outline-none"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-blue-900 font-bold text-sm select-none">
                {initials}
              </div>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 z-30 overflow-hidden">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>

                {/* My Account */}
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    alert(`${t("account")}: ${user?.name || "User"}\n${t("email")}: ${user?.email || "N/A"}\n${t("role")}: ${user?.role || "Gig Worker"}`);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition"
                >
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {t("myAccount")}
                </button>

                {/* Logout */}
                <button
                  onClick={() => { setShowUserDropdown(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition border-t border-gray-100 dark:border-gray-700"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  {t("logout")}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
