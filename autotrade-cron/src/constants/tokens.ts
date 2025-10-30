import { Token } from "../types";
import { USDC_ADDRESS, WBTC_ADDRESS } from "./address";

export const usdcToken: Token = {
  symbol: "USDC",
  address_hash: USDC_ADDRESS,
  decimals: 6
}

export const wbtcToken: Token = {
  symbol: "WBTC",
  address_hash: WBTC_ADDRESS,
  decimals: 8
}
