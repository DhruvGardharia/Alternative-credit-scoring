import { createContext, useContext, useState, useEffect } from "react";

const translations = {
  en: {
    // Navbar
    welcome: "Welcome",
    logout: "Logout",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",

    // Quick Actions
    uploadStatement: "Upload Statement",
    viewCreditReport: "View Credit Report",
    learningCenter: "Learning Center",
    myAccount: "My Account",

    // Welcome Banner
    welcomeBack: "Welcome back",
    welcomeSubtitle: "Track your financial journey and build your credit score with every transaction.",
    didYouKnow: "Did you know?",
    didYouKnowText: "Regular income tracking can improve your credit score by up to 30%",
    proTip: "Pro Tip",
    proTipText: "Keep your expense ratio below 50% to qualify for better loan rates",
    yourGoal: "Your Goal",
    yourGoalText: "Upload your bank statement to get your personalized credit score",
    calculateMyScore: "Calculate My Score",

    // Upload Form
    uploadBankStatement: "Upload Bank Statement",
    uploadSubtitle: "Upload your CSV file to calculate your credit score instantly",
    analyzeNow: "Analyze Now",
    analyzing: "Analyzing...",
    pleaseSelectCSV: "Please select a CSV file",

    // Future Integration Note
    futureEnhancement: "Future Enhancement",
    futureEnhancementText:
      "In future versions, we plan to integrate directly with gig platforms (e.g., food delivery and ride-hailing companies) to securely access earnings data with user consent. This will enable real-time credit monitoring and automatic score updates.",

    // Financial Health Cards
    financialHealth: "Financial Health",
    creditReadiness: "Credit Readiness",
    riskAssessment: "Risk Assessment",
    risk: "Risk",

    // Health Statuses
    excellent: "Excellent",
    stable: "Stable",
    needsAttention: "Needs Attention",
    preAssessment: "Pre-Assessment",
    excellentDetail: "Your financial health is outstanding",
    stableDetail: "Good financial habits detected",
    needsAttentionDetail: "Focus on reducing expenses and increasing consistency",
    preAssessmentDetail: "Upload bank statement to generate insights",

    // Credit Readiness Statuses
    eligible: "Eligible",
    partiallyEligible: "Partially Eligible",
    buildingEligibility: "Building Eligibility",
    uploadStatementStatus: "Upload Statement",
    partiallyEligibleDetail: "Qualified for small loans with standard rates",
    buildingEligibilityDetail: "Continue improving financial patterns for approval",
    uploadStatementDetail: "Bank statement required for credit assessment",

    // Risk Levels
    low: "Low",
    medium: "Medium",
    high: "High",
    notEvaluated: "Not Evaluated",
    lowRiskDetail: "Low default risk based on stable income and controlled spending",
    mediumRiskDetail: "Moderate risk profile with room for improvement",
    highRiskDetail: "Higher risk due to expense patterns or income inconsistency",
    notEvaluatedDetail: "Risk assessment requires bank statement data",

    // Smart Insights
    smartFinancialInsights: "Smart Financial Insights",
    strongIncomeConsistency: "Strong Income Consistency",
    irregularIncomePattern: "Irregular Income Pattern",
    irregularIncomeDetail: "More consistent earnings improve credit eligibility",
    healthyExpenseManagement: "Healthy Expense Management",
    highExpenseRatio: "High Expense Ratio",
    highExpenseRatioDetail: "Consider reducing expenses below 50%",
    regularActivity: "Regular Activity",
    activeDaysDetail: "active days shows commitment",
    getCreditScore: "Get Your Credit Score",
    getCreditScoreDetail: "Upload your bank statement (CSV format) for instant credit assessment",
    securePrivate: "Secure & Private Analysis",
    securePrivateDetail: "Your financial data is analyzed locally and never shared with third parties",
    designedForGig: "Designed for Gig Workers",
    designedForGigDetail: "Unlike traditional credit bureaus, we understand irregular income patterns",

    // Next Actions
    recommendedActions: "Recommended Actions",
    priority: "Priority",
    calculateCreditScore: "Calculate Your Credit Score",
    calculateCreditScoreDetail: "Upload bank statement to get instant credit assessment",
    uploadNow: "Upload Now",
    improveYourScore: "Improve Your Score",
    reduceExpenseRatio: "Reduce Expense Ratio",
    targetBelow50: "Target below 50% for better rates",
    trackExpenses: "Track Expenses",
    trackDailyExpenses: "Optional: Track Daily Expenses",
    trackDailyExpensesDetail:
      "While not required for credit score, expense tracking helps you manage finances",
    addExpense: "Add Expense",
    doingGreat: "You're Doing Great!",
    doingGreatDetail: "Keep maintaining your financial discipline",
    viewAnalysis: "View Analysis",

    // Stats Cards
    totalExpenses: "Total Expenses",
    transactions: "Transactions",
    dailyAverage: "Daily Average",
    savingsGoal: "Savings Goal",
    saved: "Saved",
    clickToEditGoal: "Click to edit goal",

    // Category Breakdown
    categoryBreakdown: "Category Breakdown",

    // Savings Goal Modal
    editSavingsGoal: "Edit Savings Goal",
    monthlyTarget: "Monthly Savings Target",
    savingsGoalInfo:
      "Set a realistic monthly savings goal based on your income and expenses. Track your progress and adjust as needed.",
    cancel: "Cancel",
    saveGoal: "Save Goal",

    // Expense Form
    yourExpenses: "Your Expenses",
    addExpenseBtn: "+ Add Expense",
    cancelBtn: "Cancel",
    category: "Category",
    amount: "Amount (₹)",
    date: "Date",
    paymentMethod: "Payment Method",
    description: "Description",
    descriptionPlaceholder: "Optional description...",
    addExpenseSubmit: "Add Expense",

    // Expense List
    noExpensesYet: "No expenses tracked yet",
    noExpensesSubtitle: "Start tracking your daily expenses to manage your finances better",
    addFirstExpense: "Add Your First Expense",
    loadSampleData: "Load Sample Data",
    noDescription: "No description",
    deleteExpenseConfirm: "Delete this expense?",

    // Account Alert
    account: "Account",
    email: "Email",
    role: "Role",

    // LandingNavbar
    login: "Login",
    getStarted: "Get Started",

    // Landing Hero
    heroTag: "Built for India's 50M+ Gig Workers",
    heroHeadline1: "No Credit History?",
    heroHeadline2: "No Problem.",
    heroSubtitle1: "Traditional banks reject you. We understand you.",
    heroSubtitle2: "Upload your bank statement → Get instant credit score → Access loans up to ₹2 Lakhs",
    heroCta1: "Get Your Credit Score Free",
    heroCta2: "See How It Works",
    heroTrustLine: "✓ No credit card required  •  ✓ Takes under 5 minutes  •  ✓ 100% secure",

    // Stats
    stat1Label: "Gig Workers Without Credit",
    stat1Sub: "In India alone",
    stat2Label: "Available Credit Line",
    stat2Sub: "Based on your score",
    stat3Label: "Instant Assessment",
    stat3Sub: "Upload & get results",

    // How It Works
    howItWorksTitle: "How It Works",
    howItWorksSubtitle: "Get your alternative credit score in 4 simple steps",
    step1Title: "Sign Up",
    step1Desc: "Create your free account as a gig worker",
    step2Title: "Upload Statement",
    step2Desc: "Securely upload your bank statement CSV",
    step3Title: "Get Your Score",
    step3Desc: "AI analyzes your financial patterns instantly",
    step4Title: "Check Eligibility",
    step4Desc: "See your pre-approved loan amount",

    // Trust Section
    trustTitle: "Why Gig Workers Trust Us",
    trustSubtitle: "Built with privacy, fairness, and inclusion at our core",
    trust1Title: "Built for Gig Workers",
    trust1Desc: "Unlike traditional banks, we understand irregular income patterns from delivery, ride-hailing, and freelance work.",
    trust2Title: "Privacy-First Analysis",
    trust2Desc: "Your data is encrypted and analyzed locally. We never share your personal information with third parties.",
    trust3Title: "No Credit History Required",
    trust3Desc: "We evaluate financial behavior patterns, not CIBIL scores or traditional credit history.",
    disclaimerLabel: "How We Analyze:",
    disclaimerText: "Our credit assessment is based on financial behavior patterns such as income consistency, expense management, and transaction frequency—not personal identity data. Results are indicative and designed for demo purposes.",

    // Roadmap
    roadmapTitle: "Future Roadmap: Direct Platform Integration",
    roadmapDesc: "We're planning to integrate directly with leading gig platforms including food delivery services (Zomato, Swiggy), ride-hailing companies (Uber, Ola), and freelance marketplaces. This will enable:",
    roadmapBullet1: "Secure access to earnings data with your explicit consent",
    roadmapBullet2: "Real-time credit score updates based on your gig activity",
    roadmapBullet3: "Automated credit monitoring without manual uploads",
    roadmapNote: "Note: This is a planned feature for future versions. Currently, credit scoring is based on bank statement uploads only. No live platform integrations exist at this time.",

    // Features
    featuresTitle: "Why Choose CreditFlow?",
    featuresSubtitle: "Everything you need to access credit, designed for gig workers",
    feature1Title: "Instant Approval",
    feature1Desc: "Get your credit score and eligibility results in under 5 minutes. No waiting, no paperwork.",
    feature2Title: "Bank-Grade Security",
    feature2Desc: "Your financial data is encrypted end-to-end. We use industry-standard security protocols.",
    feature3Title: "Improve Your Score",
    feature3Desc: "Track your financial health over time and get actionable tips to boost your creditworthiness.",

    // Final CTA
    ctaTitle1: "Join Thousands of Gig Workers",
    ctaTitle2: "Building Their Credit Future",
    ctaSubtitle1: "Traditional credit systems weren't built for you. We are.",
    ctaSubtitle2: "Whether you drive, deliver, or freelance — your income matters. Your work matters. Your credit should too.",
    ctaBtn1: "Get Started for Free",
    ctaBtn2: "Sign In",
    ctaTrust1: "100% Free Assessment",
    ctaTrust2: "No Hidden Fees",
    ctaTrust3: "Secure & Private",

    // Footer
    footerCopy: "© 2026 CreditFlow. Empowering gig workers with financial access.",
    footerDemo: "Demo project for educational purposes.",

    // Login Page
    loginWelcomeTitle: "Welcome Back",
    loginWelcomeSubtitle: "Login to access your dashboard",
    loginEmailLabel: "Email Address",
    loginEmailPlaceholder: "you@example.com",
    loginPasswordLabel: "Password",
    loginPasswordPlaceholder: "Password",
    loginButton: "Login",
    loginLoading: "Logging in...",
    loginNoAccount: "Don't have an account?",
    loginSignUpLink: "Sign up free",
    loginBackHome: "Back to home",

    // Register Page
    registerTitle: "Create Account",
    registerSubtitle: "Start your credit journey today",
    registerFullNameLabel: "Full Name",
    registerFullNamePlaceholder: "John Doe",
    registerEmailLabel: "Email Address",
    registerEmailPlaceholder: "you@example.com",
    registerPhoneLabel: "Phone Number",
    registerPhonePlaceholder: "+91 98765 43210",
    registerEmploymentLabel: "Employment Type",
    registerEmploymentDelivery: "Delivery Partner",
    registerEmploymentDriver: "Driver",
    registerEmploymentFreelancer: "Freelancer",
    registerPasswordLabel: "Password",
    registerConfirmPasswordLabel: "Confirm Password",
    registerButton: "Create Account",
    registerLoading: "Creating Account...",
    registerPasswordMismatch: "Passwords do not match",
    registerHaveAccount: "Already have an account?",
    registerLoginLink: "Login here",
    registerBackHome: "Back to home",

    // Tax Summary Page
    taxPageTitle: "Annual Financial & Tax Summary",
    taxPageSubtitle: "Official projection for FY under the New Tax Regime",
    taxDownloadPdf: "Download PDF",
    taxDownloadPdfPreparing: "Preparing...",
    taxRetry: "Retry",
    taxDashboard: "Dashboard",
    taxLabelGrossIncome: "Gross Income",
    taxLabelDeductible: "Deductible Expenses",
    taxLabelNetTaxable: "Net Taxable Income",
    taxLabelEstimatedTax: "Estimated Tax",
    taxLabelEffectiveRate: "Effective Tax Rate",
    taxSlabTitle: "Tax Slab Breakdown",
    taxSlabSubtitle: "Detailed tax computation across government-defined slabs",
    taxAssessmentYear: "Assessment Year",
    taxColSlabRange: "Slab Range",
    taxColTaxableAmount: "Taxable Amount",
    taxColTaxRate: "Tax Rate",
    taxColTaxAmount: "Tax Amount",
    taxFinancialOverview: "Financial Overview",
    taxFinancialOverviewSubtitle: "Key stats from your synced financial summary",
    taxTotalIncome: "Total Income Tracked",
    taxTotalExpenses: "Total Expenses Recorded",
    taxSavingsRate: "Savings Rate",
    taxDataRefreshed: "Data Refreshed On",
    taxNotAvailable: "Not Available",
    taxAdvisory: "Advisory",
    taxAdvisoryText: "This report is generated from verified income and expense data synced to your CreditFlow profile and follows the Government of India New Tax Regime slabs. Please consult a certified tax professional for filing confirmation, additional deductions, and declarations specific to your situation.",
    taxGeneratedFor: "Generated for",
    taxNoData: "No tax summary data available yet.",
    taxBackToDashboard: "Back to Dashboard",
    taxPreparingMsg: "Preparing tax summary...",
  },

  hi: {
    // Navbar
    welcome: "स्वागत",
    logout: "लॉग आउट",
    switchToLight: "लाइट मोड पर स्विच करें",
    switchToDark: "डार्क मोड पर स्विच करें",

    // Quick Actions
    uploadStatement: "स्टेटमेंट अपलोड करें",
    viewCreditReport: "क्रेडिट रिपोर्ट देखें",
    learningCenter: "शिक्षा केंद्र",
    myAccount: "मेरा खाता",

    // Welcome Banner
    welcomeBack: "वापसी पर स्वागत है",
    welcomeSubtitle: "हर लेनदेन के साथ अपनी वित्तीय यात्रा को ट्रैक करें और क्रेडिट स्कोर बनाएं।",
    didYouKnow: "क्या आप जानते हैं?",
    didYouKnowText: "नियमित आय ट्रैकिंग आपके क्रेडिट स्कोर को 30% तक सुधार सकती है",
    proTip: "प्रो टिप",
    proTipText: "बेहतर लोन दरों के लिए अपना खर्च अनुपात 50% से कम रखें",
    yourGoal: "आपका लक्ष्य",
    yourGoalText: "अपना व्यक्तिगत क्रेडिट स्कोर पाने के लिए बैंक स्टेटमेंट अपलोड करें",
    calculateMyScore: "मेरा स्कोर कैलकुलेट करें",

    // Upload Form
    uploadBankStatement: "बैंक स्टेटमेंट अपलोड करें",
    uploadSubtitle: "तत्काल क्रेडिट स्कोर के लिए अपनी CSV फ़ाइल अपलोड करें",
    analyzeNow: "अभी विश्लेषण करें",
    analyzing: "विश्लेषण हो रहा है...",
    pleaseSelectCSV: "कृपया एक CSV फ़ाइल चुनें",

    // Future Integration Note
    futureEnhancement: "भविष्य का सुधार",
    futureEnhancementText:
      "भविष्य के संस्करणों में, हम गिग प्लेटफार्मों के साथ सीधे एकीकरण की योजना बना रहे हैं। यह वास्तविक समय में क्रेडिट निगरानी और स्वचालित स्कोर अपडेट को सक्षम करेगा।",

    // Financial Health Cards
    financialHealth: "वित्तीय स्वास्थ्य",
    creditReadiness: "क्रेडिट तत्परता",
    riskAssessment: "जोखिम मूल्यांकन",
    risk: "जोखिम",

    // Health Statuses
    excellent: "उत्कृष्ट",
    stable: "स्थिर",
    needsAttention: "ध्यान आवश्यक",
    preAssessment: "पूर्व-मूल्यांकन",
    excellentDetail: "आपका वित्तीय स्वास्थ्य बेहतरीन है",
    stableDetail: "अच्छी वित्तीय आदतें पाई गई हैं",
    needsAttentionDetail: "खर्च कम करें और निरंतरता बढ़ाएं",
    preAssessmentDetail: "जानकारी के लिए बैंक स्टेटमेंट अपलोड करें",

    // Credit Readiness Statuses
    eligible: "योग्य",
    partiallyEligible: "आंशिक रूप से योग्य",
    buildingEligibility: "पात्रता बना रहे हैं",
    uploadStatementStatus: "स्टेटमेंट अपलोड करें",
    partiallyEligibleDetail: "मानक दरों पर छोटे लोन के लिए योग्य",
    buildingEligibilityDetail: "अनुमोदन के लिए वित्तीय पैटर्न सुधारते रहें",
    uploadStatementDetail: "क्रेडिट मूल्यांकन के लिए बैंक स्टेटमेंट आवश्यक है",

    // Risk Levels
    low: "कम",
    medium: "मध्यम",
    high: "उच्च",
    notEvaluated: "मूल्यांकन नहीं किया गया",
    lowRiskDetail: "स्थिर आय और नियंत्रित खर्च के आधार पर कम डिफ़ॉल्ट जोखिम",
    mediumRiskDetail: "सुधार की गुंजाइश के साथ मध्यम जोखिम प्रोफ़ाइल",
    highRiskDetail: "खर्च पैटर्न या आय असंगति के कारण अधिक जोखिम",
    notEvaluatedDetail: "जोखिम मूल्यांकन के लिए बैंक स्टेटमेंट डेटा आवश्यक है",

    // Smart Insights
    smartFinancialInsights: "स्मार्ट वित्तीय अंतर्दृष्टि",
    strongIncomeConsistency: "मजबूत आय निरंतरता",
    irregularIncomePattern: "अनियमित आय पैटर्न",
    irregularIncomeDetail: "अधिक सुसंगत कमाई क्रेडिट पात्रता में सुधार करती है",
    healthyExpenseManagement: "स्वस्थ खर्च प्रबंधन",
    highExpenseRatio: "उच्च खर्च अनुपात",
    highExpenseRatioDetail: "खर्च 50% से कम करने पर विचार करें",
    regularActivity: "नियमित गतिविधि",
    activeDaysDetail: "सक्रिय दिन प्रतिबद्धता दिखाते हैं",
    getCreditScore: "अपना क्रेडिट स्कोर प्राप्त करें",
    getCreditScoreDetail: "तत्काल क्रेडिट मूल्यांकन के लिए बैंक स्टेटमेंट (CSV) अपलोड करें",
    securePrivate: "सुरक्षित और निजी विश्लेषण",
    securePrivateDetail: "आपका वित्तीय डेटा स्थानीय रूप से विश्लेषण किया जाता है और तीसरे पक्ष के साथ कभी साझा नहीं किया जाता",
    designedForGig: "गिग वर्कर्स के लिए डिज़ाइन किया गया",
    designedForGigDetail: "पारंपरिक क्रेडिट ब्यूरो के विपरीत, हम अनियमित आय पैटर्न को समझते हैं",

    // Next Actions
    recommendedActions: "अनुशंसित कार्रवाइयां",
    priority: "प्राथमिकता",
    calculateCreditScore: "अपना क्रेडिट स्कोर कैलकुलेट करें",
    calculateCreditScoreDetail: "तत्काल क्रेडिट मूल्यांकन के लिए बैंक स्टेटमेंट अपलोड करें",
    uploadNow: "अभी अपलोड करें",
    improveYourScore: "अपना स्कोर सुधारें",
    reduceExpenseRatio: "खर्च अनुपात कम करें",
    targetBelow50: "बेहतर दरों के लिए 50% से कम लक्षित करें",
    trackExpenses: "खर्च ट्रैक करें",
    trackDailyExpenses: "वैकल्पिक: दैनिक खर्च ट्रैक करें",
    trackDailyExpensesDetail: "क्रेडिट स्कोर के लिए आवश्यक नहीं, लेकिन खर्च ट्रैकिंग वित्त प्रबंधन में मदद करती है",
    addExpense: "खर्च जोड़ें",
    doingGreat: "आप बहुत अच्छा कर रहे हैं!",
    doingGreatDetail: "अपनी वित्तीय अनुशासन बनाए रखें",
    viewAnalysis: "विश्लेषण देखें",

    // Stats Cards
    totalExpenses: "कुल खर्च",
    transactions: "लेनदेन",
    dailyAverage: "दैनिक औसत",
    savingsGoal: "बचत लक्ष्य",
    saved: "बचाया",
    clickToEditGoal: "लक्ष्य संपादित करने के लिए क्लिक करें",

    // Category Breakdown
    categoryBreakdown: "श्रेणी विवरण",

    // Savings Goal Modal
    editSavingsGoal: "बचत लक्ष्य संपादित करें",
    monthlyTarget: "मासिक बचत लक्ष्य",
    savingsGoalInfo: "अपनी आय और खर्च के आधार पर एक यथार्थवादी मासिक बचत लक्ष्य निर्धारित करें।",
    cancel: "रद्द करें",
    saveGoal: "लक्ष्य सहेजें",

    // Expense Form
    yourExpenses: "आपके खर्च",
    addExpenseBtn: "+ खर्च जोड़ें",
    cancelBtn: "रद्द करें",
    category: "श्रेणी",
    amount: "राशि (₹)",
    date: "तारीख",
    paymentMethod: "भुगतान विधि",
    description: "विवरण",
    descriptionPlaceholder: "वैकल्पिक विवरण...",
    addExpenseSubmit: "खर्च जोड़ें",

    // Expense List
    noExpensesYet: "अभी तक कोई खर्च ट्रैक नहीं किया गया",
    noExpensesSubtitle: "अपने वित्त को बेहतर ढंग से प्रबंधित करने के लिए दैनिक खर्च ट्रैक करना शुरू करें",
    addFirstExpense: "पहला खर्च जोड़ें",
    loadSampleData: "नमूना डेटा लोड करें",
    noDescription: "कोई विवरण नहीं",
    deleteExpenseConfirm: "इस खर्च को हटाएं?",

    // Account Alert
    account: "खाता",
    email: "ईमेल",
    role: "भूमिका",

    // LandingNavbar
    login: "लॉगिन",
    getStarted: "शुरू करें",

    // Landing Hero
    heroTag: "भारत के 5 करोड़+ गिग वर्कर्स के लिए बनाया गया",
    heroHeadline1: "क्रेडिट इतिहास नहीं?",
    heroHeadline2: "कोई बात नहीं।",
    heroSubtitle1: "पारंपरिक बैंक आपको अस्वीकार करते हैं। हम आपको समझते हैं।",
    heroSubtitle2: "बैंक स्टेटमेंट अपलोड करें → तत्काल क्रेडिट स्कोर पाएं → ₹2 लाख तक के लोन पाएं",
    heroCta1: "मुफ्त में क्रेडिट स्कोर पाएं",
    heroCta2: "देखें कैसे काम करता है",
    heroTrustLine: "✓ क्रेडिट कार्ड की आवश्यकता नहीं  •  ✓ 5 मिनट से कम  •  ✓ 100% सुरक्षित",

    // Stats
    stat1Label: "क्रेडिट के बिना गिग वर्कर्स",
    stat1Sub: "केवल भारत में",
    stat2Label: "उपलब्ध क्रेडिट लाइन",
    stat2Sub: "आपके स्कोर के आधार पर",
    stat3Label: "तत्काल मूल्यांकन",
    stat3Sub: "अपलोड करें और परिणाम पाएं",

    // How It Works
    howItWorksTitle: "यह कैसे काम करता है",
    howItWorksSubtitle: "4 सरल चरणों में वैकल्पिक क्रेडिट स्कोर प्राप्त करें",
    step1Title: "साइन अप करें",
    step1Desc: "गिग वर्कर के रूप में अपना मुफ्त खाता बनाएं",
    step2Title: "स्टेटमेंट अपलोड करें",
    step2Desc: "सुरक्षित रूप से अपना बैंक स्टेटमेंट CSV अपलोड करें",
    step3Title: "अपना स्कोर पाएं",
    step3Desc: "AI तुरंत आपके वित्तीय पैटर्न का विश्लेषण करता है",
    step4Title: "पात्रता जांचें",
    step4Desc: "अपनी पूर्व-अनुमोदित लोन राशि देखें",

    // Trust Section
    trustTitle: "गिग वर्कर्स हम पर क्यों भरोसा करते हैं",
    trustSubtitle: "गोपनीयता, निष्पक्षता और समावेश के साथ बनाया गया",
    trust1Title: "गिग वर्कर्स के लिए बनाया गया",
    trust1Desc: "पारंपरिक बैंकों के विपरीत, हम डिलीवरी, राइड-हेलिंग और फ्रीलांस कार्य से अनियमित आय पैटर्न को समझते हैं।",
    trust2Title: "गोपनीयता-प्रथम विश्लेषण",
    trust2Desc: "आपका डेटा एन्क्रिप्टेड और स्थानीय रूप से विश्लेषित किया जाता है। हम आपकी व्यक्तिगत जानकारी कभी साझा नहीं करते।",
    trust3Title: "क्रेडिट इतिहास की आवश्यकता नहीं",
    trust3Desc: "हम वित्तीय व्यवहार पैटर्न का मूल्यांकन करते हैं, CIBIL स्कोर या पारंपरिक क्रेडिट इतिहास का नहीं।",
    disclaimerLabel: "हम कैसे विश्लेषण करते हैं:",
    disclaimerText: "हमारा क्रेडिट मूल्यांकन आय सुसंगतता, खर्च प्रबंधन और लेनदेन आवृत्ति जैसे वित्तीय व्यवहार पैटर्न पर आधारित है। परिणाम संकेतात्मक हैं।",

    // Roadmap
    roadmapTitle: "भविष्य की योजना: सीधा प्लेटफॉर्म एकीकरण",
    roadmapDesc: "हम Zomato, Swiggy, Uber, Ola जैसे प्रमुख गिग प्लेटफार्मों के साथ सीधे एकीकरण की योजना बना रहे हैं। इससे होगा:",
    roadmapBullet1: "आपकी स्पष्ट सहमति के साथ कमाई डेटा तक सुरक्षित पहुंच",
    roadmapBullet2: "आपकी गिग गतिविधि के आधार पर रियल-टाइम क्रेडिट स्कोर अपडेट",
    roadmapBullet3: "मैन्युअल अपलोड के बिना स्वचालित क्रेडिट निगरानी",
    roadmapNote: "नोट: यह भविष्य के संस्करणों के लिए नियोजित सुविधा है। वर्तमान में, क्रेडिट स्कोरिंग केवल बैंक स्टेटमेंट अपलोड पर आधारित है।",

    // Features
    featuresTitle: "CreditFlow क्यों चुनें?",
    featuresSubtitle: "क्रेडिट तक पहुंचने के लिए सब कुछ, गिग वर्कर्स के लिए डिज़ाइन किया गया",
    feature1Title: "तत्काल अनुमोदन",
    feature1Desc: "5 मिनट से कम में अपना क्रेडिट स्कोर और पात्रता परिणाम प्राप्त करें। कोई प्रतीक्षा नहीं, कोई कागजी काम नहीं।",
    feature2Title: "बैंक-स्तरीय सुरक्षा",
    feature2Desc: "आपका वित्तीय डेटा एंड-टू-एंड एन्क्रिप्टेड है। हम उद्योग-मानक सुरक्षा प्रोटोकॉल का उपयोग करते हैं।",
    feature3Title: "अपना स्कोर सुधारें",
    feature3Desc: "समय के साथ अपने वित्तीय स्वास्थ्य को ट्रैक करें और अपनी साख बढ़ाने के लिए कार्रवाई योग्य सुझाव पाएं।",

    // Final CTA
    ctaTitle1: "हजारों गिग वर्कर्स से जुड़ें",
    ctaTitle2: "जो अपना क्रेडिट भविष्य बना रहे हैं",
    ctaSubtitle1: "पारंपरिक क्रेडिट सिस्टम आपके लिए नहीं बना था। हम बने हैं।",
    ctaSubtitle2: "चाहे आप ड्राइव करें, डिलीवरी करें, या फ्रीलांस करें — आपकी आय मायने रखती है। आपका काम मायने रखता है। आपका क्रेडिट भी मायने रखना चाहिए।",
    ctaBtn1: "मुफ्त में शुरू करें",
    ctaBtn2: "साइन इन करें",
    ctaTrust1: "100% मुफ्त मूल्यांकन",
    ctaTrust2: "कोई छिपी हुई फीस नहीं",
    ctaTrust3: "सुरक्षित और निजी",

    // Footer
    footerCopy: "© 2026 CreditFlow. गिग वर्कर्स को वित्तीय पहुंच के साथ सशक्त बनाना।",
    footerDemo: "शैक्षिक उद्देश्यों के लिए डेमो प्रोजेक्ट।",

    // Login Page
    loginWelcomeTitle: "वापसी पर स्वागत है",
    loginWelcomeSubtitle: "अपना डैशबोर्ड एक्सेस करने के लिए लॉगिन करें",
    loginEmailLabel: "ईमेल पता",
    loginEmailPlaceholder: "you@example.com",
    loginPasswordLabel: "पासवर्ड",
    loginPasswordPlaceholder: "पासवर्ड",
    loginButton: "लॉगिन",
    loginLoading: "लॉगिन हो रहा है...",
    loginNoAccount: "खाता नहीं है?",
    loginSignUpLink: "मुफ्त साइन अप करें",
    loginBackHome: "होम पर वापस जाएं",

    // Register Page
    registerTitle: "खाता बनाएं",
    registerSubtitle: "आज अपनी क्रेडिट यात्रा शुरू करें",
    registerFullNameLabel: "पूरा नाम",
    registerFullNamePlaceholder: "John Doe",
    registerEmailLabel: "ईमेल पता",
    registerEmailPlaceholder: "you@example.com",
    registerPhoneLabel: "फोन नंबर",
    registerPhonePlaceholder: "+91 98765 43210",
    registerEmploymentLabel: "रोजगार का प्रकार",
    registerEmploymentDelivery: "डिलीवरी पार्टनर",
    registerEmploymentDriver: "ड्राइवर",
    registerEmploymentFreelancer: "फ्रीलांसर",
    registerPasswordLabel: "पासवर्ड",
    registerConfirmPasswordLabel: "पासवर्ड की पुष्टि करें",
    registerButton: "खाता बनाएं",
    registerLoading: "खाता बनाया जा रहा है...",
    registerPasswordMismatch: "पासवर्ड मेल नहीं खाते",
    registerHaveAccount: "पहले से खाता है?",
    registerLoginLink: "यहां लॉगिन करें",
    registerBackHome: "होम पर वापस जाएं",

    // Tax Summary Page
    taxPageTitle: "वार्षिक वित्तीय और कर सारांश",
    taxPageSubtitle: "नई कर व्यवस्था के तहत वित्तीय वर्ष के लिए आधिकारिक प्रक्षेपण",
    taxDownloadPdf: "PDF डाउनलोड करें",
    taxDownloadPdfPreparing: "तैयार हो रहा है...",
    taxRetry: "पुनः प्रयास",
    taxDashboard: "डैशबोर्ड",
    taxLabelGrossIncome: "सकल आय",
    taxLabelDeductible: "कटौती योग्य व्यय",
    taxLabelNetTaxable: "शुद्ध कर योग्य आय",
    taxLabelEstimatedTax: "अनुमानित कर",
    taxLabelEffectiveRate: "प्रभावी कर दर",
    taxSlabTitle: "कर स्लैब विवरण",
    taxSlabSubtitle: "सरकार-परिभाषित स्लैब में विस्तृत कर गणना",
    taxAssessmentYear: "निर्धारण वर्ष",
    taxColSlabRange: "स्लैब सीमा",
    taxColTaxableAmount: "कर योग्य राशि",
    taxColTaxRate: "कर दर",
    taxColTaxAmount: "कर राशि",
    taxFinancialOverview: "वित्तीय अवलोकन",
    taxFinancialOverviewSubtitle: "आपके सिंक किए गए वित्तीय सारांश से मुख्य आंकड़े",
    taxTotalIncome: "कुल ट्रैक की गई आय",
    taxTotalExpenses: "कुल दर्ज व्यय",
    taxSavingsRate: "बचत दर",
    taxDataRefreshed: "डेटा नवीनीकरण तिथि",
    taxNotAvailable: "उपलब्ध नहीं",
    taxAdvisory: "परामर्श",
    taxAdvisoryText: "यह रिपोर्ट आपके CreditFlow प्रोफ़ाइल में सिंक किए गए सत्यापित आय और व्यय डेटा से तैयार की गई है। कृपया फाइलिंग पुष्टि, अतिरिक्त कटौती और अपनी स्थिति के अनुसार घोषणाओं के लिए एक प्रमाणित कर पेशेवर से परामर्श लें।",
    taxGeneratedFor: "इसके लिए तैयार किया गया",
    taxNoData: "अभी तक कोई कर सारांश डेटा उपलब्ध नहीं है।",
    taxBackToDashboard: "डैशबोर्ड पर वापस जाएं",
    taxPreparingMsg: "कर सारांश तैयार हो रहा है...",
  },

  mr: {
    // Navbar
    welcome: "स्वागत",
    logout: "लॉग आउट",
    switchToLight: "लाइट मोडवर स्विच करा",
    switchToDark: "डार्क मोडवर स्विच करा",

    // Quick Actions
    uploadStatement: "स्टेटमेंट अपलोड करा",
    viewCreditReport: "क्रेडिट रिपोर्ट पहा",
    learningCenter: "शिक्षण केंद्र",
    myAccount: "माझे खाते",

    // Welcome Banner
    welcomeBack: "परत स्वागत आहे",
    welcomeSubtitle: "प्रत्येक व्यवहारासह आपला आर्थिक प्रवास ट्रॅक करा आणि क्रेडिट स्कोर तयार करा.",
    didYouKnow: "तुम्हाला माहित आहे का?",
    didYouKnowText: "नियमित उत्पन्न ट्रॅकिंगमुळे तुमचा क्रेडिट स्कोर ३०% पर्यंत सुधारू शकतो",
    proTip: "प्रो टिप",
    proTipText: "चांगल्या कर्ज दरांसाठी खर्चाचे प्रमाण ५०% पेक्षा कमी ठेवा",
    yourGoal: "तुमचे ध्येय",
    yourGoalText: "वैयक्तिक क्रेडिट स्कोर मिळवण्यासाठी बँक स्टेटमेंट अपलोड करा",
    calculateMyScore: "माझा स्कोर काढा",

    // Upload Form
    uploadBankStatement: "बँक स्टेटमेंट अपलोड करा",
    uploadSubtitle: "तत्काल क्रेडिट स्कोरसाठी तुमची CSV फाइल अपलोड करा",
    analyzeNow: "आता विश्लेषण करा",
    analyzing: "विश्लेषण होत आहे...",
    pleaseSelectCSV: "कृपया CSV फाइल निवडा",

    // Future Integration Note
    futureEnhancement: "भविष्यातील सुधारणा",
    futureEnhancementText:
      "भविष्यातील आवृत्त्यांमध्ये, आम्ही गिग प्लॅटफॉर्मशी थेट एकत्रीकरण करण्याची योजना आखत आहोत. यामुळे रिअल-टाइम क्रेडिट मॉनिटरिंग आणि स्वयंचलित स्कोर अपडेट शक्य होईल.",

    // Financial Health Cards
    financialHealth: "आर्थिक आरोग्य",
    creditReadiness: "क्रेडिट तयारी",
    riskAssessment: "जोखीम मूल्यांकन",
    risk: "जोखीम",

    // Health Statuses
    excellent: "उत्कृष्ट",
    stable: "स्थिर",
    needsAttention: "लक्ष आवश्यक",
    preAssessment: "पूर्व-मूल्यांकन",
    excellentDetail: "तुमचे आर्थिक आरोग्य उत्तम आहे",
    stableDetail: "चांगल्या आर्थिक सवयी आढळल्या",
    needsAttentionDetail: "खर्च कमी करण्यावर आणि सातत्य वाढवण्यावर लक्ष केंद्रित करा",
    preAssessmentDetail: "माहिती मिळवण्यासाठी बँक स्टेटमेंट अपलोड करा",

    // Credit Readiness Statuses
    eligible: "पात्र",
    partiallyEligible: "अंशतः पात्र",
    buildingEligibility: "पात्रता तयार करत आहे",
    uploadStatementStatus: "स्टेटमेंट अपलोड करा",
    partiallyEligibleDetail: "मानक दरांवर लहान कर्जासाठी पात्र",
    buildingEligibilityDetail: "मंजुरीसाठी आर्थिक पद्धती सुधारत राहा",
    uploadStatementDetail: "क्रेडिट मूल्यांकनासाठी बँक स्टेटमेंट आवश्यक आहे",

    // Risk Levels
    low: "कमी",
    medium: "मध्यम",
    high: "उच्च",
    notEvaluated: "मूल्यांकन केले नाही",
    lowRiskDetail: "स्थिर उत्पन्न आणि नियंत्रित खर्चावर आधारित कमी डीफॉल्ट जोखीम",
    mediumRiskDetail: "सुधारणेसाठी वाव असलेली मध्यम जोखीम प्रोफाइल",
    highRiskDetail: "खर्चाचे नमुने किंवा उत्पन्नाच्या विसंगतीमुळे जास्त जोखीम",
    notEvaluatedDetail: "जोखीम मूल्यांकनासाठी बँक स्टेटमेंट डेटा आवश्यक आहे",

    // Smart Insights
    smartFinancialInsights: "स्मार्ट आर्थिक अंतर्दृष्टी",
    strongIncomeConsistency: "मजबूत उत्पन्न सातत्य",
    irregularIncomePattern: "अनियमित उत्पन्न नमुना",
    irregularIncomeDetail: "अधिक सातत्यपूर्ण कमाई क्रेडिट पात्रता सुधारते",
    healthyExpenseManagement: "निरोगी खर्च व्यवस्थापन",
    highExpenseRatio: "उच्च खर्च प्रमाण",
    highExpenseRatioDetail: "खर्च ५०% पेक्षा कमी करण्याचा विचार करा",
    regularActivity: "नियमित क्रियाकलाप",
    activeDaysDetail: "सक्रिय दिवस वचनबद्धता दर्शवतात",
    getCreditScore: "तुमचा क्रेडिट स्कोर मिळवा",
    getCreditScoreDetail: "तत्काल क्रेडिट मूल्यांकनासाठी बँक स्टेटमेंट (CSV) अपलोड करा",
    securePrivate: "सुरक्षित आणि खाजगी विश्लेषण",
    securePrivateDetail: "तुमचा आर्थिक डेटा स्थानिक पातळीवर विश्लेषित केला जातो आणि तृतीय पक्षांशी कधीही शेअर केला जात नाही",
    designedForGig: "गिग वर्कर्ससाठी डिझाइन केलेले",
    designedForGigDetail: "पारंपारिक क्रेडिट ब्युरोंप्रमाणे नव्हे, आम्हाला अनियमित उत्पन्नाचे नमुने समजतात",

    // Next Actions
    recommendedActions: "शिफारस केलेल्या कृती",
    priority: "प्राधान्य",
    calculateCreditScore: "तुमचा क्रेडिट स्कोर काढा",
    calculateCreditScoreDetail: "तत्काल क्रेडिट मूल्यांकनासाठी बँक स्टेटमेंट अपलोड करा",
    uploadNow: "आता अपलोड करा",
    improveYourScore: "तुमचा स्कोर सुधारा",
    reduceExpenseRatio: "खर्च प्रमाण कमी करा",
    targetBelow50: "चांगल्या दरांसाठी ५०% पेक्षा कमी लक्ष्य ठेवा",
    trackExpenses: "खर्च ट्रॅक करा",
    trackDailyExpenses: "पर्यायी: दैनंदिन खर्च ट्रॅक करा",
    trackDailyExpensesDetail: "क्रेडिट स्कोरसाठी आवश्यक नसले तरी खर्च ट्रॅकिंग वित्त व्यवस्थापनात मदत करते",
    addExpense: "खर्च जोडा",
    doingGreat: "तुम्ही खूप चांगले करत आहात!",
    doingGreatDetail: "तुमची आर्थिक शिस्त कायम ठेवा",
    viewAnalysis: "विश्लेषण पहा",

    // Stats Cards
    totalExpenses: "एकूण खर्च",
    transactions: "व्यवहार",
    dailyAverage: "दैनंदिन सरासरी",
    savingsGoal: "बचत उद्दिष्ट",
    saved: "बचत केली",
    clickToEditGoal: "उद्दिष्ट संपादित करण्यासाठी क्लिक करा",

    // Category Breakdown
    categoryBreakdown: "श्रेणी तपशील",

    // Savings Goal Modal
    editSavingsGoal: "बचत उद्दिष्ट संपादित करा",
    monthlyTarget: "मासिक बचत उद्दिष्ट",
    savingsGoalInfo: "तुमच्या उत्पन्न आणि खर्चावर आधारित वास्तववादी मासिक बचत उद्दिष्ट सेट करा.",
    cancel: "रद्द करा",
    saveGoal: "उद्दिष्ट जतन करा",

    // Expense Form
    yourExpenses: "तुमचे खर्च",
    addExpenseBtn: "+ खर्च जोडा",
    cancelBtn: "रद्द करा",
    category: "श्रेणी",
    amount: "रक्कम (₹)",
    date: "तारीख",
    paymentMethod: "देयक पद्धत",
    description: "वर्णन",
    descriptionPlaceholder: "पर्यायी वर्णन...",
    addExpenseSubmit: "खर्च जोडा",

    // Expense List
    noExpensesYet: "अद्याप कोणताही खर्च ट्रॅक केला नाही",
    noExpensesSubtitle: "तुमचे वित्त अधिक चांगल्या प्रकारे व्यवस्थापित करण्यासाठी दैनंदिन खर्च ट्रॅक करणे सुरू करा",
    addFirstExpense: "पहिला खर्च जोडा",
    loadSampleData: "नमुना डेटा लोड करा",
    noDescription: "वर्णन नाही",
    deleteExpenseConfirm: "हा खर्च हटवायचा का?",

    // Account Alert
    account: "खाते",
    email: "ईमेल",
    role: "भूमिका",

    // LandingNavbar
    login: "लॉगिन",
    getStarted: "सुरुवात करा",

    // Landing Hero
    heroTag: "भारतातील ५ कोटी+ गिग वर्कर्ससाठी बनवले",
    heroHeadline1: "क्रेडिट इतिहास नाही?",
    heroHeadline2: "काळजी नको.",
    heroSubtitle1: "पारंपारिक बँका तुम्हाला नाकारतात. आम्ही तुम्हाला समजतो.",
    heroSubtitle2: "बँक स्टेटमेंट अपलोड करा → तत्काल क्रेडिट स्कोर मिळवा → ₹२ लाखांपर्यंत कर्ज मिळवा",
    heroCta1: "मोफत क्रेडिट स्कोर मिळवा",
    heroCta2: "हे कसे काम करते ते पहा",
    heroTrustLine: "✓ क्रेडिट कार्ड आवश्यक नाही  •  ✓ ५ मिनिटांपेक्षा कमी  •  ✓ १००% सुरक्षित",

    // Stats
    stat1Label: "क्रेडिटशिवाय गिग वर्कर्स",
    stat1Sub: "फक्त भारतात",
    stat2Label: "उपलब्ध क्रेडिट लाइन",
    stat2Sub: "तुमच्या स्कोरवर आधारित",
    stat3Label: "तत्काल मूल्यांकन",
    stat3Sub: "अपलोड करा आणि निकाल मिळवा",

    // How It Works
    howItWorksTitle: "हे कसे काम करते",
    howItWorksSubtitle: "४ सोप्या चरणांमध्ये पर्यायी क्रेडिट स्कोर मिळवा",
    step1Title: "साइन अप करा",
    step1Desc: "गिग वर्कर म्हणून तुमचे मोफत खाते तयार करा",
    step2Title: "स्टेटमेंट अपलोड करा",
    step2Desc: "तुमचे बँक स्टेटमेंट CSV सुरक्षितपणे अपलोड करा",
    step3Title: "तुमचा स्कोर मिळवा",
    step3Desc: "AI तुमच्या आर्थिक नमुन्यांचे त्वरित विश्लेषण करते",
    step4Title: "पात्रता तपासा",
    step4Desc: "तुमची पूर्व-मंजूर कर्जाची रक्कम पहा",

    // Trust Section
    trustTitle: "गिग वर्कर्स आमच्यावर का विश्वास ठेवतात",
    trustSubtitle: "गोपनीयता, निष्पक्षता आणि समावेशावर आधारित बनवले",
    trust1Title: "गिग वर्कर्ससाठी बनवले",
    trust1Desc: "पारंपारिक बँकांप्रमाणे नव्हे, आम्हाला डिलिव्हरी, राइड-हेलिंग आणि फ्रीलान्स कामातील अनियमित उत्पन्नाचे नमुने समजतात.",
    trust2Title: "गोपनीयता-प्रथम विश्लेषण",
    trust2Desc: "तुमचा डेटा एन्क्रिप्टेड आणि स्थानिक पातळीवर विश्लेषित केला जातो. आम्ही तुमची वैयक्तिक माहिती कधीही शेअर करत नाही.",
    trust3Title: "क्रेडिट इतिहास आवश्यक नाही",
    trust3Desc: "आम्ही आर्थिक वर्तन नमुन्यांचे मूल्यांकन करतो, CIBIL स्कोर किंवा पारंपारिक क्रेडिट इतिहासाचे नाही.",
    disclaimerLabel: "आम्ही कसे विश्लेषण करतो:",
    disclaimerText: "आमचे क्रेडिट मूल्यांकन उत्पन्न सातत्य, खर्च व्यवस्थापन आणि व्यवहार वारंवारता यासारख्या आर्थिक वर्तन नमुन्यांवर आधारित आहे. निकाल सूचक आहेत.",

    // Roadmap
    roadmapTitle: "भविष्यातील योजना: थेट प्लॅटफॉर्म एकत्रीकरण",
    roadmapDesc: "आम्ही Zomato, Swiggy, Uber, Ola सारख्या प्रमुख गिग प्लॅटफॉर्मशी थेट एकत्रीकरण करण्याची योजना आखत आहोत. यामुळे शक्य होईल:",
    roadmapBullet1: "तुमच्या स्पष्ट संमतीसह कमाई डेटामध्ये सुरक्षित प्रवेश",
    roadmapBullet2: "तुमच्या गिग क्रियाकलापांवर आधारित रिअल-टाइम क्रेडिट स्कोर अपडेट",
    roadmapBullet3: "मॅन्युअल अपलोडशिवाय स्वयंचलित क्रेडिट देखरेख",
    roadmapNote: "टीप: हे भविष्यातील आवृत्त्यांसाठी नियोजित वैशिष्ट्य आहे. सध्या, क्रेडिट स्कोरिंग केवळ बँक स्टेटमेंट अपलोडवर आधारित आहे.",

    // Features
    featuresTitle: "CreditFlow का निवडावे?",
    featuresSubtitle: "क्रेडिटमध्ये प्रवेश करण्यासाठी सर्व काही, गिग वर्कर्ससाठी डिझाइन केलेले",
    feature1Title: "तत्काल मंजुरी",
    feature1Desc: "५ मिनिटांपेक्षा कमी वेळात तुमचा क्रेडिट स्कोर आणि पात्रता निकाल मिळवा. कोणती प्रतीक्षा नाही, कागदपत्र नाही.",
    feature2Title: "बँक-दर्जाची सुरक्षा",
    feature2Desc: "तुमचा आर्थिक डेटा एंड-टू-एंड एन्क्रिप्टेड आहे. आम्ही उद्योग-मानक सुरक्षा प्रोटोकॉल वापरतो.",
    feature3Title: "तुमचा स्कोर सुधारा",
    feature3Desc: "कालांतराने तुमच्या आर्थिक आरोग्याचा मागोवा घ्या आणि तुमची पत वाढवण्यासाठी कृती करण्यायोग्य टिप्स मिळवा.",

    // Final CTA
    ctaTitle1: "हजारो गिग वर्कर्समध्ये सामील व्हा",
    ctaTitle2: "जे त्यांचे क्रेडिट भविष्य घडवत आहेत",
    ctaSubtitle1: "पारंपारिक क्रेडिट प्रणाली तुमच्यासाठी बनवली नव्हती. आम्ही बनवली आहे.",
    ctaSubtitle2: "तुम्ही गाडी चालवत असाल, डिलिव्हरी करत असाल किंवा फ्रीलान्स करत असाल — तुमचे उत्पन्न महत्त्वाचे आहे. तुमचे काम महत्त्वाचे आहे. तुमचे क्रेडिटही महत्त्वाचे असले पाहिजे.",
    ctaBtn1: "मोफत सुरुवात करा",
    ctaBtn2: "साइन इन करा",
    ctaTrust1: "१००% मोफत मूल्यांकन",
    ctaTrust2: "कोणतेही छुपे शुल्क नाही",
    ctaTrust3: "सुरक्षित आणि खाजगी",

    // Footer
    footerCopy: "© 2026 CreditFlow. गिग वर्कर्सना आर्थिक प्रवेशासह सक्षम करणे.",
    footerDemo: "शैक्षणिक उद्देशांसाठी डेमो प्रकल्प.",

    // Login Page
    loginWelcomeTitle: "परत स्वागत आहे",
    loginWelcomeSubtitle: "तुमचा डॅशबोर्ड ऍक्सेस करण्यासाठी लॉगिन करा",
    loginEmailLabel: "ईमेल पत्ता",
    loginEmailPlaceholder: "you@example.com",
    loginPasswordLabel: "पासवर्ड",
    loginPasswordPlaceholder: "पासवर्ड",
    loginButton: "लॉगिन",
    loginLoading: "लॉगिन होत आहे...",
    loginNoAccount: "खाते नाही?",
    loginSignUpLink: "मोफत साइन अप करा",
    loginBackHome: "होमवर परत जा",

    // Register Page
    registerTitle: "खाते तयार करा",
    registerSubtitle: "आजच तुमचा क्रेडिट प्रवास सुरू करा",
    registerFullNameLabel: "पूर्ण नाव",
    registerFullNamePlaceholder: "John Doe",
    registerEmailLabel: "ईमेल पत्ता",
    registerEmailPlaceholder: "you@example.com",
    registerPhoneLabel: "फोन नंबर",
    registerPhonePlaceholder: "+91 98765 43210",
    registerEmploymentLabel: "रोजगाराचा प्रकार",
    registerEmploymentDelivery: "डिलिव्हरी पार्टनर",
    registerEmploymentDriver: "ड्रायव्हर",
    registerEmploymentFreelancer: "फ्रीलान्सर",
    registerPasswordLabel: "पासवर्ड",
    registerConfirmPasswordLabel: "पासवर्ड पुष्टी करा",
    registerButton: "खाते तयार करा",
    registerLoading: "खाते तयार होत आहे...",
    registerPasswordMismatch: "पासवर्ड जुळत नाहीत",
    registerHaveAccount: "आधीच खाते आहे?",
    registerLoginLink: "येथे लॉगिन करा",
    registerBackHome: "होमवर परत जा",

    // Tax Summary Page
    taxPageTitle: "वार्षिक आर्थिक आणि कर सारांश",
    taxPageSubtitle: "नव्या करप्रणालीअंतर्गत आर्थिक वर्षासाठी अधिकृत अंदाज",
    taxDownloadPdf: "PDF डाउनलोड करा",
    taxDownloadPdfPreparing: "तयार होत आहे...",
    taxRetry: "पुन्हा प्रयत्न करा",
    taxDashboard: "डॅशबोर्ड",
    taxLabelGrossIncome: "एकूण उत्पन्न",
    taxLabelDeductible: "वजावट पात्र खर्च",
    taxLabelNetTaxable: "निव्वळ करपात्र उत्पन्न",
    taxLabelEstimatedTax: "अंदाजित कर",
    taxLabelEffectiveRate: "प्रभावी कर दर",
    taxSlabTitle: "कर स्लॅब तपशील",
    taxSlabSubtitle: "सरकार-निर्धारित स्लॅबमध्ये तपशीलवार कर गणना",
    taxAssessmentYear: "मूल्यांकन वर्ष",
    taxColSlabRange: "स्लॅब श्रेणी",
    taxColTaxableAmount: "करपात्र रक्कम",
    taxColTaxRate: "कर दर",
    taxColTaxAmount: "कर रक्कम",
    taxFinancialOverview: "आर्थिक आढावा",
    taxFinancialOverviewSubtitle: "तुमच्या सिंक केलेल्या आर्थिक सारांशातील मुख्य आकडेवारी",
    taxTotalIncome: "एकूण ट्रॅक केलेले उत्पन्न",
    taxTotalExpenses: "एकूण नोंदवलेले खर्च",
    taxSavingsRate: "बचत दर",
    taxDataRefreshed: "डेटा अद्ययावत केला",
    taxNotAvailable: "उपलब्ध नाही",
    taxAdvisory: "सल्ला",
    taxAdvisoryText: "हा अहवाल तुमच्या CreditFlow प्रोफाइलमध्ये सिंक केलेल्या सत्यापित उत्पन्न आणि खर्च डेटावरून तयार केला आहे. कृपया फाइलिंग पुष्टीकरण, अतिरिक्त वजावट आणि तुमच्या परिस्थितीनुसार घोषणांसाठी प्रमाणित कर व्यावसायिकाचा सल्ला घ्या.",
    taxGeneratedFor: "यासाठी तयार केले",
    taxNoData: "अद्याप कोणताही कर सारांश डेटा उपलब्ध नाही.",
    taxBackToDashboard: "डॅशबोर्डवर परत जा",
    taxPreparingMsg: "कर सारांश तयार होत आहे...",
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("appLanguage") || "en";
  });

  useEffect(() => {
    localStorage.setItem("appLanguage", language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations["en"][key] || key;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}