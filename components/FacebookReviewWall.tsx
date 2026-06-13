"use client";

import Image from "next/image";
import { facebookReviews, type FacebookReview } from "@/lib/facebook-reviews-data";

function ReactionBar({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-between mt-2 pt-1">
      <div className="flex items-center gap-3 text-[13px] font-semibold text-[#1877F2]">
        <button type="button" className="hover:underline">
          Like
        </button>
        <button type="button" className="hover:underline">
          Reply
        </button>
        <button type="button" className="hover:underline text-[#1877F2]">
          Love
        </button>
      </div>
      <div className="flex items-center gap-1 text-[13px] text-[#65676B]">
        <span className="flex -space-x-0.5">
          <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#1877F2] text-[10px] text-white">
            👍
          </span>
          <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#e41e3f] text-[10px] text-white">
            ❤️
          </span>
          <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#f7b928] text-[10px]">
            😊
          </span>
        </span>
        <span>{count}</span>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: FacebookReview }) {
  const dir = review.rtl ? "rtl" : "ltr";

  return (
    <article
      className="break-inside-avoid rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.08)] border border-[#e4e6eb] mb-4"
      dir={dir}
    >
      {review.showPopularHeader && (
        <div className="flex items-center gap-1.5 mb-2 text-[12px] text-[#65676B] pb-2 border-b border-[#e4e6eb]">
          <span className="flex -space-x-0.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#1877F2] text-[8px] text-white">
              👍
            </span>
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#e41e3f] text-[8px] text-white">
              ❤️
            </span>
          </span>
          <span>
            You and {review.popularCount} others &gt;
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <Image
          src={review.avatar}
          alt={review.name}
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="inline-block max-w-full rounded-2xl bg-[#f0f2f5] px-3 py-2">
            <p className="text-[15px] font-semibold text-[#050505] leading-tight">{review.name}</p>
            <p
              className={`text-[15px] text-[#050505] leading-snug mt-0.5 ${review.rtl ? "font-[family-name:var(--font-urdu)]" : ""}`}
              style={review.rtl ? { fontFamily: "Segoe UI, Tahoma, Arial, sans-serif" } : undefined}
            >
              {review.text}
            </p>
          </div>
          <p className="text-[12px] text-[#65676B] mt-1 px-1">{review.timeAgo}</p>
          <ReactionBar count={review.reactions} />
        </div>
      </div>

      {review.brandReply && (
        <div className={`flex gap-2 mt-3 ${review.rtl ? "mr-10" : "ml-10"}`} dir={dir}>
          <div className="h-8 w-8 shrink-0 rounded-full bg-[#107354] flex items-center justify-center overflow-hidden">
            <Image
              src="/assets/images/typo-herbex.png"
              alt="Pure Herbex"
              width={32}
              height={32}
              className="h-6 w-6 object-contain brightness-110"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="inline-block rounded-2xl bg-[#f0f2f5] px-3 py-2 max-w-full">
              <p className="text-[13px] font-semibold text-[#050505] flex items-center gap-1.5 flex-wrap">
                Pure Herbex
                <span className="text-[11px] font-normal text-[#65676B] bg-[#e4e6eb] px-1.5 py-0.5 rounded">
                  Author
                </span>
              </p>
              <p className="text-[14px] text-[#050505] mt-0.5 leading-snug">{review.brandReply}</p>
            </div>
            <div className="flex items-center gap-3 mt-1 px-1 text-[12px] font-semibold text-[#1877F2]">
              <span>Like</span>
              <span>Reply</span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export default function FacebookReviewWall() {
  const columns: FacebookReview[][] = [[], [], []];

  facebookReviews.forEach((review, i) => {
    columns[i % 3].push(review);
  });

  return (
    <section className="bg-white py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-center text-2xl sm:text-3xl font-bold text-[#050505] mb-10 sm:mb-12"
          dir="rtl"
          style={{ fontFamily: "Segoe UI, Tahoma, Arial, sans-serif" }}
        >
          ⭐ ہمارے مطمئن کسٹمرز کے ریویوز ⭐
        </h2>
        <p className="text-center text-[#65676B] text-sm mb-8 -mt-6">
          Real feedback from Facebook &amp; WhatsApp — Pure Herbex Ultra Force Pakistan
        </p>

        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-3">
          {columns.map((col, ci) => (
            <div key={ci}>
              {col.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ))}
        </div>

        <div className="lg:hidden columns-1 sm:columns-2 gap-3">
          {facebookReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
