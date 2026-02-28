import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function LandingNavbar() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const languages = [
    { code: "en", label: "English", native: "EN" },
    { code: "hi", label: "हिंदी", native: "HI" },
    { code: "mr", label: "मराठी", native: "MR" },
  ];

  const currentLang = languages.find((l) => l.code === language);

  return (
    <nav className={`shadow-md sticky top-0 z-50 transition-colors duration-300 ${isDark ? "bg-gray-900 border-b border-gray-800" : "bg-white"}`}>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <div
          className="flex items-center space-x-2 cursor-pointer relative z-10"
          onClick={() => {
            navigate("/");
            setIsMobileMenuOpen(false);
          }}
        >
          <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
            </svg>
          </div>
          <span className={`text-xl font-bold ${isDark ? "text-white" : "text-blue-900"}`}>
            CreditFlow
          </span>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex items-center md:hidden relative z-10">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-lg transition ${isDark ? "text-gray-300 hover:bg-gray-800 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
            )}
          </button>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition text-sm font-semibold ${isDark ? "text-yellow-400 hover:bg-gray-800" : "text-blue-900 hover:bg-gray-100"}`}
              aria-label="Select language"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389 21.034 21.034 0 01-.554-.6 19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-3.54 1 1 0 111.94-.484c.303.968.72 1.9 1.239 2.777a17.502 17.502 0 001.303-3.492H3a1 1 0 110-2h3V3a1 1 0 011-1zm8 8a1 1 0 01.707.293l4 4a1 1 0 01-1.414 1.414L17 14.414V17a1 1 0 11-2 0v-2.586l-1.293 1.293a1 1 0 01-1.414-1.414l4-4A1 1 0 0115 10z" clipRule="evenodd"/>
              </svg>
              <span>{currentLang?.native}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${showLangDropdown ? "rotate-180" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>

            {showLangDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowLangDropdown(false)}
                />
                <div className={`absolute right-0 mt-1 w-36 rounded-lg shadow-lg border z-20 overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition ${
                        language === lang.code
                          ? isDark
                            ? "bg-gray-700 text-yellow-400 font-semibold"
                            : "bg-blue-50 text-blue-900 font-semibold"
                          : isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>{lang.label}</span>
                      {language === lang.code && (
                        <svg className={`w-4 h-4 ${isDark ? "text-yellow-400" : "text-blue-900"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? t("switchToLight") : t("switchToDark")}
            className={`p-2 rounded-lg transition ${isDark ? "text-yellow-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100"}`}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
              </svg>
            )}
          </button>

          <button
            onClick={() => navigate("/lender-login")}
            className={`transition px-4 py-2 text-sm font-medium ${isDark ? "text-yellow-400 hover:text-yellow-300" : "text-indigo-700 hover:text-indigo-900"}`}
          >
            Lender Login
          </button>
          <button
            onClick={() => navigate("/login")}
            className={`transition px-4 py-2 text-sm font-medium ${isDark ? "text-gray-300 hover:text-white" : "text-blue-900 hover:text-blue-700"}`}
          >
            {t("login")}
          </button>
          <button
            onClick={() => navigate("/register")}
            className="bg-blue-900 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-800 transition shadow-md text-sm"
          >
            {t("getStarted")}
          </button>
        </div>
      </div>

      {/* Mobile Menu Content List */}
      <div 
        className={`md:hidden absolute w-full left-0 border-t transition-all duration-300 ease-in-out origin-top ${isMobileMenuOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 h-0 overflow-hidden"} ${isDark ? "bg-gray-900 border-gray-800 shadow-xl" : "bg-white border-gray-200 shadow-lg"}`}
      >
        <div className="flex flex-col px-6 py-6 space-y-4">
          
          {/* Mobile Top Row: Theme & Lang Toggle */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setShowLangDropdown((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition text-sm font-semibold relative ${isDark ? "text-yellow-400 hover:bg-gray-800" : "text-blue-900 hover:bg-gray-100"}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389 21.034 21.034 0 01-.554-.6 19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-3.54 1 1 0 111.94-.484c.303.968.72 1.9 1.239 2.777a17.502 17.502 0 001.303-3.492H3a1 1 0 110-2h3V3a1 1 0 011-1zm8 8a1 1 0 01.707.293l4 4a1 1 0 01-1.414 1.414L17 14.414V17a1 1 0 11-2 0v-2.586l-1.293 1.293a1 1 0 01-1.414-1.414l4-4A1 1 0 0115 10z" clipRule="evenodd"/>
              </svg>
              <span>{currentLang?.native}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${showLangDropdown ? "rotate-180" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>

              {/* Mobile Inline Lang List */}
              {showLangDropdown && (
                <div className={`absolute top-full left-0 mt-2 w-32 rounded-lg shadow-lg border z-20 overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  {languages.map((lang) => (
                    <div
                      key={lang.code}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeLanguage(lang.code);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm transition ${
                        language === lang.code
                          ? isDark
                            ? "bg-gray-700 text-yellow-400 font-semibold"
                            : "bg-blue-50 text-blue-900 font-semibold"
                          : isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {lang.label}
                    </div>
                  ))}
                </div>
              )}
            </button>

            <button
              onClick={toggleTheme}
              aria-label={isDark ? t("switchToLight") : t("switchToDark")}
              className={`p-2 rounded-lg transition flex items-center gap-2 ${isDark ? "text-yellow-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100"}`}
            >
              {isDark ? (
                <>
                  <span className="text-sm font-medium">Light</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
                  </svg>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium">Dark</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                  </svg>
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              navigate("/lender-login");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${isDark ? "text-yellow-400 hover:bg-gray-800" : "text-indigo-700 hover:bg-gray-100"}`}
          >
            Lender Login
          </button>
          
          <button
            onClick={() => {
              navigate("/login");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${isDark ? "text-gray-200 hover:bg-gray-800" : "text-blue-900 hover:bg-gray-100"}`}
          >
            {t("login")}
          </button>
          
          <button
            onClick={() => {
              navigate("/register");
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-center bg-blue-900 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-800 transition shadow-md"
          >
            {t("getStarted")}
          </button>
        </div>
      </div>
    </nav>
  );
}
