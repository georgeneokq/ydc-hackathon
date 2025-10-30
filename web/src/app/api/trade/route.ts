import prisma from "@/prisma"
import { ethers, Wallet } from "ethers"
import { NextResponse, type NextRequest } from "next/server"
import { summarize, sampleBtcReport } from "@/lib/summarize"
import { swapAsset } from "@/lib/swap"
import { usdcToken, wbtcToken } from "@/constants/tokens"
import { getERC20TokenBalance } from "@/lib/read"
import { USDC_ADDRESS, WBTC_ADDRESS } from "@/constants/address"
import { Agent } from "undici"


export async function POST(request: NextRequest) {
  // TODO: Replace hard coded with multi user
  let user = await prisma.user.findFirst()

  if(!user) {
    return new NextResponse("User does not exist", { status: 400 })
  }

  const body = await request.json()
  const sellToken = body.sellToken
  const buyToken = body.buyToken
  const sellAmount = body.sellAmount

  // // Deep research with 2 hour timeout
  console.log(`Waiting for deep research response for up to 2 hours...`)
  const agent = new Agent({
    connect: { timeout: 7200000 },
    headersTimeout: 7200000,
    bodyTimeout: 7200000
  })
  const deepResearchEndpoint = `${process.env.DEEP_RESEARCH_API_URL}/generate`
  const question = `Analyzing price trends of ${buyToken}, does it show bullish or bearish trend?`
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

  const answer = results["prediction"]
  // const answer = testReport

  console.log("Research content:")
  console.log(answer)

  const { action, reasoning } = await summarize(answer)

  if(!["BUY", "SELL"].includes(action.toUpperCase())) {
    console.error("Unexpected output from the summarization process: ", action)
    return
  }

  console.log(`Action: ${action}`)
  
  // const action = "BUY"
  const shouldBuy = action === "BUY"

  // Swap bitcoin (currently only on Polygon)
  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL)
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY!, provider)
  const chainId = "137"
  let success = false
  if(shouldBuy) {
    const [usdcBalance, wbtcBalance] = await Promise.all([
      getERC20TokenBalance(USDC_ADDRESS, wallet.address),
      getERC20TokenBalance(WBTC_ADDRESS, wallet.address)
    ])
    
    // Default 0.5% slippage
    success = await swapAsset(wallet, chainId, sellAmount, "50", usdcToken, wbtcToken)
    if(success) {
      const [usdcBalanceNew, wbtcBalanceNew] = await Promise.all([
        getERC20TokenBalance(USDC_ADDRESS, wallet.address),
        getERC20TokenBalance(WBTC_ADDRESS, wallet.address)
      ])
      const usdcBalanceFloatNew = ethers.formatUnits(usdcBalanceNew, 6)
      const wbtcBalanceFloatNew = ethers.formatUnits(wbtcBalanceNew, 8)

      // Calculate amounts sent/received.
      // TODO: Not optimal it does not consider a case where tokens are transferred in during processing. Find a better solution
      const usdcBalanceDifference = ethers.formatUnits(usdcBalance - usdcBalanceNew, usdcToken.decimals)
      const wbtcBalanceDifference = ethers.formatUnits(wbtcBalanceNew - wbtcBalance, wbtcToken.decimals)

      // Create transaction record
      await prisma.transaction.create({
        data: {
          reasoning,
          userId: user.id,
          sellToken: usdcToken.symbol,
          buyToken: wbtcToken.symbol,
          sellAmount: usdcBalanceDifference,
          buyAmount: wbtcBalanceDifference
        }
      })

      return NextResponse.json({
        reasoning,
        swapped: true,
        updatedSellTokenBalance: usdcBalanceFloatNew,
        updatedBuyTokenBalance: wbtcBalanceFloatNew,
      })
    } else {
      console.error("Error occurred while swapping asset.")
    }

    return NextResponse.json({
      swapped: false,
      reasoning: "Server side error in swapping asset, please contact our team at trade@smartfinance.com for assistance.",
    })

  } else {
    return NextResponse.json({
      reasoning,
      swapped: false,
    })
  }

}

