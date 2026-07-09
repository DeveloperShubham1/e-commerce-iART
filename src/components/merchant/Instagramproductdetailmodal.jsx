import {
  X, Heart, MessageCircle, Share2, Eye, Bookmark,
  ExternalLink, User, Clock, ShoppingBag, TrendingUp,
} from "lucide-react";
import { useInstagramProduct } from "../../services/instaProduct";

export default function InstagramProductDetailModal({ mediaId, onClose }) {
  const { data, isLoading, isError } = useInstagramProduct(mediaId);
  const detail = data?.data;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Post Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <div className="w-7 h-7 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : isError || !detail ? (
            <div className="flex items-center justify-center py-20 text-red-500 text-sm">
              Failed to load post details.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">

              {/* ── Left: Instagram info ── */}
              <div className="p-6 flex flex-col gap-5 overflow-y-auto">

                {/* Post card */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                  <span className="inline-flex text-xs font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 w-fit">
                    {detail.instagram?.media_type}
                  </span>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {detail.instagram?.caption?.slice(0, 220)}
                    {detail.instagram?.caption?.length > 220 ? "…" : ""}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock size={12} />
                      {new Date(detail.instagram?.timestamp).toLocaleString("en-IN")}
                    </div>
                    <a
                      href={detail.instagram?.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:underline"
                    >
                      <ExternalLink size={12} />
                      View on Instagram
                    </a>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { icon: Heart, label: "Likes", value: detail.instagram?.like_count, color: "text-red-500" },
                    { icon: MessageCircle, label: "Comments", value: detail.instagram?.comments_count, color: "text-blue-500" },
                    { icon: Eye, label: "Views", value: detail.instagram?.views, color: "text-purple-600" },
                    { icon: Share2, label: "Shares", value: detail.instagram?.shares, color: "text-green-500" },
                    { icon: Bookmark, label: "Saved", value: detail.instagram?.saved, color: "text-amber-500" },
                    { icon: TrendingUp, label: "Reach", value: detail.instagram?.reach, color: "text-orange-500" },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl py-3 px-2 text-center"
                    >
                      <Icon size={16} className={color} />
                      <span className="text-base font-bold text-gray-900">
                        {value?.toLocaleString() ?? "—"}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Comments */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <MessageCircle size={14} />
                    Comments ({detail.comments?.length || 0})
                  </div>
                  {detail.comments?.length === 0 ? (
                    <p className="text-sm text-gray-400">No comments yet.</p>
                  ) : (
                    <ul className="flex flex-col gap-2.5">
                      {detail.comments.map((c) => (
                        <li key={c.comment_id} className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                            <User size={13} />
                          </div>
                          <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-xs font-semibold text-purple-600">
                                @{c.comment_username}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(c.commented_at).toLocaleDateString("en-IN")}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{c.comment_text}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* ── Right: Product ── */}
              <div className="p-6 flex flex-col gap-4 overflow-y-auto">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <ShoppingBag size={14} />
                  Mapped Product
                </div>

                {!detail.product ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm gap-2">
                    <ShoppingBag size={32} className="text-gray-200" />
                    No product mapped to this post.
                  </div>
                ) : (
                  <>
                    {/* Product image */}
                    {detail.product.variants?.[0]?.images?.[0] && (
                      <img
                        src={detail.product.variants[0].images[0]}
                        alt={detail.product.name}
                        className="w-full h-44 object-cover rounded-xl border border-gray-200"
                      />
                    )}

                    {/* Product info */}
                    <div className="flex flex-col gap-2">
                      <h3 className="text-base font-bold text-gray-900">
                        {detail.product.name}
                      </h3>
                      {detail.product.brand && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          {detail.product.brand}
                        </span>
                      )}
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {detail.product.description?.slice(0, 120)}…
                      </p>
                      <a
                        href={detail.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors w-fit"
                      >
                        <ExternalLink size={13} />
                        View Product
                      </a>
                    </div>

                    {/* Variants */}
                    <div className="flex flex-col gap-2.5">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Variants
                      </span>
                      {detail.product.variants?.map((v) => (
                        <div
                          key={v._id}
                          className="border border-gray-200 rounded-xl overflow-hidden"
                        >
                          {/* Variant header */}
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                            <span
                              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                              style={{ background: v.colorCode }}
                            />
                            <span className="text-sm font-semibold text-gray-700">
                              {v.color}
                            </span>
                          </div>

                          {/* Sizes */}
                          <div className="divide-y divide-gray-50">
                            {v.sizes?.map((s) => (
                              <div
                                key={s._id}
                                className="flex items-center justify-between px-3 py-2 text-sm"
                              >
                                <span className="w-8 font-bold text-gray-800">
                                  {s.size}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-purple-700">
                                    ₹{s.offerPrice}
                                  </span>
                                  <s className="text-xs text-gray-400">₹{s.price}</s>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {s.stock} left
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}