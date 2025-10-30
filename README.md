# SmartFinance - Investment Analysis and Automated Cryptocurrency Trading

## Overview

SmartFinance is an AI-powered financial platform developed for the you.com hackathon 2025 that addresses the challenge of making informed investment decisions in volatile cryptocurrency markets. The platform combines deep research capabilities with automated trading to provide data-driven investment analysis and execution.

Built as part of the "Enterprise-Grade Solutions" track, SmartFinance leverages a modern tech stack including Next.js for the frontend, Python with FastAPI for the backend API server, PostgreSQL for data persistence, and Docker for containerization. The system integrates multiple data sources including you.com APIs (Search, Contents, Live News, Express Agent), CoinGecko for cryptocurrency data, and Yahoo Finance for traditional assets.

The platform's impact lies in providing sophisticated investment analysis tools that enable users to make informed decisions through AI-powered research and automated trading strategies. Key endpoints include deep research functionality powered by you.com's Express Agent for grounding LLM responses with web search, asset symbol resolution, and comparative analysis of different investment options through an asset analyzer that plots multiple charts side by side and deep research report generation.

## Credits

Credits go to Tongyi deep research for deep research feature.

Modifications made:

- Switched out serper search for you.com search API
- Switched out Jina.ai reader for you.com contents API
- Removed unused WebAgent and Agent folders, leaving only inference folder
- Deleted run_multi_react.py, run_react_infer.sh
- Added API server to expose the deep research functionality
- Turned HTTP calls to be asynchronous to parallelize and speed up operations
- Edit system prompt to remove Python Interpreter feature (looking to put it back once working)

## Architecture

The application is containerized using Docker Compose and consists of:
- `tongyi-api-server`: Python-based API server based on the official Tongyi Deep Research repository (https://github.com/Alibaba-NLP/DeepResearch), adapted to expose functionality via FastAPI. Uses you.com Search API to replace Serper as the search provider and you.com Contents API to replace Jina.ai as the page reader provider.
- `web`: Next.js web application serving the user interface
- `autotrade-cron`: Node.js service that periodically executes trading strategies
- `postgres`: PostgreSQL database for storing application data

## Prerequisites

Before starting, ensure you have the following installed:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Environment Setup

The project requires environment variables to be configured in multiple locations. Follow these steps in order:

### 1. Root Directory (.env)

Copy the example environment file in the root directory:
```bash
cp .env.example .env
```

The root `.env` file contains database configuration which can be used as-is for development:
```env
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="postgres"
POSTGRES_DB="ydc_hackathon"
DB_HOST="localhost"
DB_PORT=5432
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:${DB_PORT}/${POSTGRES_DB}"
```

### 2. Web Application (web/.env)

Copy and configure the web application environment:
```bash
cp web/.env.example web/.env
```

You need to provide API keys for the following services:

- **YDC_API_KEY**: Your You.com API key for web search functionality. Get it at [you.com](https://you.com)

- **OPENAI_API_KEY**: API key for LLM operations (can be from any platform supporting OpenAI compatible LLM calls, such as OpenAI, OpenRouter, Anthropic, etc.)

- **OPENAI_API_BASE**: Base URL for the LLM provider's API (e.g., https://api.openai.com/v1 for OpenAI, https://openrouter.ai/api/v1 for OpenRouter, etc.)

- **WALLET_PRIVATE_KEY**: Private key for your cryptocurrency wallet used in trading operations (do not expose publicly)

- **PROVIDER_URL**: Alchemy API URL for Polygon network interaction. Get it at [Alchemy](https://www.alchemy.com/) - format should be: `https://polygon-mainnet.g.alchemy.com/v2/<YOUR_API_KEY>`

- **AGGREGATOR_PARTNER** and **AGGREGATOR_AFFILIATE_FEE_RECIPIENT**: Partner information for the Velora (formerly Paraswap) partner program (can be left empty, not necessary for basic functionality). Velora is used as the DeFi aggregator for swapping between token pairs.

- **COINGECKO_API_KEY**: API key for CoinGecko data access. Get it at [CoinGecko](https://www.coingecko.com/en/api)

### 3. Tongyi Deep Research API Server (tongyi-deepresearch/.env)

Copy and configure the deep research API environment:
```bash
cp tongyi-deepresearch/.env.example tongyi-deepresearch/.env
```

This service requires several API keys and configuration values:

- **YDC_API_KEY**: Your You.com API key for web search and content functionality (replaces Serper and Jina.ai as the search and page reader providers for this hackathon). Get it at [you.com](https://you.com)

- **API_KEY**: API key for content summarization (can be from any platform supporting OpenAI compatible LLM calls, such as OpenAI, OpenRouter, Anthropic, etc.)

- **API_BASE**: Base URL for the content summarization provider's API (e.g., https://api.openai.com/v1 for OpenAI, https://openrouter.ai/api/v1 for OpenRouter, etc.)

- **DASHSCOPE_API_KEY**: API key for Dashscope (Alibaba Cloud) for file parsing (PDF, Office documents, etc.). Get it at [Dashscope](https://dashscope.aliyun.com/)

Note: Serper and Jina API keys are not needed as they are replaced by you.com APIs for this hackathon.

### 4. Autotrade Cron Service (autotrade-cron/.env)

Copy and configure the autotrade service environment:
```bash
cp autotrade-cron/.env.example autotrade-cron/.env
```

This service requires:

- **OPENAI_API_KEY**: API key for LLM operations (can be from any platform supporting OpenAI compatible LLM calls, such as OpenAI, OpenRouter, Anthropic, etc.)

- **OPENAI_API_BASE**: Base URL for the LLM provider's API (e.g., https://api.openai.com/v1 for OpenAI, https://openrouter.ai/api/v1 for OpenRouter, etc.)

- **WALLET_PRIVATE_KEY**: Private key for your cryptocurrency wallet used in trading operations (do not expose publicly)

- **PROVIDER_URL**: Alchemy API URL for Polygon network interaction. Get it at [Alchemy](https://www.alchemy.com/) - format should be: `https://polygon-mainnet.g.alchemy.com/v2/<YOUR_API_KEY>`

- **AGGREGATOR_PARTNER** and **AGGREGATOR_AFFILIATE_FEE_RECIPIENT**: Partner information for the Velora (formerly Paraswap) partner program (can be left empty, not necessary for basic functionality). Velora is used as the DeFi aggregator for swapping between token pairs.

## Running the Project

### Initial Build

First, build all Docker images:

```bash
docker compose build
```

### Start All Services

Start all services in detached mode:

```bash
docker compose up -d
```

This will start all four services:
- Tongyi Deep Research API Server (port 80 in the container, accessible internally only - not exposed publicly)
- Web Interface (port 3000 on your host machine)
- Autotrade Cron (runs periodically in the background)
- PostgreSQL Database (port 5432 on your host machine)

### View Logs

To view logs from all services:

```bash
docker compose logs -f
```

To view logs from a specific service:

```bash
docker compose logs -f <service_name>
```
Replace `<service_name>` with one of: `tongyi-api-server`, `web`, `autotrade-cron`, or `postgres`

### Stop Services

To stop all services:

```bash
docker compose down
```

## Components

### Tongyi Deep Research API Server

The `tongyi-api-server` provides advanced research and analysis capabilities:
- Based on the official Tongyi Deep Research repository (https://github.com/Alibaba-NLP/DeepResearch)
- Adapted to expose functionality via FastAPI API server
- Runs on port 80 internally (within Docker network) - not exposed publicly to simulate an enterprise environment where external users do not have free access to our deep research functionality
- Provides endpoints for investment analysis and research
- Powered by you.com Search and Contents API (replacing Serper and Jina.ai) for deep research functionality
- Uses advanced AI models for analysis
- Connects to the PostgreSQL database for data persistence

### Web Interface

The `web` service provides the user interface:
- Runs on port 3000 accessible from your host machine at `http://localhost:3000`
- Built with Next.js and React
- Visualizes research results and trading data
- Features Asset Analyzer allowing users to plot multiple charts side by side to compare different price charts
- Includes news page displaying the most relevant financial news powered by you.com Live News API
- Features roboadvisor powered by Agno agentic framework
- Roboadvisor takes advantage of Agno's simple chat history storage management and tool calling to use you.com Express Agent to find needed information
- Enables comparative analysis of different assets as investment options
- Features Express Agent functionality for grounding LLM responses with web search
- Uses Express Agent in Asset Analyzer to find correct stock/commodity/market index/cryptocurrency symbols before displaying charts or starting deep research
- Provides user controls for the system

### Autotrade Cron

The `autotrade-cron` service handles automated trading:
- Runs scheduled trading operations
- Makes decisions based on research results from the API server
- Interacts with cryptocurrency exchanges via wallet integration
- Logs trading activities and results

### PostgreSQL Database

The `postgres` service provides data storage:
- Runs on port 5432 accessible from your host machine
- Stores research data, trading history, and application state
- Pre-configured with the database needed by the application

## Data Sources

The platform integrates multiple data sources to provide comprehensive financial information:
- **Stocks and Commodities**: Data pulled from Yahoo Finance
- **Cryptocurrencies**: Prices pulled from CoinGecko
- **Financial News**: Powered by you.com Live News API
- **Search and Research**: Powered by you.com Search and Contents API
- **LLM Grounding and Symbol Resolution**: Powered by you.com Express Agent (used to ground LLM responses with web search and to find correct asset symbols in the Asset Analyzer)

## Troubleshooting

### Common Issues

1. **Failed to build Docker images**: Ensure Docker and Docker Compose are properly installed and running.

2. **Environment variables are missing**: Double-check that you've configured all required `.env` files in the correct locations.

3. **API keys are invalid**: Verify that all API keys in your `.env` files are correct and have the necessary permissions.

4. **Database connection issues**: Check that the PostgreSQL service is running and that database credentials are correctly configured.

### Docker Commands

Useful Docker commands for managing the system:

```bash
# Check running containers
docker compose ps

# Restart a specific service
docker compose restart <service_name>

# View resource usage
docker stats

# Clean up unused Docker resources
docker system prune
```

## Development

For development purposes:
- The web interface supports hot reloading when files in `web/src` are modified
- The deep research API server supports reload when files in `tongyi-deepresearch/inference` are modified
- The autotrade-cron service supports reload when files in `autotrade-cron/src` are modified

## Notes

- Always keep your API keys and wallet private keys secure
- The system is designed for the YDC Hackathon project
- The Python-based deep research component uses advanced models for analysis
- The trading functionality is for demonstration purposes only

## Future Works

The following features could not be completed within the timeframe of the hackathon but represent important next steps for the project:

1. **Expanded Token Support**: Currently, only swaps between USDC and Bitcoin are supported for demonstration purposes, but we could expand to support more token pairs to provide greater trading flexibility.

2. **Multi-User Trading**: The system currently assumes a single user for the trading functionality, but has been structured such that we can easily support multi-user capabilities as we already have the groundwork laid for saving users' information into the PostgreSQL database. This would involve deriving individual wallets for each user from a master seed phrase using a specific derivation path, rather than using a single wallet private key stored in environment variables.

3. **Deposit Tracking and Profit Calculation**: We did not implement tracking of deposits into the cryptocurrency wallet, and hence we are not able to calculate the exact profits gained or make trading decisions based on whether the amount earned ends up with a higher balance than the initial capital. Implementing this feature would enable more sophisticated trading strategies and performance analysis.