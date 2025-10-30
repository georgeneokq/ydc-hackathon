// import { Contract, TransactionResponse, Wallet } from "alchemy-sdk"
import { Contract, JsonRpcProvider, TransactionResponse, Wallet } from "ethers"
import { Abi } from "../types/abi"
import { ERC20_ABI } from "../constants/abi"

export async function approveERC20Token(
  tokenAddress: string,
  approverPrivateKey: string,
  spender: string,
  addValue: number | BigInt,
) {
  const provider = new JsonRpcProvider(process.env.PROVIDER_URL)
  const signer = new Wallet(
    approverPrivateKey,
    provider
  )

  const contract = new Contract(tokenAddress, ERC20_ABI, signer)
  // const estimatedGas = await contract.estimateGas.approve(spender, addValue)
  // console.log(`Estimated gas: ${estimatedGas.toBigInt()}`)
  // const gasLimit = estimatedGas.mul(21).div(20) // 5% buffer
  const tx: TransactionResponse = await contract.approve(spender, addValue)
  console.log(tx)

  // 30 minutes timeout
  const receipt = await tx.wait()
  if (receipt) {
      return receipt
  }
}