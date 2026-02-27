/**
 * Platform Mock Data Generator
 * Generates realistic earnings data for different gig platforms
 */

// Generate random number within range
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

// Generate dates for last N days
const generateDates = (days = 60) => {
  const dates = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.setDate(date.getDate() - i));
    dates.push(date);
  }
  return dates;
};

// UBER Mock
export const generateUberData = (workType = "FULL_TIME", days = 60) => {
  const dates = generateDates(days);
  const earnings = [];

  dates.forEach(date => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const workingDay = workType === "FULL_TIME" ? random(1, 10) > 1 : random(1, 10) > 4;

    if (workingDay) {
      const trips = workType === "FULL_TIME" ? random(8, 15) : random(3, 7);
      const baseFare = parseFloat((trips * randomFloat(80, 250)).toFixed(2));
      const surge = isWeekend ? parseFloat((baseFare * 0.3).toFixed(2)) : parseFloat((baseFare * 0.1).toFixed(2));
      const incentives = trips > 10 ? parseFloat(randomFloat(200, 500)) : 0;
      const platformFee = parseFloat((baseFare * 0.2).toFixed(2));
      const netEarnings = parseFloat((baseFare + surge + incentives - platformFee).toFixed(2));

      earnings.push({
        date,
        platform: "uber",
        tripsCompleted: trips,
        baseFare,
        surge,
        incentives,
        platformFee,
        netEarnings
      });
    }
  });

  return earnings;
};

// OLA Mock
export const generateOlaData = (workType = "FULL_TIME", days = 60) => {
  const dates = generateDates(days);
  const earnings = [];

  dates.forEach(date => {
    const workingDay = workType === "FULL_TIME" ? random(1, 10) > 1 : random(1, 10) > 4;

    if (workingDay) {
      const trips = workType === "FULL_TIME" ? random(7, 14) : random(3, 6);
      const baseFare = parseFloat((trips * randomFloat(75, 220)).toFixed(2));
      const incentives = trips > 12 ? parseFloat(randomFloat(150, 400)) : 0;
      const platformFee = parseFloat((baseFare * 0.18).toFixed(2));
      const netEarnings = parseFloat((baseFare + incentives - platformFee).toFixed(2));

      earnings.push({
        date,
        platform: "ola",
        tripsCompleted: trips,
        baseFare,
        incentives,
        platformFee,
        netEarnings
      });
    }
  });

  return earnings;
};

// RAPIDO Mock
export const generateRapidoData = (workType = "FULL_TIME", days = 60) => {
  const dates = generateDates(days);
  const earnings = [];

  dates.forEach(date => {
    const workingDay = workType === "FULL_TIME" ? random(1, 10) > 2 : random(1, 10) > 5;

    if (workingDay) {
      const trips = workType === "FULL_TIME" ? random(10, 20) : random(4, 10);
      const baseFare = parseFloat((trips * randomFloat(40, 80)).toFixed(2));
      const platformFee = parseFloat((baseFare * 0.15).toFixed(2));
      const netEarnings = parseFloat((baseFare - platformFee).toFixed(2));

      earnings.push({
        date,
        platform: "rapido",
        tripsCompleted: trips,
        baseFare,
        platformFee,
        netEarnings
      });
    }
  });

  return earnings;
};

// SWIGGY Mock
export const generateSwiggyData = (workType = "FULL_TIME", days = 60) => {
  const dates = generateDates(days);
  const earnings = [];

  dates.forEach(date => {
    const workingDay = workType === "FULL_TIME" ? random(1, 10) > 1 : random(1, 10) > 4;

    if (workingDay) {
      const deliveries = workType === "FULL_TIME" ? random(10, 18) : random(4, 9);
      const perDeliveryRate = parseFloat(randomFloat(25, 45));
      const baseFare = parseFloat((deliveries * perDeliveryRate).toFixed(2));
      const peakHourBonus = deliveries > 12 ? parseFloat(randomFloat(100, 300)) : 0;
      const platformFee = parseFloat((baseFare * 0.10).toFixed(2));
      const netEarnings = parseFloat((baseFare + peakHourBonus - platformFee).toFixed(2));

      earnings.push({
        date,
        platform: "swiggy",
        deliveriesCompleted: deliveries,
        baseFare,
        peakHourBonus,
        platformFee,
        netEarnings
      });
    }
  });

  return earnings;
};

// ZOMATO Mock
export const generateZomatoData = (workType = "FULL_TIME", days = 60) => {
  const dates = generateDates(days);
  const earnings = [];

  dates.forEach(date => {
    const workingDay = workType === "FULL_TIME" ? random(1, 10) > 1 : random(1, 10) > 4;

    if (workingDay) {
      const deliveries = workType === "FULL_TIME" ? random(9, 16) : random(3, 8);
      const baseFare = parseFloat((deliveries * randomFloat(28, 50)).toFixed(2));
      const incentives = deliveries > 14 ? parseFloat(randomFloat(150, 350)) : 0;
      const platformFee = parseFloat((baseFare * 0.12).toFixed(2));
      const netEarnings = parseFloat((baseFare + incentives - platformFee).toFixed(2));

      earnings.push({
        date,
        platform: "zomato",
        deliveriesCompleted: deliveries,
        baseFare,
        incentives,
        platformFee,
        netEarnings
      });
    }
  });

  return earnings;
};

// ZEPTO/BLINKIT/DUNZO (Quick Commerce) Mock
export const generateQuickCommerceData = (platform, workType = "FULL_TIME", days = 60) => {
  const dates = generateDates(days);
  const earnings = [];

  dates.forEach(date => {
    const workingDay = workType === "FULL_TIME" ? random(1, 10) > 2 : random(1, 10) > 5;

    if (workingDay) {
      const deliveries = workType === "FULL_TIME" ? random(12, 22) : random(5, 12);
      const baseFare = parseFloat((deliveries * randomFloat(15, 30)).toFixed(2));
      const platformFee = parseFloat((baseFare * 0.08).toFixed(2));
      const netEarnings = parseFloat((baseFare - platformFee).toFixed(2));

      earnings.push({
        date,
        platform,
        deliveriesCompleted: deliveries,
        baseFare,
        platformFee,
        netEarnings
      });
    }
  });

  return earnings;
};

// FREELANCE (Fiverr, Upwork, Freelancer) Mock
export const generateFreelanceData = (platform, workType = "FULL_TIME", days = 60) => {
  const earnings = [];
  const dates = generateDates(days);

  // Freelance has irregular payments (project-based)
  const projectFrequency = workType === "FULL_TIME" ? 8 : 15; // Projects every N days

  dates.forEach((date, index) => {
    if (index % projectFrequency === 0 && index !== 0) {
      const projectAmount = parseFloat(randomFloat(2000, 15000));
      const platformFee = parseFloat((projectAmount * 0.20).toFixed(2));
      const netEarnings = parseFloat((projectAmount - platformFee).toFixed(2));

      earnings.push({
        date,
        platform,
        projectsCompleted: 1,
        projectAmount,
        platformFee,
        netEarnings
      });
    }
  });

  return earnings;
};

// URBAN COMPANY / MEESHO Mock
export const generateServiceData = (platform, workType = "FULL_TIME", days = 60) => {
  const dates = generateDates(days);
  const earnings = [];

  dates.forEach(date => {
    const workingDay = workType === "FULL_TIME" ? random(1, 10) > 2 : random(1, 10) > 5;

    if (workingDay) {
      const jobs = workType === "FULL_TIME" ? random(3, 8) : random(1, 4);
      const baseFare = parseFloat((jobs * randomFloat(200, 800)).toFixed(2));
      const platformFee = parseFloat((baseFare * 0.15).toFixed(2));
      const netEarnings = parseFloat((baseFare - platformFee).toFixed(2));

      earnings.push({
        date,
        platform,
        jobsCompleted: jobs,
        baseFare,
        platformFee,
        netEarnings
      });
    }
  });

  return earnings;
};
