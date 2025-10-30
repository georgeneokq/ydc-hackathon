import { getTokenBySymbol } from "@/constants/tokens";
import { quoteVelora } from "@/lib/aggregators/velora";
import { SwapParams } from "@/types";
import { ethers, Wallet } from "ethers";
import { NextResponse, type NextRequest } from "next/server";

const CHAIN_ID = "137"
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY ?? ""

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const sellTokenSymbol = params.get("sellToken") ?? ""
  const buyTokenSymbol = params.get("buyToken") ?? ""
  const sellToken = getTokenBySymbol(sellTokenSymbol)
  const buyToken = getTokenBySymbol(buyTokenSymbol)

  if(!sellToken || !buyToken) {
    return new NextResponse("Invalid buy/sell token", { status: 400 })
  }

  const sellAmount = params.get("sellAmount")
  console.log(sellToken)
  console.log(sellAmount)

  if(!sellAmount) {
    return new NextResponse("Invalid sell amount", { status: 400 })
  }

  const wallet = new Wallet(
    WALLET_PRIVATE_KEY,
  )

  // 0.5% slippage
  const swapParams: SwapParams = {
    sellToken,
    buyToken,
    sellAmount: sellAmount,
    chainId: CHAIN_ID,
    taker: wallet.address,
    slippage: "50",
    quoteOnly: true
  }

  const quote = await quoteVelora(swapParams)
  return NextResponse.json({
    quote: ethers.formatUnits(quote.quoteAmount, buyToken.decimals)
  })
}
