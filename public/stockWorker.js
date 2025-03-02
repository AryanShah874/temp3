/// <reference lib="webworker" />
self.addEventListener("install", function (event) {
    self.skipWaiting();
    console.log("Stock Service Worker installed");
});
self.addEventListener("activate", function (event) {
    console.log("Stock Service Worker activated");
    return self.clients.claim();
});
// Function to find the best buy/sell days for maximum profit
function findMaxProfit(prices, days) {
    var maxProfit = 0;
    var bestBuyDay = "";
    var bestSellDay = "";
    var bestBuyPrice = 0;
    var bestSellPrice = 0;
    for (var buyDayIndex = 0; buyDayIndex < days.length - 1; buyDayIndex++) {
        var buyDay = days[buyDayIndex];
        console.log("Buy Day Index:", buyDayIndex, "Buy Day:", buyDay);
        // Find the minimum price on this buy day
        var buyDayPrices = prices[buyDay];
        var minBuyPrice = Math.min.apply(Math, buyDayPrices);
        console.log("Buy Day:", buyDay, "Min Buy Price:", minBuyPrice, "buyDayPrices:", buyDayPrices);
        // For each possible sell day after the buy day
        for (var sellDayIndex = buyDayIndex + 1; sellDayIndex < days.length; sellDayIndex++) {
            var sellDay = days[sellDayIndex];
            // Find the maximum price on this sell day
            var sellDayPrices = prices[sellDay];
            var maxSellPrice = Math.max.apply(Math, sellDayPrices);
            // Calculate profit
            var profit = maxSellPrice - minBuyPrice;
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
self.addEventListener("message", function (event) {
    if (event.data.type === "PROCESS_STOCKS") {
        var stockData = event.data.data;
        var results_1 = [];
        console.log("Processing stock data:", stockData);
        stockData.forEach(function (companyData) {
            var company = companyData.company, data = companyData.data;
            var prices = {};
            var days = [];
            // Extract prices and days from the data
            data.forEach(function (dayData) {
                var date = dayData.date, dayPrices = dayData.prices;
                prices[date] = dayPrices;
                days.push(date);
            });
            // Sort days safely
            days.sort(function (a, b) { return new Date(a).getTime() - new Date(b).getTime(); });
            console.log("Processing:", company, prices, days);
            // Find the best buy/sell days for maximum profit
            var result = findMaxProfit(prices, days);
            result.company = company;
            results_1.push(result);
        });
        // Send results back to the main thread
        self.clients.matchAll().then(function (clients) {
            clients.forEach(function (client) {
                client.postMessage({
                    type: "STOCK_RESULTS",
                    results: results_1,
                });
            });
        });
    }
});
