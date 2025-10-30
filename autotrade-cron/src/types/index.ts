import { TransactionRequest } from "ethers"

export type Token = {
  symbol: string;
  address_hash: string;
  decimals: number;
} 

export type BlockScoutResponse = {
  symbol: string;
  name: string;
  address_hash: string;
  is_verified_via_admin_panel?: boolean;
  icon_url?: string | null;
}

export type PreferredSource = 'Velora' | 'Kyberswap';

export type SwapParams = {
  sellToken: Token;
  buyToken: Token;
  sellAmount: string;
  chainId: string;
  slippage: string;
  taker: string;
  preferredSource?: PreferredSource | null;
  quoteOnly?: boolean;
}

export type Quotation = {
  quoteAmount: string;
  estimatedGas: string;
  callData: TransactionRequest | null;
  approval: {
    spender: string;
    amountWei: string; 
  };
}
