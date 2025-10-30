import { CronJob } from "cron";
import { ethers, Wallet } from "ethers";
import { Agent } from "undici";
import prisma from "./prisma";
import { USDC_ADDRESS, WBTC_ADDRESS } from "./constants/address";
import { usdcToken, wbtcToken } from "./constants/tokens";
import { getERC20TokenBalance } from "./lib/read";
import { swapAsset } from "./lib/swap";
import { summarize } from "./lib/summarize";
import { testReport } from "./test";

// ────────────────────────────────────────────────────────────────
// Helper function: perform research + trade for a single user
// ────────────────────────────────────────────────────────────────
async function researchAndBuyForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    console.log(`[User ${userId}] User not found`);
    return;
  }

  const { sellToken, buyToken, sellAmount } = user;

  console.log(`[User ${userId}] Starting research for ${buyToken}...`);

  const agent = new Agent({
    connect: { timeout: 7200000 },
    headersTimeout: 7200000,
    bodyTimeout: 7200000,
  });

  const deepResearchEndpoint = `${process.env.DEEP_RESEARCH_API_URL}/generate`;
  const question = `Analyzing price trends of ${buyToken}, does it show bullish or bearish trend?`;

  const response = await fetch(deepResearchEndpoint, {
    // @ts-ignore
    dispatcher: agent,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const results = await response.json()
  const answer = results["prediction"];

  // const answer = testReport; // For testing

  console.log(`[User ${userId}] Research content:`);
  console.log(answer);

  const { action, reasoning } = await summarize(answer);

  if (!["BUY", "SELL"].includes(action.toUpperCase())) {
    console.error(`[User ${userId}] Unexpected summarization output:`, action);
    return;
  }

  const shouldBuy = action.toUpperCase() === "BUY";
  console.log(`[User ${userId}] Action: ${action}`);

  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY!, provider);
  const chainId = "137";

  if (shouldBuy) {
    const [usdcBalance, wbtcBalance] = await Promise.all([
      getERC20TokenBalance(USDC_ADDRESS, wallet.address),
      getERC20TokenBalance(WBTC_ADDRESS, wallet.address),
    ]);

    const success = await swapAsset(wallet, chainId, sellAmount, "50", usdcToken, wbtcToken);

    if (success) {
      const [usdcBalanceNew, wbtcBalanceNew] = await Promise.all([
        getERC20TokenBalance(USDC_ADDRESS, wallet.address),
        getERC20TokenBalance(WBTC_ADDRESS, wallet.address),
      ]);

      const usdcBalanceDifference = ethers.formatUnits(
        usdcBalance - usdcBalanceNew,
        usdcToken.decimals
      );
      const wbtcBalanceDifference = ethers.formatUnits(
        wbtcBalanceNew - wbtcBalance,
        wbtcToken.decimals
      );

      await prisma.transaction.create({
        data: {
          reasoning,
          userId: user.id,
          sellToken: usdcToken.symbol,
          buyToken: wbtcToken.symbol,
          sellAmount: usdcBalanceDifference,
          buyAmount: wbtcBalanceDifference,
        },
      });

      console.log(`[User ${userId}] Purchase of ${buyToken} completed.`);
    } else {
      console.error(`[User ${userId}] Error occurred while swapping asset.`);
    }
  } else {
    console.log(`[User ${userId}] Did not purchase ${buyToken}. Reason: ${reasoning}`);
  }
}

// ────────────────────────────────────────────────────────────────
// Batch runner: fetch users and run trades by frequency
// ────────────────────────────────────────────────────────────────
async function processTradesByFrequency(frequency: "hourly" | "daily" | "weekly") {
  console.log(`[${frequency.toUpperCase()}] Fetching users...`);

  const users = await prisma.user.findMany({
    where: {
      active: true,
      tradeFrequency: frequency
    },
  });

  console.log(`[${frequency.toUpperCase()}] Found ${users.length} users`);

  for (const user of users) {
    try {
      await researchAndBuyForUser(user.id);
    } catch (err) {
      console.error(`[${frequency.toUpperCase()}] Error processing user ${user.id}:`, err);
    }
  }

  console.log(`[${frequency.toUpperCase()}] All users processed.`);
}

// ────────────────────────────────────────────────────────────────
// CRON JOBS
// ────────────────────────────────────────────────────────────────

// Hourly job: runs every hour at minute 0
new CronJob(
  "0 * * * *",
  () => processTradesByFrequency("hourly"),
  null,
  true,
  "Asia/Singapore"
);

// Daily job: runs every day at midnight
new CronJob(
  "0 0 * * *",
  () => processTradesByFrequency("daily"),
  null,
  true,
  "Asia/Singapore"
);

// Weekly job: runs every Sunday at midnight
new CronJob(
  "0 0 * * 0",
  () => processTradesByFrequency("weekly"),
  null,
  true,
  "Asia/Singapore"
);

console.log("Cron jobs scheduled: hourly, daily, weekly.");
