import OpenAI from "openai"
import { extractJson } from "./llm/extract"

type Summarization = {
  action: string
  reasoning: string
}

export const sampleGoldReport = `
# Gold — Trend Analysis Summary

**Snapshot**

* **Price:** ~$4,000 per troy ounce
* **24h Move:** Flat to slight upward drift
* **7D Trend:** Slow upward grind
* **Market Tone:** *Steady bullish bias*, controlled accumulation

---

## 📊 Quick Technical & Market Table

| Metric / Indicator              | Current Approximate Value  | Interpretation                             | Bias             |
| ------------------------------- | -------------------------- | ------------------------------------------ | ---------------- |
| Spot Price                      | ~$4,000                    | Trading near the upper end of recent range | Bullish          |
| 24h Change                      | Slight positive            | Low-volatility upward drift                | Mild Bullish     |
| 7-Day Trend                     | Gradual increase           | Buyers absorbing dips                      | Bullish          |
| 50-Day Moving Average           | Price **above** 50MA       | Short-term uptrend intact                  | Bullish          |
| 200-Day Moving Average          | Price **well above** 200MA | Long-term structural trend up              | Bullish          |
| Key Support Zone                | $3,800–$3,900              | Strong bid zones on pullbacks              | Supportive       |
| Key Resistance Zone             | $4,150–$4,300              | Previous rally tops formed here            | Critical Barrier |
| Central Bank & Sovereign Demand | Remains high               | Structural accumulation continues          | Strong Bullish   |
| Market Sentiment                | Calm, confident buying     | No panic selling pressure                  | Bullish-Neutral  |

---

## 1) Technical Structure

Gold is forming a **controlled uptrend**:

* Price is maintaining **higher lows** on weekly charts.
* It is trading **above both the 50-day and 200-day moving averages**.
* The rise is **slow and stable**, suggesting **institutional & sovereign accumulation**, not hype-driven retail momentum.

The *only major obstacle* is the **$4,150–$4,300 resistance zone**, where previous rallies have paused.

> A **break and weekly close above ~$4,300** would signal **strong bullish continuation**.
>
> A **drop below ~$3,800** would weaken the trend and shift near-term tone to neutral.

---

## 2) Macro & Fundamental Environment

The medium-to-long term support for gold is intact:

* **Rate cut expectations** reduce opportunity cost of holding gold.
* **Central bank purchases** remain historically high.
* **Geopolitical uncertainty** increases safe-haven demand.
* **Currency debasement concerns** continue to drive long-term allocation flows.

None of these forces are showing signs of reversing.

---

## 3) Demand / Flow Signals (Non-Crypto Equivalent to On-Chain)

* **Futures positioning:** Gradual build-up in net-long interest → bullish.
* **Physical premiums in Asia (China/India/Middle East):** Stable to elevated → real-world demand is strong.
* **Gold ETFs:** Recently resumed **positive inflows**, reinforcing mid-term accumulation behavior.

These indicators support the **sustained upward trend** rather than short-term speculation.

---

## 4) Final Trend Verdict

| Timeframe                  | Trend Bias          | Reason                                            |
| -------------------------- | ------------------- | ------------------------------------------------- |
| Short-Term (days–weeks)    | **Bullish-Neutral** | Price grinding upward but approaching resistance  |
| Medium-Term (weeks–months) | **Bullish**         | Higher lows + price above key MAs + steady demand |
| Long-Term (months–years)   | **Strong Bullish**  | Structural sovereign buying & macro tailwinds     |

> **Bottom line:**
> Gold is currently in a **steady bullish trend**, driven by **accumulation rather than speculation**.
> A breakout above **$4,300** would likely trigger **the next strong leg upward**.`

export const sampleBtcReport = `
# Bitcoin — Trend Analysis Summary

**Snapshot (approximate ranges)**

* **Price:** ~$112,000
* **24h Change:** Mild negative (small pullback)
* **7D Trend:** Moderately positive, recovering from prior dip
* **Market Tone:** *Short-term neutral → mildly bearish*, *mid-term cautiously constructive*

---

## 📊 Quick Technical & Market Table

| Metric / Indicator      | Current Approximate Value          | Interpretation                              | Bias                     |
| ----------------------- | ---------------------------------- | ------------------------------------------- | ------------------------ |
| Spot Price              | ~$112,000                          | Trading between support and resistance      | Neutral                  |
| 24h Price Change        | Slight down / flat                 | Short-term consolidation                    | Neutral / Slight Bearish |
| 7-Day Performance       | Mildly positive                    | Recovery attempts present                   | Mild Bullish             |
| 50-Day Moving Average   | Price is slightly **above** 50MA   | Constructive short-term trend               | Mild Bullish             |
| 200-Day Moving Average  | Price remains **well above** 200MA | Long-term uptrend remains intact            | Bullish                  |
| Key Support Zone        | $100,000–$110,000                  | Buyers historically defend here             | Supportive               |
| Key Resistance Zone     | $115,000–$120,000                  | Sellers appear here — breakthrough required | Critical                 |
| On-Chain Exchange Flows | Elevated                           | Indicates **profit-taking pressure**        | Bearish                  |
| Market Sentiment        | Mixed, rangebound                  | Waiting for breakout confirmation           | Neutral                  |

---

## 1) Technical Structure

* Bitcoin is **holding above its 50-day moving average**, which is generally supportive.
* However, every attempt to push into the **$115K–$120K** area has been met with selling.
* Consolidation is forming a **high-base range**, but momentum is not clean.

> If BTC **breaks above ~$120K and holds**, the trend becomes decisively bullish.
> If BTC **falls below ~$110K**, expect sharper downside momentum.

---

## 2) On-Chain & Flow Behavior

* Increased exchange inflow from short-term holders = **profit-taking**.
* Volume during rebounds is lower than during selloffs → **weaker conviction** from buyers.
* Long-term holders remain largely inactive (neutral to bullish macro signal).

---

## 3) Market Context

* ETF + institutional narrative remains supportive **on the macro horizon**.
* But near-term trading is dominated by **technical resistance + short-term traders selling strength**.
* Until flows shift, breakouts are hard to sustain.

---

## 4) Final Trend Verdict

| Timeframe                  | Trend Bias                   | Reasoning                                                |
| -------------------------- | ---------------------------- | -------------------------------------------------------- |
| Short-Term (days–weeks)    | **Neutral → Slight Bearish** | Resistance overhead + profit-taking                      |
| Medium-Term (weeks–months) | **Cautiously Bullish**       | Price remains above key long-term trend levels           |
| Long-Term (months–years)   | **Bullish**                  | Adoption + institutional flows still structurally rising |

> **Bottom line:** Bitcoin is in a **stalling-but-still-uptrend environment**.
> *The next decisive move will be determined by the $115K–$120K breakout or failure.*`

export const sampleBtcGoldComparisonReport = `# Bitcoin vs. Gold: Current Investment Potential in 2025

## Introduction

As of August 2025, both Bitcoin and gold are attracting significant investor attention, driven by shifting macroeconomic conditions, evolving regulatory landscapes, and broadening adoption. Understanding their respective strengths, risks, and growth catalysts is crucial for anyone considering them as components of an investment portfolio. This report offers a detailed comparison of Bitcoin and gold, analyzing recent price trends, market drivers, and their outlook as investment vehicles.

---

## Price Trends and Recent Performance

### Bitcoin

Bitcoin’s trajectory in 2025 has been marked by impressive volatility and substantial institutional interest. The price of Bitcoin reached an all-time high of $124,002 in mid-August 2025, up from a low of $112,000 earlier in the month. Year-to-date, Bitcoin has risen nearly 32%, reflecting strong momentum from both retail and institutional demand. Market sentiment remains deeply bullish, as demonstrated by record call/put ratios (3.21x), substantial call option premium spending (+37% MoM), and compressed implied volatility (32%).

The surge is supported by several key factors:
- **Regulatory Wins:** The U.S. administration has passed reforms allowing crypto assets in 401(k) retirement accounts, alongside stablecoin regulations and SEC adjustments to accommodate the asset class.
- **Institutional Adoption:** Major firms like BlackRock and Fidelity operate spot Bitcoin ETFs, facilitating easier institutional access and capital inflows.
- **Mining Consolidation:** U.S. miners have captured a record 31.5% of global hashrate, signaling structural shifts.

### Gold

Gold prices have also experienced significant growth, driven by safe-haven demand, central bank purchases, and expectations of Fed rate cuts. The price of gold futures opened at $3,477.20 per ounce on August 29, 2025, up 38.9% from August 2024. In August alone, gold surged by 4.6% and reached new all-time highs, with prices hitting $3,485.60 briefly.

Central bank buying has been particularly robust. In the first half of 2025, Poland led with 67.2 tonnes, followed by Azerbaijan (34.5 tonnes) and Kazakhstan (22.1 tonnes), while 23 countries increased their gold reserves. ETF inflows also rose sharply in August, with $5.5 billion (53 tonnes) entering global gold ETFs, driven by North American and European investors.

---

## Key Investment Drivers

### Bitcoin

#### Institutional Adoption and Regulatory Support
The U.S. executive order permitting crypto assets in 401(k) plans and the passage of stablecoin regulations have been transformative. These reforms create a more favorable environment for institutional investors, spurring further ETF inflows. As of mid-August, Bitcoin ETFs experienced a $260 million net inflow, reversing two weeks of outflows, and a $91.55 million net inflow was recorded on August 6.

#### Technical and Sentiment Indicators
- **Call/Put Ratio:** 3.21x (highest since June 2024)
- **Option Premiums:** $792 million spent (+37% MoM)
- **Implied Volatility:** 32% (below 50% one-year average)

These factors suggest a readiness for a volatility spike and indicate a high potential for sharp price movements, both up and down.

#### Market Infrastructure
Mining consolidation, AI/HPC integration, and the entry of new digital asset treasuries are strengthening Bitcoin’s underlying ecosystem. Despite some volatility, mNAVs for major digital asset treasuries have declined, signaling challenges in capital-raising but not necessarily weakening underlying demand.

### Gold

#### Central Bank Demand and Safe-Haven Status
Central banks are a cornerstone of gold demand in 2025, with widespread purchases and a rebalancing of global gold reserves. Countries such as Poland, Azerbaijan, and Kazakhstan are leading the charge, reflecting a desire to diversify away from dollar-based assets.

#### ETF and Managed Money Activity
ETF inflows of $5.5 billion in August 2025 highlight a strong preference for transparent, liquid exposure to gold. North American and European investors are the main drivers, with strong net longs in managed money. While Asian and other regions experienced some outflows, the overall trend remains positive.

#### Macro Drivers and Inflation Expectations
- **Fed Rate Cuts:** Expectations of lower rates in September 2025 support gold, as safe-haven demand rises with economic uncertainty.
- **Stagflation Risks:** Gold’s sensitivity to stagflation—high inflation and economic stagnation—is heightened as market participants anticipate persistent inflation and a resilient economy.

---

## Recent Investment Flows and Market Data

### Bitcoin ETF Flows

| Period           | Net ETF Inflow (USD) | Notable Trends                         |
|------------------|---------------------|----------------------------------------|
| Week of Aug 8    | $260 million        | Reversal after 2 consecutive weeks of outflows |
| Aug 6            | $91.55 million      | ETFs reversed 4 days of asset outflows |
| October 29       | ($470.7 million)    | Sharp net outflow; record GBTC redemption |

### Gold ETF and Central Bank Flows

| Period        | Gold ETF Inflow (USD/tonne) | Central Bank Buyers (tonnes) |
|---------------|----------------------------|-----------------------------|
| August 2025   | $5.5 billion / 53 t         | Poland 67.2, Azerbaijan 34.5, Kazakhstan 22.1, China 19, Türkiye 17.2 |

---

## Risk and Return Assessment

### Bitcoin

**Pros:**
- **High Growth Potential:** Recent price action and regulatory tailwinds suggest strong upside, with targets around $150,000–$180,000.
- **Institutionalization:** ETFs, stablecoins, and retirement account rules are mainstreaming crypto exposure.
- **Structural Shifts:** Mining consolidation, AI integration, and digital asset treasury growth reinforce demand.

**Cons:**
- **Volatility:** High volatility persists, and the compression of implied volatility may precede sharp moves.
- **Regulatory Risk:** The crypto ecosystem is still subject to policy changes; regulatory setbacks could trigger sharp corrections.
- **Investor Sentiment:** The high call/put ratio could lead to rapid reversals if sentiment shifts.

### Gold

**Pros:**
- **Safe-Haven Asset:** Strong performance during times of geopolitical tension and inflation.
- **Diversification:** Correlates weakly with equities, offering portfolio protection.
- **Liquidity:** Easily tradable with low transaction costs and high global acceptance.
- **Central Bank Demand:** Sustained buying from banks and sovereigns signals long-term value.

**Cons:**
- **Limited Upside:** While prices can surge during crises, sustained growth may be limited without major shifts in macroeconomic policy.
- **Interest Rate Sensitivity:** Higher rates can weigh on gold prices, though current expectations for rate cuts support it.
- **Speculative Premiums:** Market fears and FOMO have driven prices to record highs, but valuations may be questioned by some analysts.

---

## Portfolio Considerations and Outlook

### Bitcoin as an Investment Option

Bitcoin offers the potential for outsized returns, but investors should prepare for significant price swings and rapid changes in sentiment. The asset’s utility as a speculative, alternative store of value is growing, supported by regulatory clarity and institutional inflows. However, investors should consider their risk tolerance before allocating capital, as the possibility of sharp corrections remains a concern.

### Gold as an Investment Option

Gold remains a proven shelter during uncertainty, with central bank demand and ETF inflows underpinning its long-term relevance. For conservative investors or those seeking portfolio stability, gold offers resilience against inflation and currency devaluation. It is less likely to deliver spectacular capital gains but provides essential diversification benefits.

### Comparison Table: Bitcoin vs. Gold (August 2025)

| Metric               | Bitcoin                      | Gold                        |
|----------------------|-----------------------------|-----------------------------|
| Current Price        | $124,002 (all-time high)   | $3,477/oz (record high)    |
| YTD Change           | +32%                        | +38.9% (YoY)                |
| Key Drivers          | Regulatory wins, ETFs, mining | Central bank buying, inflation hedge, safe-haven |
| Institutional Flows  | $260M (week of Aug 8)      | $5.5B (August)              |
| Volatility           | High (Call/Put Ratio 3.21x) | Low-Moderate                |
| Upward Potential     | $150K–$180K                 | $3,500–$3,700               |
| Key Risks            | Regulatory shocks, volatility| Interest rate changes       |

---

## Strategic Recommendations

- **For Aggressive Investors:** Bitcoin presents the best growth opportunity in 2025–2026, especially for those comfortable with volatility and seeking structural tailwinds.
- **For Conservative Investors:** Gold continues to offer protection, portfolio stability, and a proven historical track record as a safe-haven asset.
- **For Diversification:** Consider allocating a small percentage of capital to both, balancing growth potential (Bitcoin) and stability (gold).

---

## Conclusion

Bitcoin and gold are both attracting strong interest in 2025, but their investment profiles, risks, and return expectations differ markedly. Bitcoin’s rise is driven by regulatory progress, institutional adoption, and technical strength, with substantial upside but high volatility. Gold benefits from central bank demand, safe-haven appeal, and ETF flows, but with limited upside unless macroeconomic conditions shift dramatically.

Investors should assess their risk appetite, investment horizon, and portfolio needs before making decisions. Both assets play crucial roles in a diversified portfolio, offering unique advantages as either growth engines or stabilizing forces.

---

## References

- VanEck Crypto Monthly Recap for August 2025
- Yahoo Finance: Bitcoin and Gold price data (August 2025)
- Reuters: U.S. regulatory changes for Bitcoin
- Gold.org: August 2025 Gold Market Commentary
- Visual Capitalist: Central Bank Gold Purchases (H1 2025)
- ETFdb: Bitcoin ETF inflows (August 2025)
- M2: Bitcoin recovery and ETF flows (August 2025)
- Global and regional gold and Bitcoin price forecasts

---

**Note:** All references and data points reflect the latest market information and analysis as of August 2025.
`

export async function summarize(content: string): Promise<Summarization> {
  const client = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
    baseURL: process.env['OPENAI_API_BASE']
  })

  const instructions = `Based on the given AI-generated deep research, output in JSON format "action" and "reasoning".
  Action should be exactly either "SELL" or "BUY", while "reasoning" should contain your detailed reasoning of why you decided on that action.
  Generally, if the report indicates that it is a bearish trend, the action should be "SELL", or else the action should be "BUY".
  ---

  Example: {"action": "BUY", "reasoning": "The research done by the research agent indicates..."}`

  console.log("[Summarization Instructions]")
  console.log(instructions)

  const completion = await client.chat.completions.create({
    model: process.env['OPENAI_MODEL'] ?? 'qwen/qwen3-30b-a3b-instruct-2507',
    messages: [
      { role: 'system', content: instructions},
      { role: 'user', content },
    ],
    // @ts-expect-error
    enable_thinking: false
  })

  let response = ""
  try {
    const parsedResponse = extractJson<Summarization>(completion.choices[0]?.message.content ?? "{}")
    if(!parsedResponse || !parsedResponse.action || !parsedResponse.reasoning) {
      throw new Error()
    }

    return parsedResponse
  } catch(e) {
      throw new Error(`Invalid response returned by summarizer: ${response}`)
  }
}