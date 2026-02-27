import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PLATFORM_CONFIG } from "../config/platformConfig";
import { LoadingAnimation } from "../components/Loading";
import axios from "axios";
import { toast } from "react-toastify";

export default function Onboarding() {
  const [step, setStep] = useState("choice"); // choice, upload, platform
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [workType, setWorkType] = useState("FULL_TIME");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const platforms = PLATFORM_CONFIG[user.employmentType] || [];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        setFile(null);
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUploadStatement = async () => {
    if (!file) {
      toast.error("Please select a PDF file");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("statement", file);
    formData.append("userId", user.id);

    try {
      const { data } = await axios.post("/api/statement/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) {
        toast.success("Bank statement uploaded successfully!");
        localStorage.setItem("onboarded", "true");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPlatform = async () => {
    if (!selectedPlatform) {
      toast.error("Please select a platform");
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post("/api/platform/connect", {
        userId: user.id,
        platform: selectedPlatform,
        workType,
      });

      if (data.success) {
        toast.success(`Successfully connected to ${selectedPlatform}!`);
        localStorage.setItem("onboarded", "true");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  if (step === "choice") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user.name}!</h1>
            <p className="text-gray-600">Let's get started with your credit profile</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Bank Statement */}
            <button
              onClick={() => setStep("upload")}
              className="group p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-500 transition">
                  <svg className="w-8 h-8 text-purple-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Upload Bank Statement</h3>
                  <p className="text-sm text-gray-600">
                    Upload your PDF bank statement for instant credit analysis
                  </p>
                </div>
              </div>
            </button>

            {/* Connect Platform */}
            <button
              onClick={() => setStep("platform")}
              className="group p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-500 transition">
                  <svg className="w-8 h-8 text-indigo-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Connect Platform</h3>
                  <p className="text-sm text-gray-600">
                    Link your gig platform account for automatic tracking
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "upload") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <button
            onClick={() => setStep("choice")}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Bank Statement</h2>
            <p className="text-gray-600">PDF format only, max 5MB</p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition mb-6">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
              id="fileUpload"
            />
            <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center">
              <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {file ? file.name : "Click to upload PDF"}
              </span>
              <span className="text-xs text-gray-500 mt-1">Max file size: 5MB</span>
            </label>
          </div>

          <button
            onClick={handleUploadStatement}
            disabled={loading || !file}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <LoadingAnimation /> : "Upload & Continue"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "platform") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <button
            onClick={() => setStep("choice")}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Platform</h2>
            <p className="text-gray-600">Select your primary gig platform</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {platforms.map((platform) => (
              <button
                key={platform.value}
                onClick={() => setSelectedPlatform(platform.value)}
                className={`p-4 border-2 rounded-lg transition transform hover:scale-105 ${
                  selectedPlatform === platform.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-indigo-300"
                }`}
              >
                <div className="text-3xl mb-2">{platform.icon}</div>
                <div className="text-sm font-semibold text-gray-900">{platform.label}</div>
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Work Type</label>
            <div className="flex gap-4">
              <button
                onClick={() => setWorkType("FULL_TIME")}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
                  workType === "FULL_TIME"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-700 hover:border-indigo-300"
                }`}
              >
                Full Time
              </button>
              <button
                onClick={() => setWorkType("PART_TIME")}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
                  workType === "PART_TIME"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-700 hover:border-indigo-300"
                }`}
              >
                Part Time
              </button>
            </div>
          </div>

          <button
            onClick={handleConnectPlatform}
            disabled={loading || !selectedPlatform}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <LoadingAnimation /> : "Connect & Continue"}
          </button>
        </div>
      </div>
    );
  }
}
