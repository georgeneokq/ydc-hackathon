import { User } from "@prisma/client"

export type TradeResponse = {
  swapped: boolean
  reasoning: string
  updatedSellTokenBalance?: number
  updatedBuyTokenBalance?: number  
}

export interface UserConfigResponse extends User {
  walletAddress: string
  sellTokenBalance: number
  buyTokenBalance: number
}
