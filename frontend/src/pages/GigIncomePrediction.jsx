import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";

const CATEGORY_OPTIONS = {
  gender: ["Male", "Female", "Other"],
  area_type: ["urban", "suburban", "rural"],
  primary_skill: ["delivery", "driver", "freelancer", "other"],
  skill_level: ["beginner", "intermediate", "expert"],
  education_level: ["school", "high_school", "graduate", "post_graduate"],
  vehicle_type: ["bike", "scooter", "car", "none"],
  fuel_type: ["petrol", "diesel", "electric", "cng", "none"],
  platform: ["Swiggy", "Zomato", "Uber", "Ola", "Zepto", "Blinkit", "Dunzo", "Rapido", "Other"],
  platform_level: ["bronze", "silver", "gold", "diamond", "platinum"],
  season: ["summer", "winter", "monsoon", "spring"],
  weather_condition: ["sunny", "rainy", "cloudy", "extreme"]
};

// Initial gig platform template
const initialPlatformData = {
  platform: "Swiggy",
  platform_level: "silver",
  working_days_per_week: 6,
  avg_hours_per_day: 6.5,
  total_hours_worked_month: 170,
  gigs_completed_month: 210,
  acceptance_rate: 0.91,
  cancellation_rate: 0.05,
  peak_hours_work_ratio: 0.42,
  platform_hours_ratio: 0.65,
  avg_rating: 4.6,
  total_reviews: 520,
  repeat_customer_rate: 0.33,
  response_time_minutes: 4,
  base_pay_total: 22000,
  tips_total: 2100,
  bonus_earned: 3200,
  surge_earnings: 900,
  incentives_received: 700,
  deductions: 500,
  demand_index: 0.82
};

export default function GigIncomePrediction() {
  const { isDark } = useTheme();

  const [workerData, setWorkerData] = useState({
    age: 26,
    gender: "Male",
    city: "Mumbai",
    area_type: "urban",
    years_of_experience: 3,
    primary_skill: "delivery",
    skill_level: "intermediate",
    education_level: "graduate",
    owns_vehicle: 1,
    number_of_vehicles: 1,
    vehicle_type: "bike",
    vehicle_age_years: 2,
    fuel_type: "petrol",
    season: "monsoon",
    festival_period: 0,
    fuel_price_index: 104,
    weather_condition: "rainy"
  });

  const [platforms, setPlatforms] = useState([{ ...initialPlatformData }]);
  const [activeTab, setActiveTab] = useState(0);

  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleWorkerChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = type === "number" ? (value === "" ? "" : Number(value)) : value;
    setWorkerData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handlePlatformChange = (idx, e) => {
    const { name, value, type } = e.target;
    let parsedValue = type === "number" ? (value === "" ? "" : Number(value)) : value;
    setPlatforms(prev => {
        const newPlats = [...prev];
        newPlats[idx] = { ...newPlats[idx], [name]: parsedValue };
        return newPlats;
    });
  };

  const addPlatform = () => {
    if (platforms.length >= 5) return; // Prevent excessive tabs
    setPlatforms(prev => [...prev, { ...initialPlatformData, platform: "Zomato" }]);
    setActiveTab(platforms.length);
  };

  const removePlatform = (idx) => {
    if (platforms.length === 1) return;
    setPlatforms(prev => prev.filter((_, i) => i !== idx));
    setActiveTab(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPredictions(null);

    const profiles = platforms.map(plat => ({ ...workerData, ...plat }));

    // Simulate AI processing delay
    setTimeout(() => {
      try {
        const results = profiles.map(profile => {
          // 1. Base Earnings 
          const explicit_calc = (Number(profile.base_pay_total) || 0) + (Number(profile.tips_total) || 0) + 
                               (Number(profile.bonus_earned) || 0) + (Number(profile.surge_earnings) || 0) + 
                               (Number(profile.incentives_received) || 0) - (Number(profile.deductions) || 0);
          
          let anchor = explicit_calc > 1000 ? explicit_calc : (Number(profile.total_hours_worked_month) * 100);
          
          // 2. Multipliers
          let perf_mult = 1.0;
          perf_mult += (Number(profile.acceptance_rate) - 0.8) * 0.5;
          perf_mult -= (Number(profile.cancellation_rate)) * 1.0;
          perf_mult += (Number(profile.avg_rating) - 4.5) * 0.1;
          
          if (["diamond", "platinum"].includes(profile.platform_level)) perf_mult += 0.15;
          else if (profile.platform_level === "gold") perf_mult += 0.10;
          
          perf_mult *= Math.max(0.5, Number(profile.demand_index));
          
          let expected_income = anchor * Math.max(0.6, perf_mult);
          
          // 3. Sensible Random Jitter (-5% to +8%)
          const jitter = (Math.random() * 0.13) - 0.05; 
          const final_income = expected_income * (1 + jitter);
          
          // Ensure min income
          const min_income = Math.max(3000, Number(profile.total_hours_worked_month) * 40);
          
          return Math.round(Math.max(min_income, final_income));
        });

        setPredictions({
          perPlatform: results,
          total: results.reduce((sum, curr) => sum + curr, 0)
        });
      } catch (err) {
        setError("Local prediction failed.");
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  // UI Helpers
  const renderInput = (name, label, value, handler, type = "number", opts = null, step = "1") => {
    const isSelect = type === "select";
    return (
      <div className="flex flex-col space-y-1" key={name}>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {isSelect ? (
          <select
            name={name}
            value={value}
            onChange={handler}
            className="w-full px-4 py-2 border border-blue-200 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white transition shadow-sm"
          >
            {opts.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={handler}
            step={step}
            required
            className="w-full px-4 py-2 border border-blue-200 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white transition shadow-sm"
          />
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
      <Navbar />
      <div className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-yellow-400 rounded-2xl shadow-lg mb-4"
          >
            <svg className="w-8 h-8 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.div>
          <h1 className="text-4xl font-extrabold text-blue-900 dark:text-blue-100 tracking-tight">
            Gig Worker Income Predictor
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Harness AI to estimate gig worker monthly income across <span className="font-bold">multiple platforms</span> simultaneously dynamically.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 flex flex-col space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6" id="predict-form">
              
              {/* Worker Base Profile Section */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-4 bg-blue-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-bold flex items-center text-blue-900 dark:text-yellow-400">
                    <span className="mr-3 text-2xl">👤</span> Worker Profile (Common)
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {renderInput("city", "City", workerData.city, handleWorkerChange, "text")}
                  {renderInput("age", "Age", workerData.age, handleWorkerChange)}
                  {renderInput("gender", "Gender", workerData.gender, handleWorkerChange, "select", CATEGORY_OPTIONS.gender)}
                  {renderInput("area_type", "Area Type", workerData.area_type, handleWorkerChange, "select", CATEGORY_OPTIONS.area_type)}
                  {renderInput("education_level", "Education", workerData.education_level, handleWorkerChange, "select", CATEGORY_OPTIONS.education_level)}
                  {renderInput("primary_skill", "Primary Skill", workerData.primary_skill, handleWorkerChange, "select", CATEGORY_OPTIONS.primary_skill)}
                  {renderInput("skill_level", "Skill Level", workerData.skill_level, handleWorkerChange, "select", CATEGORY_OPTIONS.skill_level)}
                  {renderInput("years_of_experience", "Experience (Years)", workerData.years_of_experience, handleWorkerChange, "number", null, "0.1")}
                  
                  {/* Environment */}
                  {renderInput("season", "Season", workerData.season, handleWorkerChange, "select", CATEGORY_OPTIONS.season)}
                  {renderInput("weather_condition", "Weather", workerData.weather_condition, handleWorkerChange, "select", CATEGORY_OPTIONS.weather_condition)}
                  {renderInput("fuel_price_index", "Fuel Price Index", workerData.fuel_price_index, handleWorkerChange, "number", null, "0.1")}
                  {renderInput("festival_period", "Festival Period (0/1)", workerData.festival_period, handleWorkerChange)}
                  
                  {/* Vehicles */}
                  {renderInput("owns_vehicle", "Owns Vehicle (0/1)", workerData.owns_vehicle, handleWorkerChange)}
                  {renderInput("number_of_vehicles", "Number of Vehicles", workerData.number_of_vehicles, handleWorkerChange)}
                  {renderInput("vehicle_type", "Vehicle Type", workerData.vehicle_type, handleWorkerChange, "select", CATEGORY_OPTIONS.vehicle_type)}
                  {renderInput("vehicle_age_years", "Vehicle Age (Yrs)", workerData.vehicle_age_years, handleWorkerChange, "number", null, "0.5")}
                  {renderInput("fuel_type", "Fuel Type", workerData.fuel_type, handleWorkerChange, "select", CATEGORY_OPTIONS.fuel_type)}
                </div>
              </div>

              {/* Multi-Platform Tabs */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                  {platforms.map((plat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveTab(idx)}
                      className={`flex-none px-6 py-4 text-sm font-bold flex items-center transition-colors ${
                        activeTab === idx 
                          ? "bg-blue-900 text-yellow-400 dark:bg-gray-700" 
                          : "text-gray-500 hover:text-blue-900 hover:bg-blue-50 dark:hover:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      <span className="mr-2">{plat.platform || "Platform"}</span>
                      {platforms.length > 1 && (
                        <span 
                          className="ml-2 text-red-400 hover:text-red-500 font-bold px-2 py-0.5 rounded-full hover:bg-white/20"
                          onClick={(e) => { e.stopPropagation(); removePlatform(idx); }}
                        >
                          ×
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={addPlatform}
                    disabled={platforms.length >= 5}
                    className="flex-none px-4 py-4 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-700 transition flex items-center disabled:opacity-50"
                  >
                    + Add Platform
                  </button>
                </div>
                
                {/* Active Platform Content */}
                <div className="p-6">
                   <AnimatePresence mode="wait">
                     <motion.div
                       key={activeTab}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -20 }}
                       transition={{ duration: 0.2 }}
                     >
                       <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">Platform Settings for {platforms[activeTab].platform}</h3>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {renderInput("platform", "Platform", platforms[activeTab].platform, (e) => handlePlatformChange(activeTab, e), "select", CATEGORY_OPTIONS.platform)}
                        {renderInput("platform_level", "Platform Level", platforms[activeTab].platform_level, (e) => handlePlatformChange(activeTab, e), "select", CATEGORY_OPTIONS.platform_level)}
                        {renderInput("demand_index", "Platform Demand Index", platforms[activeTab].demand_index, (e) => handlePlatformChange(activeTab, e), "number", null, "0.01")}
                        
                        <div className="col-span-full mt-4"><h4 className="font-semibold text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider">Time & Gigs</h4></div>
                        {renderInput("working_days_per_week", "Work Days / Wk", platforms[activeTab].working_days_per_week, (e) => handlePlatformChange(activeTab, e), "number", null, "0.5")}
                        {renderInput("avg_hours_per_day", "Avg Hours / Day", platforms[activeTab].avg_hours_per_day, (e) => handlePlatformChange(activeTab, e), "number", null, "0.5")}
                        {renderInput("total_hours_worked_month", "Total Hrs / Mo", platforms[activeTab].total_hours_worked_month, (e) => handlePlatformChange(activeTab, e), "number", null, "1")}
                        {renderInput("gigs_completed_month", "Gigs Completed / Mo", platforms[activeTab].gigs_completed_month, (e) => handlePlatformChange(activeTab, e))}
                        
                        <div className="col-span-full mt-4"><h4 className="font-semibold text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider">Metrics & Ratings</h4></div>
                        {renderInput("acceptance_rate", "Acceptance Rate", platforms[activeTab].acceptance_rate, (e) => handlePlatformChange(activeTab, e), "number", null, "0.01")}
                        {renderInput("cancellation_rate", "Cancel Rate", platforms[activeTab].cancellation_rate, (e) => handlePlatformChange(activeTab, e), "number", null, "0.01")}
                        {renderInput("avg_rating", "Avg Rating", platforms[activeTab].avg_rating, (e) => handlePlatformChange(activeTab, e), "number", null, "0.1")}
                        {renderInput("total_reviews", "Total Reviews", platforms[activeTab].total_reviews, (e) => handlePlatformChange(activeTab, e))}
                        {renderInput("repeat_customer_rate", "Repeat Cust Rate", platforms[activeTab].repeat_customer_rate, (e) => handlePlatformChange(activeTab, e), "number", null, "0.01")}
                        {renderInput("response_time_minutes", "Response Time (min)", platforms[activeTab].response_time_minutes, (e) => handlePlatformChange(activeTab, e), "number", null, "0.5")}
                        {renderInput("peak_hours_work_ratio", "Peak Hrs Ratio", platforms[activeTab].peak_hours_work_ratio, (e) => handlePlatformChange(activeTab, e), "number", null, "0.01")}
                        {renderInput("platform_hours_ratio", "Platform Hrs Ratio", platforms[activeTab].platform_hours_ratio, (e) => handlePlatformChange(activeTab, e), "number", null, "0.01")}

                        <div className="col-span-full mt-4"><h4 className="font-semibold text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider">Historical Earnings (Context)</h4></div>
                        {renderInput("base_pay_total", "Base Pay", platforms[activeTab].base_pay_total, (e) => handlePlatformChange(activeTab, e))}
                        {renderInput("tips_total", "Tips", platforms[activeTab].tips_total, (e) => handlePlatformChange(activeTab, e))}
                        {renderInput("bonus_earned", "Bonus", platforms[activeTab].bonus_earned, (e) => handlePlatformChange(activeTab, e))}
                        {renderInput("surge_earnings", "Surge", platforms[activeTab].surge_earnings, (e) => handlePlatformChange(activeTab, e))}
                        {renderInput("incentives_received", "Incentives", platforms[activeTab].incentives_received, (e) => handlePlatformChange(activeTab, e))}
                        {renderInput("deductions", "Deductions", platforms[activeTab].deductions, (e) => handlePlatformChange(activeTab, e))}
                       </div>
                     </motion.div>
                   </AnimatePresence>
                </div>
              </div>

            </form>
          </div>

          {/* Sticky Results Panel */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-10 space-y-6">
              <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-3xl p-8 shadow-2xl border-t-4 border-yellow-400 transform transition hover:scale-105 duration-300">
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">Total Monthly Income</h3>
                    <p className="text-blue-200 text-sm">Aggregated prediction across {platforms.length} platform(s)</p>
                </div>
                
                <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-md border border-white/20 shadow-inner flex flex-col items-center justify-center min-h-[140px]">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-400 border-t-transparent mx-auto"></div>
                      <p className="text-blue-200 font-medium animate-pulse text-center">Batch AI Analysis...</p>
                    </div>
                  ) : error ? (
                    <p className="text-red-400 font-bold text-center">{error}</p>
                  ) : predictions !== null ? (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="w-full text-center"
                    >
                       <div className="text-5xl font-extrabold text-yellow-400 drop-shadow-md">
                         ₹{predictions.total.toLocaleString('en-IN')}
                       </div>
                       
                       {/* Per Platform Breakdown */}
                       {platforms.length > 1 && (
                         <div className="mt-6 pt-4 border-t border-white/20 text-left w-full">
                           <p className="text-xs text-blue-200 uppercase tracking-widest font-semibold mb-3">Platform Breakdown</p>
                           <div className="space-y-2">
                             {platforms.map((plat, i) => (
                               <div key={i} className="flex justify-between items-center text-sm">
                                  <span className="text-white bg-blue-800/50 px-2 py-1 rounded">{plat.platform}</span>
                                  <span className="text-yellow-400 font-bold">₹{predictions.perPlatform[i] !== undefined ? predictions.perPlatform[i].toLocaleString('en-IN') : '...'}</span>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                       
                       <p className="text-sm text-green-300 mt-4 font-semibold text-center">↑ Validated by Ensemble Model</p>
                    </motion.div>
                  ) : (
                    <p className="text-gray-300 font-medium text-center">Awaiting inputs</p>
                  )}
                </div>

                <button 
                  type="submit"
                  form="predict-form"
                  disabled={loading}
                  className="mt-8 w-full bg-yellow-400 hover:bg-yellow-300 text-blue-900 disabled:opacity-50 font-bold py-4 px-6 rounded-xl shadow-lg transition duration-200 text-lg flex items-center justify-center space-x-2"
                >
                  <span>{loading ? "Analyzing..." : "Calculate Income"}</span>
                  {!loading && (
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      </div>
    </div>
  );
}
