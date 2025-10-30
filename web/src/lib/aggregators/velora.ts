import { ethers } from "ethers"
import type { SwapParams, Quotation } from "@/types"

// Velora (Paraswap)
// No partner fees, only take positive slippage
async function getVeloraRoute(swapParams: SwapParams) {
  const { sellToken, buyToken, sellAmount, chainId } = swapParams;
  const url = new URL(`https://api.paraswap.io/prices`);
  const params: Record<string, any> = {
    version: "6.2",
    srcToken: sellToken.address_hash,
    srcDecimals: sellToken.decimals.toString(),
    destToken: buyToken.address_hash,
    destDecimals: buyToken.decimals.toString(),
    amount: ethers.parseUnits(sellAmount, Number(sellToken.decimals)).toString(),
    network: chainId,
    partner: process.env.AGGREGATOR_PARTNER!,
    excludeContractMethodsWithoutFeeModel: true,
  };
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Velora API error: ${res.statusText}`);
  return (await res.json() as any)?.priceRoute;
}

export async function quoteVelora(swapParams: SwapParams): Promise<Quotation> {
  const { sellToken, buyToken, sellAmount, chainId, taker, slippage, quoteOnly } = swapParams;
  const priceRoute = await getVeloraRoute(swapParams);
  const quoteAmount = priceRoute.destAmount
  if (quoteOnly) {
    return {
      quoteAmount,
      estimatedGas: priceRoute.gasCost,
      callData: null,
			approval: { 
			  spender: priceRoute.tokenTransferProxy,
			  amountWei: ethers.parseUnits(sellAmount, Number(sellToken.decimals)).toString()
	    }
    }
  }
  const url = new URL(`https://api.paraswap.io/transactions/${chainId}`);
  const partner = process.env.AGGREGATOR_PARTNER ?? undefined
  const partnerAddress = process.env.AGGREGATOR_AFFILIATE_FEE_RECIPIENT! ?? undefined
  const params: Record<string, any> = {
    srcToken: sellToken.address_hash,
    srcDecimals: sellToken.decimals.toString(),
    destToken: buyToken.address_hash,
    destDecimals: buyToken.decimals.toString(),
    srcAmount: ethers.parseUnits(sellAmount, Number(sellToken.decimals)).toString(),
    userAddress: taker,
    txOrigin: taker,
    receiver: taker,
    partner,
    partnerAddress,
    takeSurplus: !!partner,
    isDirectFeeTransfer: !!partner,
    slippage,
    deadline: (Math.floor(Date.now()/1000) + 300).toString(),
    priceRoute
  };

  const res = await fetch(url.toString(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
  const callData: any = await res.json();
  if (callData?.error) {
    console.log(callData.error)
    return {
      quoteAmount: "0",
      estimatedGas: "0",
      callData: null,
		  approval: {
		    spender: "",
		    amountWei: "", 
		  }
    }
  }
  return {
    quoteAmount,
    estimatedGas: priceRoute.gasCost,
    callData,
		approval: { 
		  spender: "",
		  amountWei: ""
    }
  }
}