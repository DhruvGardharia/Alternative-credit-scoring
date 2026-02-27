# CreditFlow — Frontend Conventions
## Dark/Light Theme & Multilingual (i18n) System

> **Purpose of this document:** When creating any new frontend page or component for the CreditFlow project, give this file to the AI assistant first. It contains everything needed to correctly implement dark/light theme support and English / Hindi / Marathi translations — consistent with every existing page in the project.

---

## 1. Project Stack

- React (with hooks)
- React Router v6 (`useNavigate`, `Link`)
- Tailwind CSS (utility classes only — no custom CSS files)
- Axios for API calls
- Context API for global state (Auth, Theme, Language)

---

## 2. Theme System

### 2.1 How It Works

Theme state lives in `src/context/ThemeContext.jsx`. It exposes:

| Export | Type | Description |
|---|---|---|
| `ThemeProvider` | Component | Wraps the whole app in `main.jsx` / `App.jsx` |
| `useTheme()` | Hook | Returns `{ isDark, toggleTheme }` |

- `isDark` — `boolean`. `true` = dark mode, `false` = light mode.
- `toggleTheme` — function. Flips the theme and persists it to `localStorage` under the key `"theme"`.
- Theme is read from `localStorage` on first load, so it survives page refresh.

### 2.2 How to Use in a New Component

```jsx
import { useTheme } from "../context/ThemeContext";

export default function MyPage() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
      ...
    </div>
  );
}
```

The `toggleTheme` function is only needed if the component itself contains a theme-toggle button (e.g. a Navbar). Regular pages only need `isDark`.

### 2.3 Tailwind Dark/Light Class Patterns

Every element that has a visible background, text colour, or border must have both a light and a dark class. Always use the ternary pattern:

```jsx
className={`... ${isDark ? "dark-classes" : "light-classes"}`}
```

**Standard colour mappings used across the project:**

| Element | Light mode | Dark mode |
|---|---|---|
| Page background | `bg-gray-50` | `bg-gray-950` |
| Card / panel background | `bg-white` | `bg-gray-900` |
| Nested card (inside dark panel) | `bg-gray-100` | `bg-gray-800` |
| Primary heading text | `text-gray-900` | `text-white` |
| Secondary / label text | `text-gray-600` | `text-gray-400` |
| Muted / hint text | `text-gray-500` | `text-gray-500` |
| Brand heading text | `text-blue-900` | `text-blue-400` |
| Card border | `border-gray-200` | `border-gray-700` |
| Table header bg | `bg-gray-50` | `bg-gray-800` |
| Table row divider | `divide-gray-200` | `divide-gray-700` |
| Table row hover | `hover:bg-gray-50` | `hover:bg-gray-800` |
| Input field | `bg-white border-blue-200 text-gray-700` | `bg-gray-800 border-blue-800 text-gray-300` |
| Input focus | `focus:border-blue-900` | `focus:border-blue-500` |
| Error banner | `bg-red-50 border-red-200 text-red-700` | `bg-red-900/30 border-red-800 text-red-400` |
| Info banner | `bg-indigo-50 border-indigo-200` | `bg-indigo-950/40 border-indigo-800` |
| Warning banner | `bg-yellow-50 border-yellow-500` | `bg-yellow-900/20 border-yellow-500` |
| Success banner | `bg-green-50 border-green-500` | `bg-green-900/20 border-green-500` |
| Loading spinner | `border-blue-200 border-t-blue-600` | `border-blue-800 border-t-blue-400` |
| Modal overlay | `bg-black bg-opacity-50` | (same — overlays don't change) |
| Modal panel | `bg-white` | `bg-gray-900` |

**Fixed-colour elements (never change with theme):**
- The `<Navbar />` and `<LandingNavbar />` backgrounds — always `bg-blue-900`
- Yellow CTA buttons — always `bg-yellow-400 hover:bg-yellow-500 text-blue-900`
- Primary action buttons — always `bg-blue-900 hover:bg-blue-800 text-white`
- Logout button — always `bg-red-600 hover:bg-red-700 text-white`
- Gradient hero/CTA banners — always the blue-to-indigo gradient

### 2.4 Transitions

Always add `transition-colors duration-300` to the outermost wrapper of any page or panel so theme switching animates smoothly:

```jsx
<div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
```

---

## 3. Language / i18n System

### 3.1 How It Works

Language state lives in `src/context/LanguageContext.jsx`. It exposes:

| Export | Type | Description |
|---|---|---|
| `LanguageProvider` | Component | Wraps the whole app in `main.jsx` / `App.jsx` |
| `useLanguage()` | Hook | Returns `{ language, changeLanguage, t }` |

- `language` — `string`. Current language code: `"en"`, `"hi"`, or `"mr"`.
- `changeLanguage(code)` — function. Changes active language and persists to `localStorage` under the key `"appLanguage"`.
- `t(key)` — function. Looks up a translation string by key. Falls back to English if a key is missing in the active language, then falls back to the raw key string if not found at all.
- Language persists across page refreshes and across all pages simultaneously.

### 3.2 Supported Languages

| Code | Language | Script |
|---|---|---|
| `en` | English | Latin |
| `hi` | Hindi | Devanagari |
| `mr` | Marathi | Devanagari |

### 3.3 How to Use `t()` in a New Component

```jsx
import { useLanguage } from "../context/LanguageContext";

export default function MyPage() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t("myPageTitle")}</h1>
      <p>{t("myPageSubtitle")}</p>
      <button>{t("myPageButton")}</button>
    </div>
  );
}
```

**Rules:**
1. **Every visible user-facing string must go through `t()`** — no hardcoded English text in JSX.
2. **Placeholders in inputs** also use `t()`: `placeholder={t("myFieldPlaceholder")}`.
3. **`aria-label` attributes** also use `t()`.
4. **Alert / confirm messages** also use `t()`: `alert(t("myErrorMessage"))`, `confirm(t("deleteConfirm"))`.
5. **Proper nouns that never translate** (e.g. "CreditFlow", "UPI", "CSV", "CIBIL", currency symbols like "₹") are kept as hardcoded literals — do NOT wrap them in `t()`.
6. Dynamic values like user names, numbers, and amounts are interpolated outside the `t()` call:
   ```jsx
   // Correct
   <h2>{t("welcomeBack")}, {user?.name}!</h2>

   // Wrong — don't put dynamic data inside translation keys
   <h2>{t("welcomeBackWithName")}</h2>
   ```

### 3.4 Adding New Translation Keys

When creating a new page, you must add its keys to **all three language objects** in `LanguageContext.jsx`. The file is at `src/context/LanguageContext.jsx`.

**Structure of the file:**

```js
const translations = {
  en: {
    // ... all existing English keys ...

    // My New Page
    myPageTitle: "My Page Title",
    myPageSubtitle: "Subtitle text here",
    myPageButton: "Click Me",
  },

  hi: {
    // ... all existing Hindi keys ...

    // My New Page
    myPageTitle: "मेरे पेज का शीर्षक",
    myPageSubtitle: "उपशीर्षक पाठ",
    myPageButton: "क्लिक करें",
  },

  mr: {
    // ... all existing Marathi keys ...

    // My New Page
    myPageTitle: "माझ्या पेजचे शीर्षक",
    myPageSubtitle: "उपशीर्षक मजकूर",
    myPageButton: "क्लिक करा",
  },
};
```

**Key naming convention:**

| Pattern | Usage |
|---|---|
| `pageName` prefix | Keys scoped to a specific page, e.g. `taxPageTitle`, `loginButton` |
| No prefix | Keys shared across multiple pages/components, e.g. `cancel`, `logout`, `welcome` |
| `Label` suffix | Form field labels, e.g. `loginEmailLabel` |
| `Placeholder` suffix | Input placeholder text, e.g. `loginEmailPlaceholder` |
| `Title` suffix | Section or card headings |
| `Desc` / `Detail` / `Text` suffix | Body copy / description paragraphs |
| `Btn` / `Button` suffix | Button labels |
| `Loading` suffix | In-progress button states, e.g. `loginLoading` |

### 3.5 Language Switcher UI

The language dropdown is already built into both `<Navbar />` and `<LandingNavbar />`. **New pages do not need to build their own language switcher.** Simply use the appropriate Navbar component and the dropdown appears automatically.

- **Authenticated pages** (after login) → use `<Navbar />` from `src/components/Navbar.jsx`
- **Public pages** (landing, login, register) → use `<LandingNavbar />` from `src/components/LandingNavbar.jsx`

The dropdown shows: `EN` / `HI` / `MR` with a globe icon and a checkmark on the active language. It closes on outside click via a transparent backdrop div.

---

## 4. App-Level Provider Setup

Both providers are already wired up in `main.jsx` (or `App.jsx`). You do not need to add them again. For reference, the structure is:

```jsx
// main.jsx
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";

<ThemeProvider>
  <LanguageProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </LanguageProvider>
</ThemeProvider>
```

---

## 5. Complete New Page Checklist

Use this checklist every time you create a new `.jsx` page:

- [ ] Import `useTheme` and destructure `isDark`
- [ ] Import `useLanguage` and destructure `t`
- [ ] Outermost `<div>` has `transition-colors duration-300` and `isDark` background class
- [ ] Every text element has both a light and dark text class via `isDark` ternary
- [ ] Every card/panel has both a light and dark background class
- [ ] Every input/select has both a light and dark styling class
- [ ] No hardcoded English strings in JSX (except proper nouns)
- [ ] All new translation keys added to `en`, `hi`, and `mr` blocks in `LanguageContext.jsx`
- [ ] Key naming follows the conventions in section 3.4
- [ ] Uses `<Navbar />` (authenticated) or `<LandingNavbar />` (public) — not a custom inline nav
- [ ] Loading spinner uses `isDark` colour classes
- [ ] Error banners use `isDark` colour classes

---

## 6. Quick Reference — Existing Translation Key Groups

These key groups already exist in `LanguageContext.jsx`. Reuse them instead of creating duplicates:

| Group | Sample Keys |
|---|---|
| **Navbar** | `welcome`, `logout`, `switchToLight`, `switchToDark` |
| **Quick Actions** | `uploadStatement`, `viewCreditReport`, `learningCenter`, `myAccount` |
| **Welcome Banner** | `welcomeBack`, `welcomeSubtitle`, `didYouKnow`, `proTip`, `yourGoal`, `calculateMyScore` |
| **Upload Form** | `uploadBankStatement`, `uploadSubtitle`, `analyzeNow`, `analyzing`, `pleaseSelectCSV` |
| **Financial Health** | `financialHealth`, `creditReadiness`, `riskAssessment`, `excellent`, `stable`, `needsAttention` |
| **Risk Levels** | `low`, `medium`, `high`, `notEvaluated` |
| **Smart Insights** | `smartFinancialInsights`, `getCreditScore`, `securePrivate`, `designedForGig` |
| **Actions** | `recommendedActions`, `priority`, `uploadNow`, `trackExpenses`, `addExpense`, `viewAnalysis` |
| **Stats** | `totalExpenses`, `transactions`, `dailyAverage`, `savingsGoal`, `saved`, `clickToEditGoal` |
| **Expense Form** | `category`, `amount`, `date`, `paymentMethod`, `description`, `addExpenseSubmit` |
| **Expense List** | `noExpensesYet`, `noExpensesSubtitle`, `addFirstExpense`, `loadSampleData`, `noDescription`, `deleteExpenseConfirm` |
| **Savings Goal Modal** | `editSavingsGoal`, `monthlyTarget`, `savingsGoalInfo`, `cancel`, `saveGoal` |
| **Landing Hero** | `heroTag`, `heroHeadline1`, `heroHeadline2`, `heroCta1`, `heroCta2`, `heroTrustLine` |
| **Landing Steps** | `howItWorksTitle`, `step1Title`–`step4Title`, `step1Desc`–`step4Desc` |
| **Trust Section** | `trustTitle`, `trust1Title`–`trust3Title`, `disclaimerLabel`, `disclaimerText` |
| **Features** | `featuresTitle`, `feature1Title`–`feature3Title` |
| **CTA / Footer** | `ctaBtn1`, `ctaBtn2`, `footerCopy`, `footerDemo` |
| **LandingNavbar** | `login`, `getStarted` |
| **Login Page** | `loginWelcomeTitle`, `loginWelcomeSubtitle`, `loginEmailLabel`, `loginButton`, `loginLoading`, `loginNoAccount`, `loginSignUpLink` |
| **Register Page** | `registerTitle`, `registerSubtitle`, `registerFullNameLabel`, `registerEmploymentDelivery`, `registerButton`, `registerLoading`, `registerPasswordMismatch`, `registerHaveAccount` |
| **Tax Summary** | `taxPageTitle`, `taxPageSubtitle`, `taxDownloadPdf`, `taxSlabTitle`, `taxColSlabRange`, `taxColTaxableAmount`, `taxColTaxRate`, `taxColTaxAmount`, `taxFinancialOverview`, `taxAdvisory`, `taxAdvisoryText`, `taxNoData`, `taxBackToDashboard`, `taxPreparingMsg` |

---

## 7. Minimal Working Example

Below is a minimal new page that correctly implements both systems from scratch:

```jsx
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import Navbar from "../components/Navbar"; // or LandingNavbar for public pages

export default function MyNewPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Page heading */}
        <h1 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
          {t("myNewPageTitle")}
        </h1>
        <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          {t("myNewPageSubtitle")}
        </p>

        {/* Card */}
        <div className={`rounded-xl shadow-md p-6 border ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>

          {/* Input */}
          <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            {t("myNewPageFieldLabel")}
          </label>
          <input
            type="text"
            placeholder={t("myNewPageFieldPlaceholder")}
            className={`w-full px-3 py-2 border-2 rounded-lg text-sm focus:outline-none ${
              isDark
                ? "bg-gray-800 border-blue-800 text-gray-300 focus:border-blue-500"
                : "border-blue-200 text-gray-700 focus:border-blue-900"
            }`}
          />

          {/* Action button */}
          <button className="mt-4 px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium text-sm transition">
            {t("myNewPageButton")}
          </button>
        </div>

      </div>
    </div>
  );
}
```

**Required addition to `LanguageContext.jsx`** for the above example:

```js
// In en: { ... }
myNewPageTitle: "My New Page",
myNewPageSubtitle: "Description of what this page does.",
myNewPageFieldLabel: "Enter Value",
myNewPageFieldPlaceholder: "Type here...",
myNewPageButton: "Submit",

// In hi: { ... }
myNewPageTitle: "मेरा नया पेज",
myNewPageSubtitle: "इस पेज के बारे में विवरण।",
myNewPageFieldLabel: "मान दर्ज करें",
myNewPageFieldPlaceholder: "यहां टाइप करें...",
myNewPageButton: "जमा करें",

// In mr: { ... }
myNewPageTitle: "माझे नवीन पेज",
myNewPageSubtitle: "या पेजबद्दल वर्णन.",
myNewPageFieldLabel: "मूल्य प्रविष्ट करा",
myNewPageFieldPlaceholder: "येथे टाइप करा...",
myNewPageButton: "सबमिट करा",
```

---

## 8. What NOT to Do

| ❌ Wrong | ✅ Correct |
|---|---|
| `<h1>My Page Title</h1>` | `<h1>{t("myPageTitle")}</h1>` |
| `className="bg-white text-gray-900"` | `className={isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"}` |
| `placeholder="Enter value"` | `placeholder={t("myFieldPlaceholder")}` |
| `confirm("Delete this?")` | `confirm(t("deleteExpenseConfirm"))` |
| Building a custom inline `<nav>` | Use `<Navbar />` or `<LandingNavbar />` |
| Adding keys only to `en` block | Add to `en`, `hi`, **and** `mr` |
| `t("welcomeBack") + ", " + user.name` | `{t("welcomeBack")}, {user?.name}` (interpolate in JSX) |
| Wrapping "₹", "UPI", "CreditFlow" in `t()` | Leave them as hardcoded literals |
| `className={isDark && "bg-gray-900"}` | Always provide both dark and light values |
