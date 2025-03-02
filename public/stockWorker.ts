/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", (event: ExtendableEvent) => {
  self.skipWaiting();
  console.log("Stock Service Worker installed");
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  console.log("Stock Service Worker activated");
  return self.clients.claim();
});

interface StockData {
  [date: string]: number[];
}

interface StockResult {
  company: string;
  buyDay: string;
  buyPrice: number;
  sellDay: string;
  sellPrice: number;
  profit: number;
}

interface CompanyStockData {
  company: string;
  data: { date: string; prices: number[] }[];
}

// Function to find the best buy/sell days for maximum profit
function findMaxProfit(prices: StockData, days: string[]): StockResult {
  let maxProfit = 0;
  let bestBuyDay = "";
  let bestSellDay = "";
  let bestBuyPrice = 0;
  let bestSellPrice = 0;

  for (let buyDayIndex = 0; buyDayIndex < days.length - 1; buyDayIndex++) {
    const buyDay = days[buyDayIndex];
    console.log("Buy Day Index:", buyDayIndex, "Buy Day:", buyDay);

    // Find the minimum price on this buy day
    const buyDayPrices = prices[buyDay];
    const minBuyPrice = Math.min(...buyDayPrices);
    console.log("Buy Day:", buyDay, "Min Buy Price:", minBuyPrice, "buyDayPrices:", buyDayPrices);

    // For each possible sell day after the buy day
    for (let sellDayIndex = buyDayIndex + 1; sellDayIndex < days.length; sellDayIndex++) {
      const sellDay = days[sellDayIndex];

      // Find the maximum price on this sell day
      const sellDayPrices = prices[sellDay];
      const maxSellPrice = Math.max(...sellDayPrices);

      // Calculate profit
      const profit = maxSellPrice - minBuyPrice;

      // Update if this is the best profit so far
      if (profit > maxProfit) {
        maxProfit = profit;
        bestBuyDay = buyDay;
        bestSellDay = sellDay;
        bestBuyPrice = minBuyPrice;
        bestSellPrice = maxSellPrice;
      }
    }
  }

  console.log("Best Buy Day:", bestBuyDay, "Best Sell Day:", bestSellDay, "Profit:", maxProfit);
  console.log("Best Buy Price:", bestBuyPrice, "Best Sell Price:", bestSellPrice);

  return {
    company: "",
    buyDay: bestBuyDay,
    buyPrice: bestBuyPrice,
    sellDay: bestSellDay,
    sellPrice: bestSellPrice,
    profit: maxProfit,
  };
}

// Handle messages from the main thread
self.addEventListener("message", (event: MessageEvent) => {
  if (event.data.type === "PROCESS_STOCKS") {
    const stockData: CompanyStockData[] = event.data.data;
    const results: StockResult[] = [];
    console.log("Processing stock data:", stockData);

    stockData.forEach((companyData) => {
      const { company, data } = companyData;
      const prices: StockData = {};
      const days: string[] = [];

      // Extract prices and days from the data
      data.forEach((dayData) => {
        const { date, prices: dayPrices } = dayData;
        prices[date] = dayPrices;
        days.push(date);
      });

      // Sort days safely
      days.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      console.log("Processing:", company, prices, days);

      // Find the best buy/sell days for maximum profit
      const result = findMaxProfit(prices, days);
      result.company = company;

      results.push(result);
    });

    // Send results back to the main thread
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "STOCK_RESULTS",
          results: results,
        });
      });
    });
  }
});