import { BigNumber, Utils } from 'alchemy-sdk';
import { ethers } from 'ethers'
import { sleep } from './sleep'

interface GasData {
  safeLow: {
    maxPriorityFee: number;
    maxFee: number;
  };
  standard: {
    maxPriorityFee: number;
    maxFee: number;
  };
  fast: {
    maxPriorityFee: number;
    maxFee: number;
  };
  estimatedBaseFee: number;
  blockTime: number;
  blockNumber: number;
}

async function fetchGasData() {
  // Fetch data directly from polygon gas oracle
  const response = await fetch('https://gasstation.polygon.technology/v2');
  
  // Check if the response is successful
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }

  // Parse the JSON data
  const data: GasData = (await response.json()) as GasData;
  

  const fastMaxPriorityFeePerGas = ethers.parseUnits(data.fast.maxPriorityFee.toString(), 'gwei')
  const fastMaxFeePerGas = ethers.parseUnits(data.fast.maxFee.toString(), 'gwei')
  return {
    maxPriorityFeePerGas: fastMaxPriorityFeePerGas,
    maxFeePerGas: fastMaxFeePerGas,
  }
}

export async function populateGas(retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
      try {
        const feeData = await fetchGasData()
        if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
          console.log('Unable to retrieve gas data to populate gas')
          return {
            maxPriorityFeePerGas: Utils.parseUnits('25', 'gwei'),
            maxFeePerGas: Utils.parseUnits('100', 'gwei')
          }
        }
        const props = {
          maxPriorityFeePerGas: BigNumber.from(feeData.maxPriorityFeePerGas),
          maxFeePerGas: BigNumber.from(feeData.maxFeePerGas)
        }
        console.log('Populating gas: ', { maxPriorityFeePerGas: props.maxPriorityFeePerGas, maxFeePerGas: props.maxFeePerGas })
        return props
      } catch (error) {
          console.warn(`populateGas failed (attempt ${i + 1}):`, error);
          if (i < retries - 1) await sleep(delay)
      }
    }
    // If populateGas fails but isnt needed to execute onchain calls, if its needed the onchain calls functions will throw error on their end.
    return {} // Default if all retries fail
}