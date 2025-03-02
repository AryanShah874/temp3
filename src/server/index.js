const http = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

// Create HTTP server
const server = http.createServer();
const wss = new WebSocketServer({ server });

// Store active connections by stock room
const stockRooms = {};
// Store user names
const userNames = {};
// Store user balances and holdings
const userWallets = {};
// Store stock prices
const stockPrices = {};

// Generate a random name for users
const generateRandomName = () => {
  const names = [
    'Sayan', 'Aakash', 'Amey', 'Rahul', 'Priya', 
    'Neha', 'Vikram', 'Anjali', 'Rohan', 'Kavita',
    'Arjun', 'Divya', 'Karan', 'Meera', 'Rajiv'
  ];
  return names[Math.floor(Math.random() * names.length)];
};

// Generate a random wallet balance between 10000 and 50000
const generateRandomBalance = () => {
  return Math.floor(Math.random() * 40000) + 10000;
};

// Handle WebSocket connections
wss.on('connection', (ws) => {
  const userId = uuidv4();
  const userName = generateRandomName();
  
  // Initialize user data
  userNames[userId] = userName;
  userWallets[userId] = {
    balance: generateRandomBalance(),
    holdings: {}
  };
  
  console.log(`User ${userName} (${userId}) connected`);
  
  // Send initial user data to client
  ws.send(JSON.stringify({
    type: 'USER_INFO',
    userId,
    userName,
    wallet: userWallets[userId]
  }));
  
  // Handle messages from clients
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'JOIN_STOCK_ROOM':
          handleJoinStockRoom(ws, userId, data.stockName);
          break;
        
        case 'LEAVE_STOCK_ROOM':
          handleLeaveStockRoom(ws, userId, data.stockName);
          break;
        
        case 'TRANSACTION':
          handleTransaction(ws, userId, data.transaction);
          break;
          
        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    // Remove user from all stock rooms
    Object.keys(stockRooms).forEach(stockName => {
      if (stockRooms[stockName] && stockRooms[stockName][userId]) {
        delete stockRooms[stockName][userId];
      }
    });
    
    // Clean up user data
    delete userNames[userId];
    delete userWallets[userId];
    
    console.log(`User ${userName} (${userId}) disconnected`);
  });
});

// Handle joining a stock room
function handleJoinStockRoom(ws, userId, stockName) {
  // Initialize stock room if it doesn't exist
  if (!stockRooms[stockName]) {
    stockRooms[stockName] = {};
    // Initialize stock price if it doesn't exist
    if (!stockPrices[stockName]) {
      // Get base price from somewhere or use a default
      stockPrices[stockName] = {
        basePrice: 500, // Default base price
        currentPrice: 500,
        history: []
      };
    }
    
    // Start price fluctuation for this stock
    startPriceFluctuation(stockName);
  }
  
  // Add user to stock room
  stockRooms[stockName][userId] = ws;
  
  console.log(`User ${userNames[userId]} joined room: ${stockName}`);
  
  // Send current stock price to the user
  ws.send(JSON.stringify({
    type: 'STOCK_PRICE',
    stockName,
    price: stockPrices[stockName].currentPrice,
    history: stockPrices[stockName].history
  }));
  
  // Broadcast join notification to all users in the room
  broadcastToRoom(stockName, {
    type: 'NOTIFICATION',
    message: `${userNames[userId]} joined the room`,
    timestamp: new Date().toISOString()
  }, userId);
}

// Handle leaving a stock room
function handleLeaveStockRoom(ws, userId, stockName) {
  if (stockRooms[stockName] && stockRooms[stockName][userId]) {
    delete stockRooms[stockName][userId];
    
    console.log(`User ${userNames[userId]} left room: ${stockName}`);
    
    // Broadcast leave notification to all users in the room
    broadcastToRoom(stockName, {
      type: 'NOTIFICATION',
      message: `${userNames[userId]} left the room`,
      timestamp: new Date().toISOString()
    }, userId);
    
    // If room is empty, stop price fluctuation
    if (Object.keys(stockRooms[stockName]).length === 0) {
      stopPriceFluctuation(stockName);
    }
  }
}

// Handle transaction
function handleTransaction(ws, userId, transaction) {
  const { stock_name, stock_symbol, transaction_price, quantity, action } = transaction;
  const userName = userNames[userId];
  const wallet = userWallets[userId];
  
  let status = 'Failed';
  let failureReason = '';
  
  // Process transaction based on action (buy/sell)
  if (action === 'buy') {
    const totalCost = transaction_price * quantity;
    
    // Check if user has enough balance
    if (wallet.balance >= totalCost) {
      // Update wallet balance
      wallet.balance -= totalCost;
      
      // Update holdings
      if (!wallet.holdings[stock_name]) {
        wallet.holdings[stock_name] = 0;
      }
      wallet.holdings[stock_name] += quantity;
      
      status = 'Passed';
    } else {
      failureReason = 'Insufficient balance';
    }
  } else if (action === 'sell') {
    // Check if user has enough stocks to sell
    if (wallet.holdings[stock_name] && wallet.holdings[stock_name] >= quantity) {
      // Update holdings
      wallet.holdings[stock_name] -= quantity;
      
      // Update wallet balance
      wallet.balance += transaction_price * quantity;
      
      status = 'Passed';
    } else {
      failureReason = 'Insufficient stocks';
    }
  }
  
  // Create transaction record
  const transactionRecord = {
    stock_name,
    stock_symbol,
    transaction_price,
    quantity,
    action,
    timestamp: new Date().toISOString(),
    status,
    user: userName
  };
  
  // Send transaction result to the user
  ws.send(JSON.stringify({
    type: 'TRANSACTION_RESULT',
    transaction: transactionRecord,
    wallet: wallet,
    failureReason
  }));
  
  // If transaction was successful, broadcast to all users in the room
  if (status === 'Passed') {
    broadcastToRoom(stock_name, {
      type: 'LIVE_TRANSACTION',
      transaction: transactionRecord
    });
  }
}

// Broadcast message to all users in a room
function broadcastToRoom(stockName, message, excludeUserId = null) {
  if (stockRooms[stockName]) {
    Object.entries(stockRooms[stockName]).forEach(([userId, ws]) => {
      if (!excludeUserId || userId !== excludeUserId) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

// Start price fluctuation for a stock
const priceFluctuationIntervals = {};

function startPriceFluctuation(stockName) {
  if (priceFluctuationIntervals[stockName]) {
    return; // Already running
  }
  
  priceFluctuationIntervals[stockName] = setInterval(() => {
    // Generate random price change between -500 and 500
    const priceChange = Math.floor(Math.random() * 1001) - 500;
    const previousPrice = stockPrices[stockName].currentPrice;
    const newPrice = Math.max(1, previousPrice + priceChange); // Ensure price is at least 1
    
    // Update stock price
    stockPrices[stockName].currentPrice = newPrice;
    
    // Add to price history
    stockPrices[stockName].history.push({
      price: newPrice,
      timestamp: new Date().toISOString()
    });
    
    // Keep only the last 100 price points
    if (stockPrices[stockName].history.length > 100) {
      stockPrices[stockName].history.shift();
    }
    
    // Broadcast price update to all users in the room
    broadcastToRoom(stockName, {
      type: 'STOCK_PRICE_UPDATE',
      stockName,
      previousPrice,
      currentPrice: newPrice,
      change: priceChange,
      percentChange: ((newPrice - previousPrice) / previousPrice) * 100,
      timestamp: new Date().toISOString()
    });
  }, 5000); // Update every 5 seconds
  
  console.log(`Started price fluctuation for ${stockName}`);
}

// Stop price fluctuation for a stock
function stopPriceFluctuation(stockName) {
  if (priceFluctuationIntervals[stockName]) {
    clearInterval(priceFluctuationIntervals[stockName]);
    delete priceFluctuationIntervals[stockName];
    console.log(`Stopped price fluctuation for ${stockName}`);
  }
}

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});