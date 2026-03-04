"use client";

import { useMemo } from "react";
import { useMarketNews } from "@/lib/hooks";
import { newsItems as mockNews } from "@/lib/mock-data";
import type { NewsItem } from "../types";
import { formatDistanceToNow } from "date-fns";

export default function NewsFeed() {
  const { data: apiNews, isLoading, isError } = useMarketNews();

  const news: NewsItem[] = useMemo(() => {
    if (apiNews && Array.isArray(apiNews) && apiNews.length > 0) {
      return apiNews.map((item: { id: number; headline: string; source: string; datetime: number; url: string; summary: string; related: string; image: string }) => ({
        headline: item.headline,
        source: item.source,
        timestamp: new Date(item.datetime * 1000).toISOString(),
        relatedTickers: (item.related || "").split(",").filter(Boolean),
        url: item.url,
      }));
    }
    return mockNews;
  }, [apiNews]);

  if (isLoading && news.length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ background: "#0a0e14", color: "#3a4553", fontSize: "11px" }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto" style={{ background: "#0a0e14" }}>
      {isError && (
        <div
          className="px-3 py-1 text-center"
          style={{ color: "#ff4757", fontSize: "10px", borderBottom: "1px dashed #2a3545" }}
        >
          API error - showing cached data
        </div>
      )}
      {news.map((item: NewsItem, idx: number) => (
        <div
          key={idx}
          className="px-3 py-2"
          style={{ borderBottom: "1px dashed #2a3545" }}
        >
          {/* Headline */}
          <a
            href={item.url}
            onClick={(e) => e.preventDefault()}
            className="block"
            style={{
              color: "#e8edf3",
              fontSize: "12px",
              fontWeight: 500,
              lineHeight: "1.4",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            {item.headline}
          </a>

          {/* Source + Timestamp */}
          <div className="mt-1 flex items-center gap-2" style={{ fontSize: "10px" }}>
            <span style={{ color: "#ff8c00" }}>{item.source}</span>
            <span style={{ color: "#7a8a9e" }}>
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
            </span>
          </div>

          {/* Related Tickers */}
          {item.relatedTickers.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {item.relatedTickers.map((ticker) => (
                <span
                  key={ticker}
                  className="px-1 py-0"
                  style={{
                    fontSize: "10px",
                    color: "#7a8a9e",
                    background: "#2a3545",
                  }}
                >
                  {ticker}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
