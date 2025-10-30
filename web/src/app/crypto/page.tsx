'use client';

import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../main-layout';
import type { Transaction, User } from '@prisma/client';
import { TradeResponse, UserConfigResponse } from '@/types/response';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr/fetcher';

export default function CryptoPage() {
  const [tradeResponseMessage, setTradeResponseMessage] = useState("")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tradingInProgress, setTradingInProgress] = useState(false)
  const [sellAllMessage, setSellAllMessage] = useState("")
  const [sellAllInProgress, setSellAllInProgress] = useState(false)

  const { data: userConfig, isLoading: isUserConfigLoading, mutate: mutateUserConfig } = useSWR<UserConfigResponse>('/api/trade/config', fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  })

  const quoteUrl = useMemo(() => {
    if(userConfig && userConfig.buyTokenBalance > 0) {
      // Build params for selling the buy token
      const searchParams = new URLSearchParams()
      searchParams.set("sellToken", userConfig.buyToken)
      searchParams.append("buyToken", userConfig.sellToken)
      searchParams.append("sellAmount", userConfig.buyTokenBalance.toString())
      return `/api/trade/quote?${searchParams.toString()}`
    }
  }, [userConfig])

  const { data: sellQuote } = useSWR<{quote: string}>(quoteUrl, fetcher, {
    refreshInterval: 30000
  })

  const toggleAutoTrading = () => {
    if(!userConfig) return
    mutateUserConfig({...userConfig, active: !userConfig.active}, false)
  };

  const saveConfiguration = async () => {
    if(!userConfig) return
    const config = {
      active: userConfig.active,
      sellToken: userConfig.sellToken,
      buyToken: userConfig.buyToken,
      sellAmount: userConfig.sellAmount,
      tradeFrequency: userConfig.tradeFrequency,
    };

    try {
      const response = await fetch('/api/trade/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if(response.status !== 200) {
        alert("Unknown error in saving configuration.")
      } else {
        alert('Configuration saved successfully!');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error saving configuration. Please try again.');
    }
  }

  // TODO: Use SWR for sell all and disable while loading.
  const sellAll = async () => {
    setSellAllInProgress(true)
    setSellAllMessage("Selling, please wait...")
    try {
      const response = await fetch('/api/trade/sell', {
        method: 'POST',
      })
      
      if (response.status === 200) {
        setSellAllMessage("Success! You may confirm your transaction below.")
        mutateUserConfig()
        fetchTransactions().then(data => setTransactions(data))
      } else {
        setSellAllMessage("Failed to sell. Please try again.")
      }
    } catch (error) {
      setSellAllMessage("Failed to sell. Please try again.")
      console.error("Error selling all:", error)
    } finally {
      setSellAllInProgress(false)
    }
  }

  const manuallyTriggerBuy = async () => {
    if(!userConfig) return
    setTradeResponseMessage("Conducting research before deciding whether to swap. This may take some time.")
    setTradingInProgress(true)
    try {
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sellToken: userConfig.sellToken,
          buyToken: userConfig.buyToken,
          sellAmount: userConfig.sellAmount,
        })
      })
      const { swapped, reasoning, updatedSellTokenBalance, updatedBuyTokenBalance }: TradeResponse = await response.json()
      if (!swapped) {
        setTradeResponseMessage(reasoning)
      } else {
        setTradeResponseMessage("Successfully swapped!")

        // Update transactions
        setTransactions(await fetchTransactions())

        // Update token balances, no change in the case of unexpected error
        mutateUserConfig({
          ...userConfig,
          sellTokenBalance: updatedSellTokenBalance ?? userConfig.sellTokenBalance,
          buyTokenBalance: updatedBuyTokenBalance  ?? userConfig.buyTokenBalance
        })
      }
    } catch (e) {
      console.log(e)
      setTradeResponseMessage("Unknown error occurred.")
    }
    finally {
      setTradingInProgress(false)
    }
  }

  const fetchTransactions = async () => {
    const response = await fetch('/api/trade/transactions')
    let data: Transaction[] = await response.json()
    data = data.map(transaction => ({
      ...transaction,
      createdAt: new Date(transaction.createdAt),
      updatedAt: new Date(transaction.updatedAt)
    }))
    return data
  }

  useEffect(() => {
    // getUserConfig()
    fetchTransactions().then(data => setTransactions(data))
  }, [])

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cryptocurrency Auto Trading</h1>

          {/* Description Section */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">About This Page</h2>
            <p className="text-gray-700">
              This page allows you to configure and manage your cryptocurrency auto buying settings.
              We handle automatic buying of cryptocurrencies based on AI-driven market analysis,
              while you remain responsible for selling. We are currently working on an auto sell feature as well.
              You can monitor your wallet balances, track transaction history, and manually trigger buys when needed.
            </p>
          </div>

          {/* Configuration Section */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6 relative">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Auto Trading Configuration</h2>

            {isUserConfigLoading && (
              <div className="absolute inset-0 bg-gray-200 bg-opacity-70 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                  <p className="text-gray-700 font-medium">Loading configuration...</p>
                </div>
              </div>
            )}

            {
              userConfig && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Auto Trading Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto Trading Status
                    </label>
                    <div className="flex items-center">
                      <span className={`mr-3 text-sm ${userConfig.active ? 'text-green-600' : 'text-gray-500'}`}>
                        {userConfig.active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={toggleAutoTrading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${userConfig.active ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        disabled={isUserConfigLoading}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userConfig.active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Sell Token Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sell Token
                    </label>
                    <select
                      value={userConfig.sellToken}
                      onChange={(e) => mutateUserConfig({...userConfig, sellToken: e.target.value}, false)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      disabled={isUserConfigLoading}
                    >
                      <option value="usdc">USDC</option>
                    </select>
                  </div>

                  {/* Buy Token Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buy Token
                    </label>
                    <select
                      value={userConfig.buyToken}
                      onChange={(e) => mutateUserConfig({...userConfig, buyToken: e.target.value}, false)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      disabled={isUserConfigLoading}
                    >
                      <option value="WBTC">Bitcoin</option>
                    </select>
                  </div>

                  {/* Sell Amount Per Transaction */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sell Amount Per Transaction ({userConfig.sellToken})
                    </label>
                    <input
                      placeholder="Enter amount"
                      value={userConfig.sellAmount}
                      // onChange={(e) => setSellAmountPerTransaction(parseFloat(e.target.value) || 0)}
                      onChange={(e) => mutateUserConfig({...userConfig, sellAmount: e.target.value}, false)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      disabled={isUserConfigLoading}
                    />
                  </div>

                  {/* Trade Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trade Frequency
                    </label>
                    <div className="space-y-2">
                      {['hourly', 'daily', 'weekly'].map((frequency) => (
                        <div key={frequency} className="flex items-center">
                          <input
                            type="radio"
                            id={`frequency-${frequency}`}
                            name="trade-frequency"
                            value={frequency}
                            checked={userConfig.tradeFrequency === frequency}
                            onChange={(e) => mutateUserConfig({...userConfig, tradeFrequency: e.target.value}, false)}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            disabled={isUserConfigLoading}
                          />
                          <label htmlFor={`frequency-${frequency}`} className="ml-2 block text-sm text-gray-700 capitalize">
                            {frequency}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }

            <div className="mt-6">
              <button
                onClick={saveConfiguration}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                disabled={isUserConfigLoading}
              >
                Save Configuration
              </button>
            </div>
          </div>

          {/* Wallet Balance Section */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Wallet Balance</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-medium text-gray-700">Sell Token Balance</h3>
                <p className="text-2xl font-bold mt-1">{userConfig?.sellTokenBalance ?? 0} {userConfig?.sellToken}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-medium text-gray-700">Buy Token Balance</h3>
                <p className="text-2xl font-bold mt-1">{userConfig?.buyTokenBalance ?? 0} {userConfig?.buyToken}</p>
              </div>
            </div>

            {/* Conditional Warning */}
            {(userConfig?.sellTokenBalance ?? 0) < +(userConfig?.sellAmount ?? 0) && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Auto-buy Warning</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Auto buying will fail because your current {userConfig?.sellToken} balance ({userConfig?.sellTokenBalance ?? 0} {userConfig?.sellToken}) is below
                        the configured amount per transaction ({userConfig?.sellAmount} {userConfig?.sellToken}).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Wallet Address: <span className="font-mono">{userConfig?.walletAddress}</span>
              </p>

              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium">Balance Top Up:</p>
                <p className="mt-1">Please deposit USDC to the above wallet address on the Polygon chain.</p>
                <p className="mt-2 text-red-600 font-medium">
                  <span className="font-bold">Important:</span> Funds may be lost if sent using the wrong token or chain.
                  Always send a small amount to test first.
                </p>
                <p className="mt-2">
                  If you're not sure how to make a transaction on your own, you can reach out to our team at{' '}
                  <a href="mailto:general@smartfinance.com" className="text-blue-600 hover:underline">
                    general@smartfinance.com
                  </a>{' '}
                  to deposit fiat instead.
                </p>
              </div>
            </div>
          </div>

          {/* Simulated Profits Section */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Simulated Profits</h2>

            <div className="border border-gray-200 rounded-lg flex flex-col space-y-4 p-4">
              <div className="py-4">
                <h3 className="text-md font-medium text-gray-700">Potential Profits</h3>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  +{sellQuote?.quote ?? 0} {userConfig?.sellToken}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Estimated profit if all {userConfig?.buyToken} were sold at current market rates
                </p>
              </div>
              <div className="border-t py-4">
                <h3 className="text-md font-medium text-gray-700">Potential Total {userConfig?.sellToken}</h3>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {(+(sellQuote?.quote ?? 0) + +(userConfig?.sellTokenBalance ?? 0)).toFixed(6)} {userConfig?.sellToken}
                </p>
              </div>
            </div>
          </div>

          {/* Sell All Button. Disable if no tokens to sell, or selling in progress */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
            <button
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
              onClick={() => sellAll()}
              disabled={(userConfig?.buyTokenBalance ?? 0) <= 0 || sellAllInProgress}
            >
              Sell All {userConfig?.buyToken}
            </button>

            {sellAllMessage && (
              <div className={`mt-4 p-4 rounded-lg ${sellAllMessage === "Success!" ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {sellAllMessage === "Success!" ? (
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${sellAllMessage === "Success!" ? 'text-green-800' : 'text-blue-800'}`}>
                      {sellAllMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Buy Trigger. Disable if sell token balance not sufficient, or buying in progress */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
            <button
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
              onClick={() => manuallyTriggerBuy()}
              disabled={(userConfig?.sellTokenBalance ?? 0) < +(userConfig?.sellAmount ?? 0) || tradingInProgress}
            >
              Manually Trigger Buy {userConfig?.buyToken}
            </button>

            {tradeResponseMessage && (
              <div className={`mt-4 p-4 rounded-lg ${tradeResponseMessage.includes('Successfully') ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {tradeResponseMessage.includes('Successfully') ? (
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${tradeResponseMessage.includes('Successfully') ? 'text-green-800' : 'text-blue-800'}`}>
                      {tradeResponseMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 text-sm text-gray-600">
              <p>
                <span className="font-medium">Note:</span> This manual trigger works the same as auto buy,
                where buying is only done after comprehensive analysis done by our AI agent indicates
                that it is safe to buy in.
              </p>
            </div>

            {(userConfig?.sellTokenBalance ?? 0) < +(userConfig?.sellAmount ?? 0) && (
              <p className="text-sm text-gray-600 mt-2 text-center text-red-600">
                Insufficient {userConfig?.sellToken} balance for buying
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Auto-buy Transaction List - Separate Row */}
      <div className="max-w-6xl mx-auto pb-6 sm:px-6 lg:px-8">
        <div className="px-4 py-0 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Auto-Buy Transaction Log</h2>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-600">Sell Amount</p>
                        <p className="font-medium">{transaction.sellAmount} {transaction.sellToken}</p>
                      </div>
                      <div className="text-center mx-2">
                        <span className="text-gray-400">→</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Buy Amount</p>
                        <p className="font-medium">{transaction.buyAmount} {transaction.buyToken}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-gray-600">Reasoning</p>
                      <p className="text-sm">{transaction.reasoning}</p>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      {`${transaction.createdAt.toLocaleDateString()} ${transaction.createdAt.toLocaleTimeString()}`}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No transactions recorded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// // Mock data for auto-buy transactions
// const autoBuyTransactions = [
//   {
//     sellAmount: 100,
//     buyAmount: 0.005,
//     reasoning: "AI analysis indicates Bitcoin is undervalued based on technical indicators",
//     timestamp: "2024-01-15 10:30:45"
//   },
//   {
//     sellAmount: 250,
//     buyAmount: 0.012,
//     reasoning: "Market dip detected, optimal buying opportunity for Ethereum",
//     timestamp: "2024-01-14 14:22:10"
//   },
//   {
//     sellAmount: 180,
//     buyAmount: 0.009,
//     reasoning: "Predictive algorithm signals bullish trend for Bitcoin",
//     timestamp: "2024-01-13 09:15:33"
//   },
//   {
//     sellAmount: 300,
//     buyAmount: 0.015,
//     reasoning: "Market sentiment analysis shows positive outlook for Ethereum",
//     timestamp: "2024-01-12 16:45:22"
//   }
// ];