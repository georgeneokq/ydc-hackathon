'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FaChartLine, 
  FaBitcoin, 
  FaNewspaper, 
  FaChartBar,
  FaSearchDollar
} from 'react-icons/fa';

const navigation = [
  { name: 'Roboadvisor', href: '/roboadvisor', icon: FaChartLine },
  { name: 'Crypto', href: '/crypto', icon: FaBitcoin },
  { name: 'Live News', href: '/news', icon: FaNewspaper },
  { name: 'Asset Analyzer', href: '/asset-analyzer', icon: FaSearchDollar },
];



export default function Sidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-900">
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Link href="/" className="text-xl font-bold text-white hover:text-emerald-400 transition-colors">
                SmartFinance
              </Link>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                      isActive 
                        ? 'bg-emerald-700 text-white' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3" size={24} aria-hidden="true" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-gray-900">
          <div className="flex flex-col flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Link href="/" className="text-xl font-bold text-white hover:text-emerald-400 transition-colors">
                SmartFinance
              </Link>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                      isActive 
                        ? 'bg-emerald-700 text-white' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <item.icon className="mr-3" size={24} aria-hidden="true" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}