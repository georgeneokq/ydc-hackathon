"use client"

import { useState } from 'react';
import MainLayout from '../main-layout';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr/fetcher';

interface NewsItem {
  age: string;
  description: string;
  meta_url: {
    hostname: string;
    netloc: string;
    path: string;
    scheme: string;
  };
  page_age: string;
  source_name: string;
  thumbnail?: {
    src: string;
  };
  title: string;
  type: string;
  url: string;
  metadata: {};
  article_id: string;
  timestamp: number;
}

interface NewsData {
  news: NewsItem[];
}

const NewsItemComponent = ({ item }: { item: NewsItem }) => {
  // Use the page_age timestamp to display exact time for all records
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
          {item.thumbnail && item.thumbnail.src && (
            <div className="md:w-1/4 p-4 flex items-center justify-center">
              <img 
                src={item.thumbnail.src} 
                alt={item.title} 
                className="w-full h-32 object-cover rounded-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className={`p-4 ${item.thumbnail && item.thumbnail.src ? 'md:w-3/4' : 'w-full'}`}>
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0" title={item.age}>{displayTime}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500 mb-2">
              <span className="font-medium">{item.source_name}</span>
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
                <NewsItemComponent key={`${item.article_id}-${item.page_age}`} item={item} />
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