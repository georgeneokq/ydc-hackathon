# API Documentation

This document provides comprehensive documentation for all Next.js API routes in the application.

## Overview

| Route | Method(s) | Purpose | Auth |
|-------|-----------|---------|------|
| `/api/news` | GET | Fetch investment news | None |
| `/api/asset/charts` | GET | Get price chart data | None |
| `/api/asset/research` | GET | AI investment research | None |
| `/api/chat` | GET, POST | Chat with robo-advisor | Session cookie |
| `/api/trade/config` | GET, POST | User trading config | None |
| `/api/trade/quote` | GET | Get swap quote | None |
| `/api/trade` | POST | AI auto-trading | None |
| `/api/trade/sell` | POST | Sell all holdings | None |
| `/api/trade/transactions` | GET | Transaction history | None |

---

## Environment Variables

| Variable | Description | Used By |
|----------|-------------|---------|
| `GNEWS_API_KEY` | GNews API key | `/api/news` |
| `COINGECKO_API_KEY` | CoinGecko API key | `/api/asset/charts` |
| `DEEP_RESEARCH_API_URL` | Deep research API endpoint | `/api/asset/research`, `/api/trade` |
| `WALLET_PRIVATE_KEY` | EVM wallet private key | `/api/trade/*` |
| `PROVIDER_URL` | EVM RPC provider URL | `/api/trade` |

---

## API Endpoints

### `GET /api/news`

Fetches investment-related news articles from GNews API.

**Request:**
```http
GET /api/news
```

**Query Parameters:** None (uses hardcoded search query)

**Response:**
```json
{
  "news": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "content": "string",
      "url": "string",
      "image": "string",
      "publishedAt": "string (ISO 8601)",
      "lang": "string",
      "source": "string",
      "timestamp": "number"
    }
  ]
}
```

**Error Responses:**
- `500` - `{ "error": "Internal Server Error" }` or `{ "error": "GNews API Error" }`

**Notes:**
- Requires `GNEWS_API_KEY` environment variable
- Hardcoded search query: `"investment OR stocks OR commodities OR cryptocurrency OR macroeconomics"`
- Returns max 10 articles (free tier limit)
- Language: English only
- Sorted by `publishedAt`

---

### `GET /api/asset/charts`

Fetches historical price chart data for various asset types (stocks, cryptocurrencies, commodities).

**Request:**
```http
GET /api/asset/charts?assetdescription=Bitcoin
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `assetdescription` | string | Yes | Asset description or ticker symbol (e.g., "Bitcoin", "AAPL", "Gold", "S&P 500") |

**Response:**
```json
{
  "name": "string",
  "symbol": "string",
  "unit": "string",
  "currency": "USD",
  "interval": "daily",
  "data": [
    {
      "date": "YYYY-MM-DD",
      "price": "number"
    }
  ],
  "note": "string (optional)"
}
```

**Response Examples:**

*Cryptocurrency:*
```json
{
  "name": "Bitcoin",
  "symbol": "BTC",
  "unit": "USD per coin",
  "currency": "USD",
  "interval": "daily",
  "data": [{ "date": "2026-03-29", "price": 65000 }]
}
```

*Stock:*
```json
{
  "name": "AAPL",
  "symbol": "AAPL",
  "unit": "USD per share",
  "currency": "USD",
  "interval": "daily",
  "data": [{ "date": "2026-03-29", "price": 175.50 }]
}
```

*Commodity:*
```json
{
  "name": "Gold",
  "symbol": "GC=F",
  "unit": "USD",
  "currency": "USD",
  "interval": "daily",
  "data": [{ "date": "2026-03-29", "price": 2100.50 }]
}
```

**Error Responses:**
- `400` - `{ "error": "Asset ID is required" }`
- `400` - `{ "error": "Unknown or unsupported asset type" }`
- `500` - `{ "error": "Failed to fetch chart data" }`

**Notes:**
- **Stocks:** Uses Yahoo Finance API, 1 month daily data
- **Cryptocurrencies:** Uses CoinGecko API, 30 days daily data
- **Commodities:** Uses Yahoo Finance API with predefined ticker mappings
- Requires environment variable: `COINGECKO_API_KEY`
- Stock index handling: Converts index names to ETF tickers (e.g., "S&P 500" → "^GSPC")

---

### `GET /api/asset/research`

Generates AI-powered investment research and analysis for specified assets using deep research.

**Request:**
```http
GET /api/asset/research?assetdescriptions=Gold,Bitcoin
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `assetdescriptions` | string | Yes | Comma-separated asset descriptions (e.g., "Gold, Bitcoin, AAPL") |

**Response:**
```json
{
  "content": "string (markdown formatted analysis)"
}
```

**Error Responses:**
- `400` - `{ "error": "Asset descriptions are required" }`
- `500` - `{ "error": "Failed to generate research report" }`

**Notes:**
- Calls deep research API with 2-hour timeout (7200000ms)
- For single asset: Analyzes investment potential
- For multiple assets: Compares investment options
- Response includes AI-generated analysis with markdown formatting
- Requires environment variable: `DEEP_RESEARCH_API_URL`

---

### `GET /api/chat`

Retrieves chat history for the current session.

**Request:**
```http
GET /api/chat
Cookie: session_id=<uuid>
```

**Response:**
```json
[
  // Chat history array from tongyi-api-server
]
```

**Notes:**
- Reads `session_id` from HTTP-only cookie
- If session exists, fetches history from `http://tongyi-api-server/roboadvisor`
- Returns empty array `[]` if no session or fetch fails

---

### `POST /api/chat`

Sends a message to the chat/robo-advisor and streams the response.

**Request:**
```http
POST /api/chat
Cookie: session_id=<uuid>
Content-Type: application/json

{
  // Chat message payload (forwarded to tongyi-api-server)
}
```

**Response:**
- Content-Type: `text/event-stream`
- Streaming Server-Sent Events (SSE) response

**Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Transfer-Encoding: chunked
```

**Notes:**
- Auto-generates `session_id` cookie if not present (uses `randomUUID()`)
- Cookie settings: `httpOnly: true`, `path: '/'`, `sameSite: 'lax'`
- Streams response from `http://tongyi-api-server/roboadvisor`
- Production note: Should enable `secure: true` for cookies

---

### `GET /api/trade/config`

Retrieves current user trading configuration and wallet balances.

**Request:**
```http
GET /api/trade/config
```

**Response:**
```json
{
  "id": "string",
  "sellToken": "string",
  "buyToken": "string",
  "sellAmount": "string",
  "sellTokenBalance": "string",
  "buyTokenBalance": "string",
  "walletAddress": "string"
}
```

**Notes:**
- Auto-seeds a default user if none exists:
  - `sellToken: 'USDC'`
  - `buyToken: 'WBTC'`
  - `sellAmount: '10'`
- Fetches real balances from blockchain for wallet derived from `WALLET_PRIVATE_KEY`
- Uses Prisma for database access
- Requires environment variable: `WALLET_PRIVATE_KEY`

---

### `POST /api/trade/config`

Updates user trading configuration.

**Request:**
```http
POST /api/trade/config
Content-Type: application/json

{
  "sellToken": "string (optional)",
  "buyToken": "string (optional)",
  "sellAmount": "string (optional)"
}
```

**Response:**
```json
{
  "id": "string",
  "sellToken": "string",
  "buyToken": "string",
  "sellAmount": "string"
  // ... other user fields
}
```

**Error Responses:**
- `400` - `"Try calling GET /api/trade/config first."` (if no user exists)

**Notes:**
- Strips `id` from request body before update
- Requires existing user (created via GET endpoint)

---

### `GET /api/trade/quote`

Gets a swap quote from Velora aggregator without executing the trade.

**Request:**
```http
GET /api/trade/quote?sellToken=USDC&buyToken=WBTC&sellAmount=10
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sellToken` | string | Yes | Token symbol to sell (e.g., "USDC") |
| `buyToken` | string | Yes | Token symbol to buy (e.g., "WBTC") |
| `sellAmount` | string | Yes | Amount to sell |

**Response:**
```json
{
  "quote": "string"
}
```

**Error Responses:**
- `400` - `"Invalid buy/sell token"`
- `400` - `"Invalid sell amount"`

**Notes:**
- Chain ID: `137` (Polygon)
- Slippage: 0.5% (50 basis points)
- `quoteOnly: true` - does not execute trade
- Uses Velora aggregator
- Requires environment variable: `WALLET_PRIVATE_KEY`

---

### `POST /api/trade`

Executes AI-driven auto-trading based on deep research analysis of market trends.

**Request:**
```http
POST /api/trade
Content-Type: application/json

{
  "sellToken": "string",
  "buyToken": "string",
  "sellAmount": "string"
}
```

**Response (BUY action):**
```json
{
  "reasoning": "string",
  "swapped": "boolean",
  "updatedSellTokenBalance": "string",
  "updatedBuyTokenBalance": "string"
}
```

**Response (SELL action):**
```json
{
  "reasoning": "string",
  "swapped": "boolean"
}
```

**Error Responses:**
- `400` - `"User does not exist"`

**Notes:**
- Calls deep research API to analyze if `buyToken` shows bullish or bearish trend
- Uses LLM summarization to determine action: `BUY` or `SELL`
- If BUY: Executes swap via Velora, creates transaction record in database
- If SELL: Returns reasoning without executing swap
- Chain ID: `137` (Polygon)
- Slippage: 0.5%
- Creates Prisma transaction record on successful swap
- Timeout: 2 hours for deep research
- Requires: `DEEP_RESEARCH_API_URL`, `WALLET_PRIVATE_KEY`, `PROVIDER_URL`

---

### `POST /api/trade/sell`

Sells all holdings of the buy token (WBTC) back to the sell token (USDC).

**Request:**
```http
POST /api/trade/sell
Content-Type: application/json

{}
```

**Response (Success):**
```json
{
  "reasoning": "string",
  "swapped": true,
  "updatedSellTokenBalance": "string",
  "updatedBuyTokenBalance": "string"
}
```

**Response (Error):**
```json
{
  "swapped": false,
  "reasoning": "Server side error in swapping asset, please contact our team at trade@smartfinance.com for assistance."
}
```

**Error Responses:**
- `400` - `"User does not exist"`

**Notes:**
- Sells **entire balance** of WBTC to USDC
- Chain ID: `137` (Polygon)
- Slippage: 0.5%
- Creates transaction record in database
- Requires: `WALLET_PRIVATE_KEY`, `PROVIDER_URL`

---

### `GET /api/trade/transactions`

Retrieves transaction history for the current user.

**Request:**
```http
GET /api/trade/transactions
```

**Response:**
```json
[
  {
    "id": "string",
    "userId": "string",
    "reasoning": "string",
    "sellToken": "string",
    "buyToken": "string",
    "sellAmount": "string",
    "buyAmount": "string",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)"
  }
]
```

**Notes:**
- Returns transactions ordered by `createdAt DESC`
- Returns empty array `[]` if no user or no transactions
- Uses Prisma for database access

---

## Directory Structure

```
web/src/app/api/
├── news/
│   └── route.ts
├── asset/
│   ├── charts/
│   │   └── route.ts
│   └── research/
│       └── route.ts
├── chat/
│   └── route.ts
└── trade/
    ├── config/
    │   └── route.ts
    ├── quote/
    │   └── route.ts
    ├── sell/
    │   └── route.ts
    ├── transactions/
    │   └── route.ts
    └── route.ts
```
