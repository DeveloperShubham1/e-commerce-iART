import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

// ---- Data pulled from the reference screenshots ----
const SIZE_DATA = [
    { size: "XS", bust: [86.4, 34.0], toFitBust: [81.3, 32.0], frontLength: [121.9, 48.0], toFitWaist: [68.6, 27.0], waist: [73.7, 29.0], hips: [91.4, 36.0], toFitHip: [86.4, 34.0], shoulder: [33.0, 13.0] },
    { size: "S", bust: [91.4, 36.0], toFitBust: [86.4, 34.0], frontLength: [121.9, 48.0], toFitWaist: [73.7, 29.0], waist: [78.7, 31.0], hips: [96.5, 38.0], toFitHip: [91.4, 36.0], shoulder: [35.6, 14.0] },
    { size: "M", bust: [96.5, 38.0], toFitBust: [91.4, 36.0], frontLength: [121.9, 48.0], toFitWaist: [76.2, 30.0], waist: [83.8, 33.0], hips: [101.6, 40.0], toFitHip: [96.5, 38.0], shoulder: [36.8, 14.5] },
    { size: "L", bust: [101.6, 40.0], toFitBust: [96.5, 38.0], frontLength: [121.9, 48.0], toFitWaist: [81.3, 32.0], waist: [88.9, 35.0], hips: [106.7, 42.0], toFitHip: [101.6, 40.0], shoulder: [38.1, 15.0] },
    { size: "XL", bust: [106.7, 42.0], toFitBust: [101.6, 40.0], frontLength: [121.9, 48.0], toFitWaist: [86.4, 34.0], waist: [94.0, 37.0], hips: [111.8, 44.0], toFitHip: [106.7, 42.0], shoulder: [39.4, 15.5] },
    { size: "XXL", bust: [111.8, 44.0], toFitBust: [106.7, 42.0], frontLength: [121.9, 48.0], toFitWaist: [91.4, 36.0], waist: [99.1, 39.0], hips: [116.8, 46.0], toFitHip: [111.8, 44.0], shoulder: [40.6, 16.0] },
];

const COLUMNS = [
    { key: "bust", label: "Bust" },
    { key: "toFitBust", label: "To Fit Bust" },
    { key: "frontLength", label: "Front Length" },
    { key: "toFitWaist", label: "To Fit Waist" },
    { key: "waist", label: "Waist" },
    { key: "hips", label: "Hips" },
    { key: "toFitHip", label: "To Fit Hip" },
    { key: "shoulder", label: "Across Shoulder" },
];

const HOW_TO_MEASURE = [
    { title: "Bust", text: "Measure around the fullest part of your bust, keeping the tape parallel to the floor." },
    { title: "Waist", text: "Measure around the narrowest part of your natural waistline, above the belly button." },
    { title: "Hips", text: "Stand with feet together and measure around the fullest part of your hips." },
    { title: "Front Length", text: "Measure from the highest point of your shoulder, straight down to the desired hemline." },
    { title: "Across Shoulder", text: "Measure from the edge of one shoulder to the other, across the back." },
];

export default function SizeChartDialog() {
    const [unit, setUnit] = useState("cm"); // "cm" | "in"
    const [tab, setTab] = useState("chart"); // "chart" | "measure"

    const unitIndex = unit === "cm" ? 0 : 1;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-auto p-0 text-[15px] font-semibold uppercase tracking-wide text-pink-500 hover:bg-transparent hover:text-pink-600"
                >
                    Size Chart
                    <ChevronRight className="ml-1 h-4 w-4" strokeWidth={2.5} />
                </Button>
            </DialogTrigger>

            <DialogContent className="flex max-h-[90vh] w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
                <DialogHeader className="shrink-0 px-4 pt-5 pb-0 sm:px-6 sm:pt-6">
                    <DialogTitle className="sr-only">Size Chart</DialogTitle>
                    <DialogDescription className="sr-only">
                        View garment measurements by size, in centimeters or inches.
                    </DialogDescription>

                    {/* Tabs */}
                    <div className="flex items-center gap-5  border-b border-neutral-200 sm:gap-6">
                        <button
                            onClick={() => setTab("chart")}
                            className={`relative shrink-0 whitespace-nowrap px-0.5 pb-3 text-sm font-semibold  transition-colors ${tab === "chart" ? "text-rose-500" : "text-neutral-500 hover:text-neutral-800"
                                }`}
                        >
                            Size Chart
                            {tab === "chart" && (
                                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-rose-500" />
                            )}
                        </button>
                        <button
                            onClick={() => setTab("measure")}
                            className={`relative shrink-0 whitespace-nowrap px-0.5 pb-3 text-sm font-semibold transition-colors ${tab === "measure" ? "text-rose-500" : "text-neutral-500 hover:text-neutral-800"
                                }`}
                        >
                            How to measure
                            {tab === "measure" && (
                                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-rose-500" />
                            )}
                        </button>
                    </div>
                </DialogHeader>

                {/* Scrollable body — this is what scrolls on short/mobile screens,
            not the dialog chrome itself */}
                <div className="overflow-y-auto">
                    {tab === "chart" ? (
                        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
                            {/* Unit toggle */}
                            <div className="flex justify-end pt-4 pb-3">
                                <div className="inline-flex rounded-full bg-neutral-100 p-0.5 text-xs font-medium">
                                    <button
                                        onClick={() => setUnit("in")}
                                        className={`rounded-full px-3 py-1.5 transition-colors ${unit === "in" ? "bg-neutral-900 text-white" : "text-neutral-500"
                                            }`}
                                    >
                                        in
                                    </button>
                                    <button
                                        onClick={() => setUnit("cm")}
                                        className={`rounded-full px-3 py-1.5 transition-colors ${unit === "cm" ? "bg-neutral-900 text-white" : "text-neutral-500"
                                            }`}
                                    >
                                        cm
                                    </button>
                                </div>
                            </div>

                            {/* Table — horizontally scrollable with a sticky Size column
                  and a fade cue on the right so it reads as scrollable on
                  mobile instead of looking like it's cut off. */}
                            <div className="relative -mx-4 sm:-mx-6">
                                <div className="overflow-x-auto px-4 sm:px-6">
                                    <table className="w-full min-w-[720px] border-collapse text-left text-xs sm:text-sm">
                                        <thead>
                                            <tr className="text-neutral-700">
                                                <th className="sticky left-0 z-10 bg-white py-2 pr-4 font-semibold whitespace-nowrap">
                                                    Size
                                                </th>
                                                {COLUMNS.map((c) => (
                                                    <th key={c.key} className="py-2 px-3 font-semibold whitespace-nowrap">
                                                        {c.label} <span className="font-normal text-neutral-400">({unit})</span>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {SIZE_DATA.map((row) => {
                                                return (
                                                    <tr
                                                        key={row.size}
                                                        className="border-t border-neutral-100 transition-colors hover:bg-neutral-50"
                                                    >
                                                        <td
                                                            className="sticky left-0 z-10 py-3 pr-4 whitespace-nowrap bg-white"
                                                        >
                                                            <span className="font-semibold text-neutral-900">
                                                                {row.size}
                                                            </span>
                                                        </td>
                                                        {COLUMNS.map((c) => (
                                                            <td
                                                                key={c.key}
                                                                className="py-3 px-3 whitespace-nowrap text-neutral-700"
                                                            >
                                                                {row[c.key][unitIndex].toFixed(1)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {/* right-edge fade to hint there's more to scroll, mobile/tablet only */}
                                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent lg:hidden" />
                            </div>
                            <p className="mt-2 text-xs text-neutral-400 lg:hidden">
                                Swipe left/right to see all measurements →
                            </p>
                        </div>
                    ) : (
                        <div className=" sm:px-6">
                            <ul className="space-y-4">
                                {HOW_TO_MEASURE.map((item) => (
                                    <li key={item.title} className="flex gap-3">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                                        <div>
                                            <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                                            <p className="text-sm text-neutral-600">{item.text}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}