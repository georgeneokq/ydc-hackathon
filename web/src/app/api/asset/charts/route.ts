import Coingecko from '@coingecko/coingecko-typescript';
import { NextRequest } from 'next/server';
import { createSimpleCompletion } from '@/lib/llm/openai';

interface ChartData {
  name: string;
  symbol: string;
  unit: string;
  currency: string;
  interval: string;
  data: { date: string; price: number }[];
  note?: string;
}

export async function GET(request: NextRequest) {
  // Get the asset ID from query parameters
  const searchParams = request.nextUrl.searchParams;
  const assetDescription = searchParams.get('assetdescription');

  if (!assetDescription) {
    return Response.json(
      { error: 'Asset ID is required' },
      { status: 400 }
    );
  }

  try {
    // Use LLM to determine asset type
    const assetType = await classifyAssetType(assetDescription);

    let chartData: ChartData;

    switch (assetType) {
      case 'COMMODITY':
        chartData = await fetchCommodityData(assetDescription);
        break;
      case 'STOCK':
        chartData = await fetchStockData(assetDescription);
        break;
      case 'CRYPTOCURRENCY':
        chartData = await fetchCryptocurrencyData(assetDescription);
        break;
      case 'UNKNOWN':
        return Response.json(
          { error: 'Unknown or unsupported asset type' },
          { status: 400 }
        );
    }

    return Response.json(chartData);
  } catch (error) {
    console.error('Error fetching charts data:', error);
    return Response.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}

// Function to classify asset type using LLM
async function classifyAssetType(assetId: string): Promise<'COMMODITY' | 'STOCK' | 'CRYPTOCURRENCY' | 'UNKNOWN'> {
  const systemPrompt = `You are a classification assistant for financial assets. Your task is to categorize asset descriptions into one of four categories.

Rules:
- COMMODITY: if the asset description refers to commodities (oil, gas, agricultural products, precious metals, etc.)
- STOCK: if the asset description refers to a company stock or stock market index
- CRYPTOCURRENCY: if the asset description refers to a cryptocurrency (e.g., Bitcoin, Ethereum, etc.)
- UNKNOWN: if the asset description does not fit any of the above categories

For stock indices (e.g., "S&P", "Dow Jones", "Nasdaq"), classify as STOCK.

Respond with ONLY the category name in plain text without any explanation.`;

  const response = await createSimpleCompletion(
    [
      {
        role: 'user',
        content: `Classify this asset: ${assetId}`,
      },
    ],
    undefined,
    {
      systemPrompt,
      maxTokens: 50,
      temperature: 0,
    }
  );

  const assetType = response.trim().toUpperCase();

  // Validate the response and return appropriate type
  if (assetType === 'COMMODITY') return 'COMMODITY';
  if (assetType === 'STOCK') return 'STOCK';
  if (assetType === 'CRYPTOCURRENCY') return 'CRYPTOCURRENCY';

  // Default to UNKNOWN if classification is uncertain
  return 'UNKNOWN';
}

// Function to convert asset description to ticker using LLM
async function convertDescriptionToTicker(description: string): Promise<string> {
  const systemPrompt = `You are a financial ticker lookup assistant. Convert asset descriptions to their correct Yahoo Finance ticker symbols.

Rules:
- If the input is already a valid ticker symbol, return it unchanged.
- If the input refers to a company's name, return that company's primary stock ticker.
- If the input refers to a stock market *index*, return the canonical *index ticker*:
    - "S&P", "S&P 500", "SP500", "Standard and Poor's" → "^GSPC"
    - "Nasdaq", "Nasdaq 100" → "^NDX"
    - "Dow Jones", "DJI", "Dow" → "^DJI"
- If the input refers to a commodity (e.g., gold, oil, wheat), return "UNKNOWN".
- If the asset cannot be confidently identified, return "UNKNOWN".

Respond with ONLY the ticker symbol or "UNKNOWN". No explanation.`;

  const response = await createSimpleCompletion(
    [
      {
        role: 'user',
        content: `Convert to ticker: ${description}`,
      },
    ],
    undefined,
    {
      systemPrompt,
      maxTokens: 20,
      temperature: 0,
    }
  );

  const ticker = response.trim();

  if (!ticker || ticker === 'UNKNOWN') {
    throw new Error('Unable to identify stock ticker from description');
  }

  return ticker;
}

// Function to fetch stock data from Yahoo Finance
async function fetchStockData(assetDescription: string): Promise<ChartData> {
  // First, use LLM to convert the description to a ticker symbol
  const ticker = await convertDescriptionToTicker(assetDescription);
  console.log(`TICKER: ${ticker}`)
  
  // Using Yahoo Finance API to get stock data
  const range = '1mo'; // Get 1 month of daily data
  const interval = '1d'; // Daily interval
  const yahooResponse = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}`);
  
  if (!yahooResponse.ok) {
    throw new Error(`Yahoo Finance API error: ${yahooResponse.status} for ticker ${ticker}`);
  }
  
  const yahooData = await yahooResponse.json();
  
  // Check if the response contains valid chart data
  if (!yahooData.chart?.result || yahooData.chart.result.length === 0) {
    throw new Error(`Invalid data format from Yahoo Finance API for ticker ${ticker}`);
  }
  
  // Check if the asset exists
  if (yahooData.chart.result[0]?.indicators?.quote?.[0]?.close === undefined) {
    throw new Error(`Asset ${ticker} not found in Yahoo Finance`);
  }
  
  const result = yahooData.chart.result[0];
  const timestamps = result.timestamp;
  const indicators = result.indicators;
  
  if (!timestamps || !indicators || !indicators.quote?.[0]?.close) {
    throw new Error(`Missing price data in Yahoo Finance response for ticker ${ticker}`);
  }
  
  const closes = indicators.quote[0].close;
  
  // Transform the data to match our standardized format
  const transformedData = timestamps.map((timestamp: number, index: number) => {
    const date = new Date(timestamp * 1000); // Convert Unix timestamp to JavaScript date
    const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    return {
      date: formattedDate,
      price: parseFloat(closes[index]?.toFixed(2)) || 0 // Use price or default to 0 if undefined
    };
  });
  
  // Filter out any entries where price is 0 (invalid data)
  const validData = transformedData.filter((entry: { price: number }) => entry.price > 0);
  
  return {
    name: ticker,
    symbol: ticker, // Use the actual ticker symbol
    unit: 'USD per share',
    currency: 'USD',
    interval: 'daily',
    data: validData,
  };
}

// Function to match asset description to a cryptocurrency market ID using LLM
async function matchCryptoToMarketId(assetDescription: string, marketIds: string[]): Promise<string> {
  const systemPrompt = `You are a cryptocurrency lookup assistant. Match asset descriptions to CoinGecko market IDs.

Rules:
- Return only the matching market ID from the provided list
- Common mappings:
  - "Bitcoin" or "BTC" → "bitcoin"
  - "Ethereum" or "ETH" → "ethereum"
  - "Dogecoin" or "DOGE" → "dogecoin"
- If no clear match exists, return "NOT_FOUND"

Respond with ONLY the market ID or "NOT_FOUND". No other text.`;

  const response = await createSimpleCompletion(
    [
      {
        role: 'user',
        content: `Match this asset to a market ID:\nAsset: ${assetDescription}\n\nAvailable market IDs: ${marketIds.join(', ')}`,
      },
    ],
    undefined,
    {
      systemPrompt,
      maxTokens: 30,
      temperature: 0,
    }
  );

  const matchedId = response.trim().toLowerCase();

  if (!matchedId || matchedId === 'not_found') {
    throw new Error(`No matching cryptocurrency found for: ${assetDescription}`);
  }

  return matchedId;
}

// Function to fetch cryptocurrency data
async function fetchCryptocurrencyData(assetDescription: string): Promise<ChartData> {
  const client = new Coingecko({
    // No proAPIKey or demoAPIKey
    environment: 'demo',
    // Optionally, to omit auth headers explicitly
    // omitHeaders: true,
    demoAPIKey: process.env.COINGECKO_API_KEY
  });
  
  // Get marketIds array, which will contain queryable market charts.
  // e.g. ['bitcoin', 'ethereum']
  const markets = await client.coins.markets.get({
    vs_currency: 'usd'
  })
  const marketIds = markets.map(marketInfo => marketInfo.id ?? "");

  // Add LLM call to pass in both assetDescription and the marketIds array,
  // and get the LLM to output the ID to be queried, similar to fetchStockData
  const marketId = await matchCryptoToMarketId(assetDescription, marketIds);
  const matchedMarket = markets.filter(m => m.id === marketId)[0]
  const symbol = matchedMarket.symbol!
  const name = matchedMarket.name!

  try {
    const response = await client.coins.marketChart.get(marketId, {
      vs_currency: 'usd',
      days: '30', // Number of days for historical data
      interval: 'daily'
    })

    const prices = response.prices;

    if(!prices) {
      throw new Error(`Unable to fetch prices for ${assetDescription}`)
    }
    
    // Transform the prices data to match our standardized format
    // Prices format is [timestamp, price] from CoinGecko API
    const transformedData = prices.map((priceEntry: number[]) => {
      const [timestamp, price] = priceEntry
      const date = new Date(timestamp); // CoinGecko provides milliseconds timestamp
      const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      return {
        date: formattedDate,
        price: parseFloat(price.toFixed(2)) // Round to 2 decimal places
      };
    });

    return {
      name,
      symbol: symbol.toUpperCase(),
      unit: 'USD per coin',
      currency: 'USD',
      interval: 'daily',
      data: transformedData,
      note: 'Powered by [CoinGecko](https://www.coingecko.com/)'
    };
  } catch(e) {
    console.log(e)
    throw new Error("Unable to fetch cryptocurrency price")
  }
}

// Function to fetch commodity data from Yahoo Finance
async function fetchCommodityData(assetDescription: string): Promise<ChartData> {
  // Map commodity descriptions to Yahoo Finance tickers
  let commodityTicker = assetDescription.toUpperCase();
  let name = assetDescription
  
  // Common commodity mappings for Yahoo Finance
  const lowerDesc = assetDescription.toLowerCase();
  if (lowerDesc.includes('gold') || lowerDesc.includes('xau')) {
    commodityTicker = 'GC=F'; // Gold futures
    name = 'Gold'
  } else if (lowerDesc.includes('silver') || lowerDesc.includes('xag')) {
    commodityTicker = 'SI=F'; // Silver futures
    name = 'Silver'
  } else if (lowerDesc.includes('oil') || lowerDesc.includes('crude')) {
    commodityTicker = 'CL=F'; // Crude oil futures
    name = 'Oil'
  } else if (lowerDesc.includes('gas') || lowerDesc.includes('natural gas')) {
    commodityTicker = 'NG=F'; // Natural gas futures  
    name = 'Gas'
  } else if (lowerDesc.includes('copper')) {
    commodityTicker = 'HG=F'; // Copper futures
    name = 'Copper'
  } else if (lowerDesc.includes('aluminium') || lowerDesc.includes('aluminum')) {
    commodityTicker = 'ALI=F'; // Aluminum futures
    name = 'Aluminium'
  } else if (lowerDesc.includes('wheat')) {
    commodityTicker = 'W=F'; // Wheat futures
    name = 'Wheat'
  } else if (lowerDesc.includes('corn')) {
    commodityTicker = 'C=F'; // Corn futures
    name = 'Corn'
  } else if (lowerDesc.includes('cotton')) {
    commodityTicker = 'CT=F'; // Cotton futures
    name = 'Cotton'
  } else if (lowerDesc.includes('sugar')) {
    commodityTicker = 'SB=F'; // Sugar #11 futures
    name = 'Cotton'
  } else if (lowerDesc.includes('coffee')) {
    commodityTicker = 'KC=F'; // Coffee C futures
    name = 'Coffee'
  } else if (lowerDesc.includes('platinum')) {
    commodityTicker = 'PL=F'; // Platinum futures
    name = 'Platinum'
  }
  // Add more commodity mappings as needed
  
  // Using Yahoo Finance API to get commodity data
  const range = '1mo'; // Get 1 month of daily data
  const interval = '1d'; // Daily interval
  const yahooResponse = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${commodityTicker}?range=${range}&interval=${interval}`);
  
  if (!yahooResponse.ok) {
    throw new Error(`Yahoo Finance API error: ${yahooResponse.status} for commodity ${commodityTicker}`);
  }
  
  const yahooData = await yahooResponse.json();
  
  // Check if the response contains valid chart data
  if (!yahooData.chart?.result || yahooData.chart.result.length === 0) {
    throw new Error(`Invalid data format from Yahoo Finance API for commodity ${commodityTicker}`);
  }
  
  const result = yahooData.chart.result[0];
  const timestamps = result.timestamp;
  const indicators = result.indicators;
  
  if (!timestamps || !indicators || !indicators.quote?.[0]?.close) {
    throw new Error(`Missing price data in Yahoo Finance response for commodity ${commodityTicker}`);
  }
  
  const closes = indicators.quote[0].close;
  
  // Transform the data to match our standardized format
  const transformedData = timestamps.map((timestamp: number, index: number) => {
    const date = new Date(timestamp * 1000); // Convert Unix timestamp to JavaScript date
    const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    return {
      date: formattedDate,
      price: parseFloat(closes[index]?.toFixed(2)) || 0 // Use price or default to 0 if undefined
    };
  });
  
  // Filter out any entries where price is 0 (invalid data)
  const validData = transformedData.filter((entry: { price: number }) => entry.price > 0);
  
  return {
    name,
    symbol: commodityTicker, // Use the actual commodity ticker
    unit: 'USD',
    currency: 'USD',
    interval: 'daily',
    data: validData,
  };
}