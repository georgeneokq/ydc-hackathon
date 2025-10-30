import Link from 'next/link';
import MainLayout from './main-layout';
import { 
  FaChartLine, 
  FaBitcoin, 
  FaNewspaper, 
  FaChartBar,
  FaSearchDollar
} from 'react-icons/fa';

const navigation = [
  { name: 'Roboadvisor', href: '/roboadvisor', icon: FaChartLine, description: 'AI-powered investment recommendations' },
  { name: 'Crypto', href: '/crypto', icon: FaBitcoin, description: 'Cryptocurrency market analysis and insights' },
  { name: 'Live News', href: '/news', icon: FaNewspaper, description: 'Real-time financial news and updates' },
  { name: 'Asset Analyzer', href: '/asset-analyzer', icon: FaSearchDollar, description: 'Analyze stocks, commodities, and more' },
];

export default function Home() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to SmartFinance</h1>
          <p className="text-lg text-gray-600">
            AI-powered financial advisory platform for modern investors
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {navigation.map((item, index) => (
            <Link key={index} href={item.href} className="block">
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 h-full">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-emerald-100 p-3 rounded-full mb-4">
                    <item.icon className="text-emerald-600" size={24} aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                  <span className="text-emerald-600 text-sm font-medium inline-flex items-center">
                    Explore
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
