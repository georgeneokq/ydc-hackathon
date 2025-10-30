import { USDC_ADDRESS, WBTC_ADDRESS } from "@/constants/address";
import { usdcToken, wbtcToken } from "@/constants/tokens";
import { getERC20TokenBalance } from "@/lib/read";
import { swapAsset } from "@/lib/swap";
import prisma from "@/prisma";
import { Wallet } from "ethers";
import { ethers } from "ethers";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // TODO: Replace hard coded with multi user
  const user = await prisma.user.findFirst()

  if(!user) {
    return new NextResponse("User does not exist", { status: 400 })
  }

  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL)
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY!, provider)
  const chainId = "137"
  let success = false

  const [usdcBalance, wbtcBalance] = await Promise.all([
    getERC20TokenBalance(USDC_ADDRESS, wallet.address),
    getERC20TokenBalance(WBTC_ADDRESS, wallet.address)
  ])

  // Default 0.5% slippage
  success = await swapAsset(wallet, chainId, ethers.formatUnits(wbtcBalance, wbtcToken.decimals), "50", wbtcToken, usdcToken)
  if(success) {
    const [usdcBalanceNew, wbtcBalanceNew] = await Promise.all([
      getERC20TokenBalance(USDC_ADDRESS, wallet.address),
      getERC20TokenBalance(WBTC_ADDRESS, wallet.address)
    ])
    const usdcBalanceFloatNew = ethers.formatUnits(usdcBalanceNew, 6)
    const wbtcBalanceFloatNew = ethers.formatUnits(wbtcBalanceNew, 8)

    // Calculate amounts sent/received.
    // TODO: Not optimal it does not consider a case where tokens are transferred in during processing. Find a better solution
    const usdcBalanceDifference = ethers.formatUnits(usdcBalanceNew - usdcBalance, usdcToken.decimals)
    const wbtcBalanceDifference = ethers.formatUnits(wbtcBalance - wbtcBalanceNew, wbtcToken.decimals)

    const reasoning = `User requested to sell off all ${wbtcToken.symbol}.`

    // Create transaction record
    await prisma.transaction.create({
      data: {
        reasoning,
        userId: user.id,
        sellToken: wbtcToken.symbol,
        buyToken: usdcToken.symbol,
        sellAmount: wbtcBalanceDifference,
        buyAmount: usdcBalanceDifference
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
}