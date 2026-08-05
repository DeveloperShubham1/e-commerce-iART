import React from "react";

const OrderListSkeleton = () => (
  <div className="max-w-5xl w-full mx-auto mb-4 rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg bg-gray-200 shrink-0" />
        <div className="space-y-2">
          <div className="h-3 w-32 bg-gray-200 rounded" />
          <div className="h-2.5 w-24 bg-gray-100 rounded" />
          <div className="h-2.5 w-20 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
        <div className="h-3 w-16 bg-gray-100 rounded" />
      </div>
    </div>
  </div>
);

export default OrderListSkeleton;