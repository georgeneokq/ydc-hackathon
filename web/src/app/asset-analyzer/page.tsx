'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from '../../components/MarkdownComponents';
import MainLayout from '../main-layout';

export default function AssetAnalyzer() {
  const [chartingAssetDescription, setChartingAssetDescription] = useState<string>('');
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);

  const [chartsData, setChartsData] = useState<any[]>([]);
  const [researchReport, setResearchReport] = useState<string | null>(null);
  const [isResearchLoading, setIsResearchLoading] = useState(false);

  const fetchCharts = async (assetDescription: string) => {
    if (!assetDescription.trim()) return;
    
    setIsChartLoading(true);
    try {
      const params = new URLSearchParams({ assetdescription: assetDescription });
      const response = await fetch(`/api/asset/charts?${params.toString()}`);
      const data = await response.json();
      if(!('error' in data)) {
        // Check if the asset already exists in the chartsData array
        const assetExists = chartsData.some(chart => chart.symbol === data.symbol);
        
        if (assetExists) {
          alert(`Chart for ${data.symbol} is already in the set.`);
        } else {
          setChartsData(prevCharts => [...prevCharts, { ...data, id: Date.now() }]); // Add unique ID for each chart
        }
      }
    } catch (error) {
      console.error('Error fetching charts:', error);
      // Don't clear all charts if there's an error, just show the error for this specific request
    } finally {
      setIsChartLoading(false);
      setChartingAssetDescription('')
    }
  };

  /**
   * 
   * @param assetDescriptions Comma delimited asset symbols
   */
  const fetchResearchReport = async (assetDescriptions: string) => {
    // API call for deep research report that returns markdown content
    try {
      setResearchReport("")
      const params = new URLSearchParams({ assetdescriptions: assetDescriptions });

      const response = await fetch(`/api/asset/research?${params.toString()}`);
      if(response.status >= 400) {
        setResearchReport("Error in generating report.")
      } else {
        const data = await response.json();
        // Assuming the API returns a markdown string in a 'content' field
        setResearchReport(data.content);
      }
    } catch (error) {
      console.error('Error fetching research report:', error);
      setResearchReport(null);
    }
  };

  const handleStartResearch = async () => {
    if (chartsData.length === 0) return;
    
    setResearchReport("")
    setIsResearchLoading(true);
    
    // Create a comma-delimited string of all asset symbols
    const assetDescriptions = chartsData.map(chart => chart.name).join(',');
    
    // Fetch research report with all displayed chart symbols
    await fetchResearchReport(assetDescriptions);
    
    setIsResearchLoading(false);
  };

  const handleChartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chartingAssetDescription.trim()) {
      fetchCharts(chartingAssetDescription);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Asset Analyzer</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <label htmlFor="assetId" className="block text-sm font-medium text-gray-700 mb-2">
              Enter asset symbol or description (e.g., AAPL, Gold, Bitcoin, etc.)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Our AI will automatically identify the correct asset and data source
            </p>
            <form onSubmit={handleChartSubmit} className="flex">
              <input
                type="text"
                id="assetId"
                value={chartingAssetDescription}
                onChange={(e) => setChartingAssetDescription(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="e.g., AAPL, Gold, Silver, Bitcoin, TSLA, etc."
              />
              <button
                type="submit"
                disabled={isChartLoading || !chartingAssetDescription.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                {isChartLoading ? 'Loading...' : 'Show Chart'}
              </button>
            </form>
          </div>

          {/* Charts section - now displays multiple charts in grid format */}
          <div className="mt-8">
            {/* Price Charts Section - displays all charts in a 2-column grid */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Price Charts (Daily)</h2>
              
              {isChartLoading && chartsData.length === 0 ? (
                <div className="w-full h-96 flex items-center justify-center">
                  <p className="text-gray-500">Loading chart...</p>
                </div>
              ) : chartsData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {chartsData.map((chart, index) => (
                    <div key={chart.id || index} className="h-96 bg-white border border-gray-200 rounded relative">
                      <div className="flex justify-between items-center p-2 border-b">
                        <h3 className="text-center font-medium text-gray-700 flex-grow">{chart.name}</h3>
                        <button 
                          onClick={() => {
                            setChartsData(prevCharts => prevCharts.filter(c => c.id !== chart.id));
                          }}
                          className="text-gray-500 hover:text-gray-700 ml-2"
                          aria-label="Close chart"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <div className="h-[calc(100%-2.5rem)]"> {/* Adjust height to account for header */}
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chart.data}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 10 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis 
                              domain={['auto', 'auto']} 
                              tick={{ fontSize: 10 }}
                              tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip 
                              formatter={(value) => [`$${value}`, chart?.symbol ? `${chart.symbol} Price (USD)` : 'Price (USD)']}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="price"
                              name={chart?.symbol ? `${chart.symbol} Price (USD)` : "Price (USD)"}
                              stroke="#3b82f6"
                              activeDot={{ r: 8 }}
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Display note if available */}
                      {chart.note && (
                        <div className="absolute bottom-2 right-2">
                          <p className="text-xs text-gray-500">
                            <Markdown components={{
                              a: (props: any) => <a href={props.href} target="_blank" rel="noreferrer" className="underline">{props.children}</a>
                            }}>
                              {chart.note}
                            </Markdown>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-96 flex items-center justify-center">
                  <p className="text-gray-500">Enter an asset symbol and click "Show Chart"</p>
                </div>
              )}
            </div>

            {/* Deep Research Section - with separate button */}
            <div className="my-6">
              <button
                type="button"
                onClick={handleStartResearch}
                disabled={chartsData.length === 0 || isResearchLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                {isResearchLoading ? 'Generating Report...' : `Start deep research comparison of ${chartsData.map(chart => chart.name).join(', ')}`}
              </button>
            </div>

            {/* Research Report Section */}
            {researchReport && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Deep Research Report</h2>
                <div className="bg-white border border-gray-200 rounded p-4">
                  <Markdown 
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {researchReport}
                  </Markdown>
                </div>
              </div>
            )}

            {/* Loading state for research report */}
            {!researchReport && isResearchLoading && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Deep Research Report</h2>
                <div className="bg-white border border-gray-200 rounded p-4 flex items-center justify-center">
                  <p className="text-gray-500">Generating research report...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}