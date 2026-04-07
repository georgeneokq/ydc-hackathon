import OpenAI from "openai"
import { extractJson } from "./llm/extract"

type Summarization = {
  action: string
  reasoning: string
}

export const testReport = `
# 📈 Market Trend Analysis Report

---

## 1. Executive Summary

This report analyzes recent price movements, trading volume, and market indicators to assess whether the current trend is **bullish** or **bearish**.
Based on the data observed over the past four weeks, the overall trend shows **bullish momentum**, supported by higher highs, increasing volume, and positive sentiment indicators.

---

## 2. Data Overview

| Metric                        | 30 Days Ago | 7 Days Ago | Current | Change (%) |
| ----------------------------- | ----------- | ---------- | ------- | ---------- |
| Price (USD)                   | 1,820       | 1,970      | 2,050   | +12.6%     |
| 7-day Moving Average          | 1,850       | 1,920      | 2,000   | +8.1%      |
| RSI (Relative Strength Index) | 48          | 56         | 63      | —          |
| Volume (in Millions)          | 32          | 41         | 45      | +40.6%     |

**Data Source:** Aggregated from public market feeds and technical chart analysis.

---

## 3. Technical Indicators

### 3.1 Moving Averages

* **50-day MA:** 1,940
* **200-day MA:** 1,780
* **Crossover:** The 50-day MA has crossed above the 200-day MA, forming a **golden cross**, a common bullish signal.

### 3.2 Relative Strength Index (RSI)

* Current RSI = **63**, indicating momentum is strong but not yet in overbought territory (>70).
  → Suggests further upward potential before major correction risk.

### 3.3 Volume Trend

* Sustained rise in trading volume over the past two weeks suggests **growing investor confidence** and **increased participation** in the uptrend.

---

## 4. Sentiment Analysis

| Source          | Sentiment           | Key Takeaways                                                 |
| --------------- | ------------------- | ------------------------------------------------------------- |
| News Headlines  | Positive            | Coverage highlights earnings growth and favorable regulations |
| Social Media    | Neutral to Positive | Discussions show cautious optimism                            |
| Analyst Reports | Positive            | 70% of reports issued "Buy" recommendations in the past week  |

Overall sentiment aligns with the observed technical uptrend.

---

## 5. Conclusion

Based on the combined analysis of **technical**, **volume**, and **sentiment** data:

> **Current Market Condition: 🟢 Bullish**
>
> * Uptrend confirmed by higher highs and golden cross.
> * RSI shows room for further upward movement.
> * Market sentiment and volume both support continuation.

Investors should monitor for potential **resistance around 2,100 USD** and reassess if RSI exceeds 70 or volume begins to decline sharply.

---

## 6. Recommendations

| Time Horizon | Outlook            | Suggested Action                           |
| ------------ | ------------------ | ------------------------------------------ |
| Short Term   | Bullish            | Consider short-term entries near pullbacks |
| Medium Term  | Bullish            | Hold or add positions gradually            |
| Long Term    | Cautiously Bullish | Re-evaluate if macroeconomic data weakens  |
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