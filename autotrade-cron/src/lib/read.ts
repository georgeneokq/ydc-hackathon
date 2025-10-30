import { Addressable, ethers } from 'ethers'
import { ERC20_ABI } from '../constants/abi'

export async function getERC20TokenBalance(
  tokenAddress: string | Addressable,
  walletAddress: string | Addressable,
  functionName = 'balanceOf',
): Promise<bigint> {
  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL)
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
  const balance = await tokenContract[functionName](walletAddress)
  return balance
}

export async function getNativeTokenBalance(
  tokenAddress: string | Addressable,
) {
  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL)
  const balance = await provider.getBalance(tokenAddress)
  return balance
}

export async function getERC20TokenAllowance(
  tokenAddress: string | Addressable,
  owner: string | Addressable,
  spender: string | Addressable,
) {
  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL)
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
  const allowance = tokenContract.allowance(owner, spender)
  return allowance
}