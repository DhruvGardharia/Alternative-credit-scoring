import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import LandingNavbar from "../components/LandingNavbar";

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();

  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
      <LandingNavbar />

      {/* Hero Section */}
      <div className={`text-white ${isDark ? "bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-950" : "bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"}`}>
        <div className="container mx-auto px-6 pt-20 pb-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-4 px-4 py-2 bg-yellow-400 text-blue-900 rounded-full text-sm font-bold">
              {t("heroTag")}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t("heroHeadline1")}<br />
              <span className="text-yellow-400">{t("heroHeadline2")}</span>
            </h1>
            <p className="text-xl text-blue-100 mb-4 max-w-2xl mx-auto leading-relaxed">
              {t("heroSubtitle1")}
            </p>
            <p className="text-lg text-blue-200 mb-10 max-w-2xl mx-auto">
              {t("heroSubtitle2")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate("/register")}
                className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg text-base font-bold hover:bg-yellow-500 hover:shadow-2xl transition transform hover:-translate-y-1"
              >
                {t("heroCta1")}
              </button>
              <button
                onClick={scrollToHowItWorks}
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-lg text-base font-bold hover:bg-white/20 transition"
              >
                {t("heroCta2")}
              </button>
            </div>
            <p className="text-xs text-blue-300 mt-6">{t("heroTrustLine")}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className={`rounded-xl shadow-lg p-6 border-t-4 border-blue-900 hover:shadow-2xl transition transform hover:-translate-y-2 ${isDark ? "bg-gray-900" : "bg-white"}`}>
            <div className={`text-4xl font-bold mb-2 ${isDark ? "text-blue-400" : "text-blue-900"}`}>50M+</div>
            <div className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>{t("stat1Label")}</div>
            <div className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>{t("stat1Sub")}</div>
          </div>
          <div className={`rounded-xl shadow-lg p-6 border-t-4 border-yellow-400 hover:shadow-2xl transition transform hover:-translate-y-2 ${isDark ? "bg-gray-900" : "bg-white"}`}>
            <div className={`text-4xl font-bold mb-2 ${isDark ? "text-blue-400" : "text-blue-900"}`}>₹2L+</div>
            <div className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>{t("stat2Label")}</div>
            <div className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>{t("stat2Sub")}</div>
          </div>
          <div className={`rounded-xl shadow-lg p-6 border-t-4 border-green-500 hover:shadow-2xl transition transform hover:-translate-y-2 ${isDark ? "bg-gray-900" : "bg-white"}`}>
            <div className={`text-4xl font-bold mb-2 ${isDark ? "text-blue-400" : "text-blue-900"}`}>5 Min</div>
            <div className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>{t("stat3Label")}</div>
            <div className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>{t("stat3Sub")}</div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="container mx-auto px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-blue-900"}`}>{t("howItWorksTitle")}</h2>
            <p className={`text-lg max-w-2xl mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t("howItWorksSubtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/4 left-0 right-0 h-1 bg-gradient-to-r from-blue-900 via-yellow-400 to-green-500 opacity-20" style={{ top: '80px' }}></div>

            {/* Step 1 */}
            <div className="relative">
              <div className={`rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:-translate-y-2 border-l-4 border-blue-900 ${isDark ? "bg-gray-900" : "bg-white"}`}>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center mb-4 mx-auto relative z-10">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className={`absolute top-6 right-6 text-5xl font-bold ${isDark ? "text-gray-800" : "text-gray-100"}`}>1</div>
                <h3 className={`text-lg font-bold mb-2 text-center ${isDark ? "text-white" : "text-blue-900"}`}>{t("step1Title")}</h3>
                <p className={`text-sm text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t("step1Desc")}</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className={`rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:-translate-y-2 border-l-4 border-yellow-400 ${isDark ? "bg-gray-900" : "bg-white"}`}>
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mb-4 mx-auto relative z-10">
                  <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className={`absolute top-6 right-6 text-5xl font-bold ${isDark ? "text-gray-800" : "text-gray-100"}`}>2</div>
                <h3 className={`text-lg font-bold mb-2 text-center ${isDark ? "text-white" : "text-blue-900"}`}>{t("step2Title")}</h3>
                <p className={`text-sm text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t("step2Desc")}</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className={`rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:-translate-y-2 border-l-4 border-purple-500 ${isDark ? "bg-gray-900" : "bg-white"}`}>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto relative z-10">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className={`absolute top-6 right-6 text-5xl font-bold ${isDark ? "text-gray-800" : "text-gray-100"}`}>3</div>
                <h3 className={`text-lg font-bold mb-2 text-center ${isDark ? "text-white" : "text-blue-900"}`}>{t("step3Title")}</h3>
                <p className={`text-sm text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t("step3Desc")}</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className={`rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:-translate-y-2 border-l-4 border-green-500 ${isDark ? "bg-gray-900" : "bg-white"}`}>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4 mx-auto relative z-10">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className={`absolute top-6 right-6 text-5xl font-bold ${isDark ? "text-gray-800" : "text-gray-100"}`}>4</div>
                <h3 className={`text-lg font-bold mb-2 text-center ${isDark ? "text-white" : "text-blue-900"}`}>{t("step4Title")}</h3>
                <p className={`text-sm text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t("step4Desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Credibility Section */}
      <div className={`py-20 ${isDark ? "bg-gray-900" : "bg-gradient-to-br from-blue-50 to-indigo-50"}`}>
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-blue-900"}`}>{t("trustTitle")}</h2>
              <p className={`text-lg max-w-2xl mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t("trustSubtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className={`rounded-xl shadow-md p-6 hover:shadow-xl transition ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-blue-900/40" : "bg-blue-100"}`}>
                  <svg className={`w-7 h-7 ${isDark ? "text-blue-400" : "text-blue-900"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-blue-900"}`}>{t("trust1Title")}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t("trust1Desc")}</p>
              </div>

              <div className={`rounded-xl shadow-md p-6 hover:shadow-xl transition ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-green-900/40" : "bg-green-100"}`}>
                  <svg className={`w-7 h-7 ${isDark ? "text-green-400" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-blue-900"}`}>{t("trust2Title")}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t("trust2Desc")}</p>
              </div>

              <div className={`rounded-xl shadow-md p-6 hover:shadow-xl transition ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-yellow-900/40" : "bg-yellow-100"}`}>
                  <svg className={`w-7 h-7 ${isDark ? "text-yellow-400" : "text-yellow-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className={`text-lg font-bold mb-3 ${isDark ? "text-white" : "text-blue-900"}`}>{t("trust3Title")}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t("trust3Desc")}</p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className={`rounded-lg border p-6 max-w-3xl mx-auto ${isDark ? "bg-gray-800 border-blue-800" : "bg-white border-blue-200"}`}>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className={`text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  <strong className={isDark ? "text-blue-400" : "text-blue-900"}>{t("disclaimerLabel")}</strong> {t("disclaimerText")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Future Roadmap Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl p-1">
            <div className={`rounded-xl p-8 ${isDark ? "bg-gray-900" : "bg-white"}`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-blue-900"}`}>{t("roadmapTitle")}</h3>
                  <p className={`mb-4 leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {t("roadmapDesc")}
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{t("roadmapBullet1")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{t("roadmapBullet2")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{t("roadmapBullet3")}</span>
                    </li>
                  </ul>
                  <div className={`rounded-lg p-3 ${isDark ? "bg-blue-950/50 border border-blue-800" : "bg-blue-50 border border-blue-200"}`}>
                    <p className={`text-xs ${isDark ? "text-blue-300" : "text-blue-900"}`}>
                      <strong>{t("roadmapNote")}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-blue-900"}`}>{t("featuresTitle")}</h2>
            <p className={`text-lg max-w-2xl mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t("featuresSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:-translate-y-2 border-t-4 border-blue-900 ${isDark ? "bg-gray-900" : "bg-white"}`}>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-blue-900"}`}>{t("feature1Title")}</h3>
              <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t("feature1Desc")}</p>
            </div>
            <div className={`rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:-translate-y-2 border-t-4 border-yellow-400 ${isDark ? "bg-gray-900" : "bg-white"}`}>
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-blue-900"}`}>{t("feature2Title")}</h3>
              <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t("feature2Desc")}</p>
            </div>
            <div className={`rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:-translate-y-2 border-t-4 border-green-500 ${isDark ? "bg-gray-900" : "bg-white"}`}>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-blue-900"}`}>{t("feature3Title")}</h3>
              <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>{t("feature3Desc")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className={`text-white py-20 ${isDark ? "bg-gradient-to-r from-gray-900 via-blue-950 to-indigo-950" : "bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900"}`}>
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              {t("ctaTitle1")}<br />
              <span className="text-yellow-400">{t("ctaTitle2")}</span>
            </h2>
            <p className="text-xl text-blue-100 mb-4 max-w-2xl mx-auto">
              {t("ctaSubtitle1")}
            </p>
            <p className="text-lg text-blue-200 mb-10 max-w-2xl mx-auto">
              {t("ctaSubtitle2")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button
                onClick={() => navigate("/register")}
                className="bg-yellow-400 text-blue-900 px-10 py-4 rounded-lg text-lg font-bold hover:bg-yellow-500 hover:shadow-2xl transition transform hover:-translate-y-1"
              >
                {t("ctaBtn1")}
              </button>
              <button
                onClick={() => navigate("/login")}
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-10 py-4 rounded-lg text-lg font-bold hover:bg-white/20 transition"
              >
                {t("ctaBtn2")}
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>{t("ctaTrust1")}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>{t("ctaTrust2")}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>{t("ctaTrust3")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`border-t py-8 transition-colors duration-300 ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                </svg>
              </div>
              <span className={`text-lg font-bold ${isDark ? "text-white" : "text-blue-900"}`}>CreditFlow</span>
            </div>
            <div className={`text-sm text-center md:text-right ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              <p>{t("footerCopy")}</p>
              <p className={`text-xs mt-1 ${isDark ? "text-gray-600" : "text-gray-500"}`}>{t("footerDemo")}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
