import { ethers, Wallet } from "ethers"
import { getERC20TokenAllowance } from "./read"
import { SwapParams, Token } from "@/types"
import { VELORA_ADDRESS } from "@/constants/address"
import { approveERC20Token } from "./approve"
import { quoteVelora } from "./aggregators/velora"

export async function swapAsset(wallet: Wallet, chainId: string, sellAmount: string, slippage: string, sellToken: Token, buyToken: Token) {
  const swapParams: SwapParams = {
    sellToken,
    buyToken,
    chainId,
    sellAmount,
    taker: wallet.address,
    slippage: slippage,
    quoteOnly: false
  }

  // Approve velora if not enough approved
  const allowance = await getERC20TokenAllowance(sellToken.address_hash, wallet.address, VELORA_ADDRESS)
  const sellAmountUint256 = ethers.parseUnits(sellAmount, sellToken.decimals)
  if(allowance < sellAmountUint256) {
    // To save gas, we approve 5 times worth
    const approveAmount = sellAmountUint256 * 5n
    const receipt = await approveERC20Token(sellToken.address_hash, wallet.privateKey, VELORA_ADDRESS, approveAmount)
    if(!receipt) {
      console.error(`Failed to approve ${sellToken.symbol}`)
      return false
    } else {
      console.log(`Approved ${ethers.formatUnits(approveAmount, sellToken.decimals)} ${sellToken.symbol}`)
    }
  }

  const quote = await quoteVelora(swapParams)
  if(!quote.callData) {
      console.error('Failed to get velora calldata')
      return false
  }

  const tx = await wallet.sendTransaction(quote.callData);
  await tx.wait();

  console.log(`Successfully swapped ${sellAmount} ${sellToken.symbol} to ${buyToken.symbol}.`)

  return true
}
