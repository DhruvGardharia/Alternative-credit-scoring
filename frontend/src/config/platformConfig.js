/**
 * Platform Configuration
 * Maps employment types to available platforms
 */

export const EMPLOYMENT_TYPES = {
  DELIVERY: "delivery",
  DRIVER: "driver", 
  FREELANCER: "freelancer",
  SERVICE_PROVIDER: "service_provider"
};

export const PLATFORM_CONFIG = {
  [EMPLOYMENT_TYPES.DELIVERY]: [
    { value: "swiggy", label: "Swiggy", icon: "🍔" },
    { value: "zomato", label: "Zomato", icon: "🍕" },
    { value: "zepto", label: "Zepto", icon: "⚡" },
    { value: "blinkit", label: "Blinkit", icon: "🛒" },
    { value: "dunzo", label: "Dunzo", icon: "📦" }
  ],
  
  [EMPLOYMENT_TYPES.DRIVER]: [
    { value: "uber", label: "Uber", icon: "🚗" },
    { value: "ola", label: "Ola", icon: "🚕" },
    { value: "rapido", label: "Rapido", icon: "🏍️" }
  ],
  
  [EMPLOYMENT_TYPES.FREELANCER]: [
    { value: "fiverr", label: "Fiverr", icon: "💼" },
    { value: "upwork", label: "Upwork", icon: "💻" },
    { value: "freelancer", label: "Freelancer", icon: "🌐" }
  ],
  
  [EMPLOYMENT_TYPES.SERVICE_PROVIDER]: [
    { value: "urbanCompany", label: "Urban Company", icon: "🔧" },
    { value: "meesho", label: "Meesho", icon: "🛍️" }
  ]
};

export const WORK_TYPES = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME"
};
