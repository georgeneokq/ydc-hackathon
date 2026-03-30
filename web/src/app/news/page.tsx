"use client"

import { useState } from 'react';
import MainLayout from '../main-layout';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr/fetcher';

/*
{
    "news": [
        {
            "id": "abbe2e7ada2b1cf603d6c3432913d150",
            "title": "Meta, YouTube $6M Trial Has Far",
            "description": "According to Gary Black, all Mag 7 stocks, including Meta and Alphabet, have lagged behind the S&P 500 this year.",
            "content": "META, GOOGL Fall Behind Due To Recent Underperformance\nAccording to Gary Black, all Mag 7 stocks, including Meta and Alphabet, have lagged behind the S&P 500 this year.\nBlack linked the recent underperformance of Meta and Alphabet to the jury’s decis... [1428 chars]",
            "url": "https://www.benzinga.com/markets/tech/26/03/51529600/meta-youtube-6m-trial-far-reaching-consequences-gary-black",
            "image": "https://cdn.benzinga.com/files/images/story/2026/03/29/Mark-Zuckerberg-Speaks-At-Georgetown-Uni_0.jpeg?width=1200&height=800&fit=crop",
            "publishedAt": "2026-03-29T15:34:00Z",
            "lang": "en",
            "source": "Benzinga",
            "timestamp": 1774798440000
        },
        {
            "id": "e92e188e2f016fe0f3bc34f473a69b0d",
            "title": "Quote of the Day by Warren Buffett: ‘You don't get paid for activity, only for…’",
            "description": "Berkshire Hathaway founder and chairman Warren Buffett has offered a wealth of investment advice over the years. Here's his outlook on investment activity in the stock market and being right about bets.",
            "content": "Berkshire Hathaway founder and chairman, Warren Buffett has offered a wealth of investment advice over the years. Known for his long-term approach to stocks, sticking to fundamentals, and taking calculated but thoughtful risks, the so-called ‘Oracle ... [3565 chars]",
            "url": "https://www.livemint.com/news/us-news/quote-of-the-day-by-warren-buffett-stocks-investing-advice-berkshire-not-activity-you-only-paid-for-being-right-patience-11774793793648.html",
            "image": "https://www.livemint.com/lm-img/img/2026/03/29/1600x900/logo/im-08205351_1755079441331_1774797092766.jpg",
            "publishedAt": "2026-03-29T15:15:22Z",
            "lang": "en",
            "source": "Livemint",
            "timestamp": 1774797322000
        },
        {
            "id": "d4e02c256b40fbd89cd43a97e95a032c",
            "title": "The High Cost of Canceling Offshore Wind in the United States",
            "description": "The Trump administration is paying nearly $1 billion to cancel major offshore wind projects and redirect investment toward fossil fuels amid a global energy crisis.",
            "content": "Donald Trump’s hatred for wind farms reached a new peak this week. The President announced that the United States will pay $1 billion in taxpayer dollars to a French company to not build planned wind farms in leased federal waters off the coast of Ne... [3698 chars]",
            "url": "https://oilprice.com/Energy/Energy-General/The-High-Cost-of-Canceling-Offshore-Wind-in-the-United-States.html",
            "image": "https://d32r1sh890xpii.cloudfront.net/article/1200x675/2026-03-27_nko3ipl25c.jpg",
            "publishedAt": "2026-03-29T15:00:00Z",
            "lang": "en",
            "source": "OilPrice",
            "timestamp": 1774796400000
        },
        {
            "id": "c34efe22295ac56f4efee1972af1221f",
            "title": "Top 5 coastal real estate hotspots in India for luxury living in 2026",
            "description": "If you thought India’s coastline only attracts tourists, you are wrong. The coastline of the country is fast changing into one of the most sought-after luxury real estate markets attracting rich and wealthy end-users. In 2026, developers, buyers, NRIs, and investors are showing immense interest in coastal destinations as holiday homes, wellness retreats, retirement houses and for investment purposes. The reason behind would be improved connectivity, infrastructure upgrades and for a better lifestyle away from city and pollution and crowd.Infrastructure development plays a major decisive role in coastal hotspots. Let’s have look at five coastal real estate hotspots in India for luxury living in 2026:",
            "content": "If you thought India’s coastline only attracts tourists, you are wrong. The coastline of the country is fast changing into one of the most sought-after luxury real estate markets attracting rich and wealthy end-users. In 2026, developers, buyers, NRI... [2757 chars]",
            "url": "https://timesofindia.indiatimes.com/real-estate/news/top-5-coastal-real-estate-hotspots-in-india-for-luxury-living-in-2026/photostory/129882557.cms",
            "image": "https://static.toiimg.com/thumb/msid-129882603,width-1280,height-720,imgsize-28964,resizemode-6,overlay-toi_sw,pt-32,y_pad-600/photo.jpg",
            "publishedAt": "2026-03-29T14:56:19Z",
            "lang": "en",
            "source": "Times of India",
            "timestamp": 1774796179000
        },
        {
            "id": "87223c01af34d73629001c5f71f36d0f",
            "title": "Explained: Trump’s attempts to calm markets, amid lows stemming from West Asia war",
            "description": "Trump has been sensitive to adverse movements in financial markets. Sometimes explicitly, he has responded with public comments and social media posts that appear designed to give stocks and bonds a jolt.",
            "content": "With risks to the U.S. economy mounting by the day, Trump has largely dismissed those disruptions as temporary and necessary in pursuit of security and stability in the Middle East. Earlier Thursday, the president even admitted at a Cabinet meeting t... [2099 chars]",
            "url": "https://indianexpress.com/article/explained/explained-economics/trump-attempts-calm-markets-iran-war-10608246/",
            "image": "https://images.indianexpress.com/2026/03/Financial_Markets_Wall_Street_15642-6c73f.jpg",
            "publishedAt": "2026-03-29T14:27:46Z",
            "lang": "en",
            "source": "The Indian Express",
            "timestamp": 1774794466000
        },
        {
            "id": "3f1f4e4af4118fd8115505c2535b81af",
            "title": "Dividend Stocks To Watch This Week: Ireda, TVS Holdings, Crisil, Aster DM Healthcare & More",
            "description": "Chennai Petroleum Corporation Ltd. has declared an interim dividend of Rs 8 per share, while Aster DM Healthcare Ltd. has announced an interim dividend of Rs 3 per share.",
            "content": "In the upcoming week, several companies, including Indian Renewable Energy Development Agency Ltd., TVS Holdings Ltd., Crisil Ltd., Chennai Petroleum Corporation Ltd., Aster DM Healthcare Ltd. and Sundaram-Clayton Ltd. are set to trade ex-dividend as... [1169 chars]",
            "url": "https://www.ndtvprofit.com/markets/dividend-stocks-to-watch-this-week-ireda-tvs-holdings-crisil-cpcl-aster-dm-healthcare-sundaram-clayton-11282801",
            "image": "https://c.ndtvimg.com/2026-03/4fg78b2_dividend_625x300_29_March_26.png?im=FeatureCrop,algorithm=dnn,width=1080,height=607",
            "publishedAt": "2026-03-29T14:21:43Z",
            "lang": "en",
            "source": "NDTV Profit",
            "timestamp": 1774794103000
        },
        {
            "id": "0fea2a3d0875cdf210f3f0a84301439f",
            "title": "UPSC Key: Ethanol push as shield against energy crisis, Great Indian Bustard, and Golestan Palace",
            "description": "How is knowing about Great Indian Bustard relevant to the UPSC exam? What significance do topics such as Houthis, e-cheques, and the Investment Facilitation for Development (IFD) Agreement hold for both the Preliminary and Mains examinations? You can learn more by reading the Indian Express UPSC Key for March 29, 2026.",
            "content": "Key Points to Ponder:\n— Know about the West Asia crisis and its impact on India’s energy security.\n— What is Ethanol?\n— How is Ethanol produced?\n— What are the uses of Ethanol?\n— What target has been set by the government for blending ethanol with pe... [30944 chars]",
            "url": "https://indianexpress.com/article/upsc-current-affairs/upsc-key-ethanol-energy-crisis-great-indian-bustard-golestan-palace-10608217/",
            "image": "https://images.indianexpress.com/2026/03/UPSC-Key-Ethanol-push-as-shield-against-energy-crisis-Great-Indian-Bustard-and-Golestan-Palace.jpg",
            "publishedAt": "2026-03-29T14:03:48Z",
            "lang": "en",
            "source": "The Indian Express",
            "timestamp": 1774793028000
        },
        {
            "id": "751e0ca976d6d7484034c9dd6cdb00d1",
            "title": "Wall Street Touts ‘Grind Lower’ Trades as Iran Weighs on Stocks",
            "description": "As the Iran war heads into a fifth week, Wall Street bank strategists have been touting trades that would pay off if a stock-market selloff is slow and steady.",
            "content": "As the Iran war heads into a fifth week, Wall Street bank strategists have been touting trades that would pay off if a stock-market selloff is slow and steady.\nBBVA recently recommended April Euro Stoxx 50 Index put spreads, citing market complacency... [369 chars]",
            "url": "https://news.bloombergtax.com/daily-tax-report/wall-street-touts-grind-lower-trades-as-iran-weighs-on-stocks",
            "image": "https://news-cdn.bindg.com/indg/assets/news/images/Fallback-image.webp",
            "publishedAt": "2026-03-29T14:00:02Z",
            "lang": "en",
            "source": "Bloomberg Tax News",
            "timestamp": 1774792802000
        },
        {
            "id": "407ddc3116a107e55b843adb868f6119",
            "title": "As Meta Doubles Down on Data Center Investment, AMD and American Tower Could Be the Top Stocks to Buy",
            "description": "A durable wave of hyperscale data center buildout should keep high‑end GPUs like AMD’s Instinct line and dense interconnection platforms such as American Tower’s CoreSite campuses in high demand.",
            "content": "Meta Platforms (META) CEO Mark Zuckerberg has been very clear about where the company is heading. In January, he unveiled \"Meta Compute\", a broad plan to build Meta’s future around large-scale AI infrastructure, purpose-built data centers, and dedica... [5717 chars]",
            "url": "https://www.barchart.com/story/news/1030037/as-meta-doubles-down-on-data-center-investment-amd-and-american-tower-could-be-the-top-stocks-to-buy",
            "image": "https://media.barchart.com/contributors-admin/common-images/images/S%26P%20500%20Companies/Technology%20(names%20J%20-%20Z)/Meta%20by%20creativeneko%20via%20Shutterstock.jpg",
            "publishedAt": "2026-03-29T14:00:02Z",
            "lang": "en",
            "source": "Barchart",
            "timestamp": 1774792802000
        },
        {
            "id": "88e55f9d0e7f8804acc32aa40e03ab50",
            "title": "Disneyland Paris unveils ‘World of Frozen’ in €2 billion expansion",
            "description": "Disneyland Paris unveils World of Frozen as part of a €2 billion expansion, marking its biggest transformation with new attractions, jobs, and global investment plans.",
            "content": "Disneyland Paris unveils World of Frozen as part of a €2 billion expansion, marking its biggest transformation with new attractions, jobs, and global investment plans.\nBy AP\nA 118-foot mountain of ice rose over the suburban Paris countryside this wee... [5669 chars]",
            "url": "https://www.cnbctv18.com/world/disneyland-paris-unveils-world-of-frozen-in-e2-billion-expansion-ws-l-19877154.htm",
            "image": "https://images.cnbctv18.com/uploads/2026/03/france-disney-2026-03-c0586c25bd89d0f3e6bbd5c9be4c3ac4.jpg?im=FitAndFill,width=500,height=300",
            "publishedAt": "2026-03-29T13:55:20Z",
            "lang": "en",
            "source": "CNBC TV18",
            "timestamp": 1774792520000
        }
    ]
}
*/

interface NewsItem {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  lang: string;
  source: string;
  timestamp: number;
}

interface NewsData {
  news: NewsItem[];
}

const NewsItemComponent = ({ item }: { item: NewsItem }) => {
  // Format as date and time in the user's timezone
  const displayTime = new Date(item.timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block h-full">
        <div className="flex flex-col md:flex-row">
          {item.image && (
            <div className="md:w-1/4 p-4 flex items-center justify-center">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-32 object-cover rounded-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className={`p-4 ${item.image ? 'md:w-3/4' : 'w-full'}`}>
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0" title={item.publishedAt}>{displayTime}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500 mb-2">
              <span className="font-medium">{item.source}</span>
            </div>
            <p className="text-gray-700 text-sm mb-2">{item.description}</p>
          </div>
        </div>
      </a>
    </div>
  );
};

export default function NewsPage() {
  // Refresh news every 20 seconds
  const { data: newsData, isLoading: newsIsLoading } = useSWR<NewsData>('/api/news', fetcher, {
    refreshInterval: 20000,
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: false
  })
  console.log(newsData)

  if (newsIsLoading || !newsData?.news) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Live Financial News</h1>
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <p className="text-gray-700">Loading news...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Live Financial News</h1>
          
          <div className="space-y-4">
            {newsData.news.length > 0 ? (
              newsData.news.map((item) => (
                <NewsItemComponent key={item.id} item={item} />
              ))
            ) : (
              <p className="text-gray-700">No news articles available at the moment.</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}