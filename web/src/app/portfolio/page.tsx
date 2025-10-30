import MainLayout from '../main-layout';

export default function PortfolioPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Portfolio Analysis</h1>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <p className="text-gray-700">
              Comprehensive analysis of your investment portfolio with AI-driven insights to optimize performance and manage risk.
            </p>
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Features:</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Detailed portfolio performance metrics</li>
                <li>Risk assessment and analysis</li>
                <li>Asset allocation recommendations</li>
                <li>Correlation analysis between holdings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}