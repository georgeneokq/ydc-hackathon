import { USDC_ADDRESS, WBTC_ADDRESS } from "@/constants/address"
import { usdcToken, wbtcToken } from "@/constants/tokens"
import { getERC20TokenBalance } from "@/lib/read"
import prisma from "@/prisma"
import { User } from "@prisma/client"
import { ethers, Wallet } from "ethers"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  // TODO: Replace hard coded with multi user
  let user = await prisma.user.findFirst()
  
  // Seed user
  if(!user) {
    user = await prisma.user.create({
      data: {
        sellToken: 'USDC',
        buyToken: 'WBTC',
        sellAmount: '10',
      }
    })
  }

  // TODO: Replace hard coded wallet address with wallet from derivation path
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY!)
  const usdcBalance = await getERC20TokenBalance(USDC_ADDRESS, wallet.address)
  const usdcBalanceFloat = ethers.formatUnits(usdcBalance, usdcToken.decimals)
  const wbtcBalance = await getERC20TokenBalance(WBTC_ADDRESS, wallet.address)
  const wbtcBalanceFloat = ethers.formatUnits(wbtcBalance, wbtcToken.decimals)

  return NextResponse.json({
    ...user,
    sellTokenBalance: usdcBalanceFloat,
    buyTokenBalance: wbtcBalanceFloat,
    walletAddress: new Wallet(process.env.WALLET_PRIVATE_KEY!).address
  })
}

export async function POST(request: NextRequest) {
  let body: Partial<User> = await request.json()

  // Ensure to remove id
  body = { ...body, id: undefined }

  // TODO: Replace hard coded with multi user
  let user = await prisma.user.findFirst({
    select: {
      id: true
    }
  })

  if(!user) {
    return new NextResponse("Try calling GET /api/trade/config first.", { status: 400 })
  }

  user = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...body
    }
  })

  return NextResponse.json({
    ...user,
  })
}
