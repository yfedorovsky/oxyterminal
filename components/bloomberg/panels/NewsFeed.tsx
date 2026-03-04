"use client";

import { newsItems } from "@/lib/mock-data";
import type { NewsItem } from "../types";
import { formatDistanceToNow } from "date-fns";

export default function NewsFeed() {
  return (
    <div className="h-full overflow-auto" style={{ background: "#0a0e14" }}>
      {newsItems.map((item: NewsItem, idx: number) => (
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
