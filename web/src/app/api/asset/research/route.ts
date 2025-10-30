import { Agent } from 'undici';
import { NextRequest } from 'next/server';

const footer = `

---

*This is an AI-generated analysis based on current market data and trends.*`

export async function GET(request: NextRequest) {
  // Get the asset ID from query parameters
  const searchParams = request.nextUrl.searchParams;
  const assetDescriptions = searchParams.get('assetdescriptions');

  if (!assetDescriptions) {
    return Response.json(
      { error: 'Asset descriptions are required' },
      { status: 400 }
    );
  }

  try {
    // Use LLM to process the asset description and convert to proper format
    const processedAssetDescriptions = await processAssetDescription(assetDescriptions);
    const numAssets = processedAssetDescriptions.split(',').length
    
    // Deep research with 2 hour timeout
    console.log(`Waiting for deep research response for up to 2 hours...`)
    const agent = new Agent({
      connect: { timeout: 7200000 },
      headersTimeout: 7200000,
      bodyTimeout: 7200000
    })
    const deepResearchEndpoint = `${process.env.DEEP_RESEARCH_API_URL}/generate`
    let question: string
    if(numAssets > 1) {
      question = `Analyzing price trends and news related to ${processedAssetDescriptions}, make a comparison of their current potential as investment options.`
    } else {
      question = `Analyzing price trends and news related to ${processedAssetDescriptions}, analyze its current potential as an investment option.`
    }
    console.log(question)
    const response = await fetch(deepResearchEndpoint, {
      // @ts-ignore
      dispatcher: agent,
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "question": question
      })
    })
    const results = await response.json()

    const answer = `${results["prediction"]}${footer}`
    console.log("ANSWER:")
    console.log(answer)

    return Response.json({ content: answer });
  } catch (error) {
    console.error('Error generating research report:', error);
    return Response.json(
      { error: 'Failed to generate research report' },
      { status: 500 }
    );
  }
}

// Function to process asset description using LLM
async function processAssetDescription(description: string): Promise<string> {
  const instructions = `Convert the given asset descriptions into their widely recognized canonical market names.
  Do not return ticker symbols. Do not include parentheses. Do not add extra commentary.

  If the input already resembles the correct name, normalize formatting (proper capitalization, remove unnecessary words).
  If the input refers to a major index, convert to its standard full name.
  If unsure, return the input in a simplified and clean form.

  Examples:
  - Input: "S&P" → Output: "S&P 500"
  - Input: "spx" → Output: "S&P 500"
  - Input: "nasdaq" → Output: "Nasdaq Composite"
  - Input: "dow jones" → Output: "Dow Jones Industrial Average"
  - Input: "^GSPC, nasdaq" → Output: "S&P 500, Nasdaq Composite"
  - Input: "AAPL" → Output: "Apple"
  - Input: "apple stock" → Output: "Apple"
  - Input: "Gold" → Output: "Gold"
  - Input: "BTC" → Output: "Bitcoin"

  Respond with only the final names, comma-delimited, nothing else.

  Asset description: ${description}`;

  const response = await fetch("https://api.you.com/v1/agents/runs", {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.YDC_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agent: "express",
      input: instructions,
    })
  })

  const data = await response.json()
  const processed = data["output"]?.[0]?.text

  return processed || description; // Fallback to original if LLM fails
}

const mockResearchContent = `# Gold Market Analysis

## Executive Summary
Gold has shown resilience in recent market conditions, maintaining its position as a safe-haven asset amid economic uncertainties.

## Price Performance
- Current price: $1,950 per ounce
- 1-year change: +8.2%
- 5-year average: $1,780 per ounce

## Market Drivers

### Economic Factors
- Inflation expectations continue to support gold demand
- Central bank policies influencing precious metals
- Currency devaluation concerns driving investment

### Technical Analysis
- Resistance level: $2,000 per ounce
- Support level: $1,850 per ounce
- Moving averages suggest bullish momentum

## Price Forecast Table

| Time Period | Price Forecast | Confidence Level | Key Factors |
|-------------|----------------|------------------|-------------|
| 1 Month     | $1,980         | High            | Inflation data, Fed decisions |
| 3 Months    | $2,020         | Medium          | Geopolitical tensions |
| 6 Months    | $2,080         | Medium          | Economic recession concerns |
| 1 Year      | $2,150         | Low             | Long-term economic trends |

## Outlook
The precious metals sector shows potential for continued growth, driven by geopolitical tensions and monetary policy shifts. However, rising interest rates may provide headwinds in the short term.

## Risk Factors
- Changes in Federal Reserve policy
- Shifts in global economic stability
- Alternative investment preferences

---

*This is an AI-generated analysis based on current market data and trends.*`;