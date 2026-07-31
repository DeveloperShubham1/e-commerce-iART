import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

const MENU_WIDTH = 192; // matches old w-48
const MENU_GAP = 8; // matches old mt-2
const VIEWPORT_PADDING = 8;
const ROW_HEIGHT = 44; // ~px per action button, for the pre-mount height estimate
const DIVIDER_HEIGHT = 9;

const ActionDropdown = ({ actions = [] }) => {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState(null); // { top, bottom, left, openUpward }
    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    const calculatePosition = useCallback(() => {
        const btn = triggerRef.current;
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const estimatedMenuHeight =
            actions.filter((a) => !a.divider).length * ROW_HEIGHT +
            actions.filter((a) => a.divider).length * DIVIDER_HEIGHT +
            8;

        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpward =
            spaceBelow < estimatedMenuHeight + MENU_GAP && rect.top > estimatedMenuHeight;

        // Align the menu's right edge with the button's right edge (like the
        // original `right-0`), clamped so it never runs off the viewport.
        let left = rect.right - MENU_WIDTH;
        left = Math.max(VIEWPORT_PADDING, left);
        left = Math.min(left, window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING);

        setPosition({
            top: rect.bottom + MENU_GAP,
            bottom: window.innerHeight - rect.top + MENU_GAP,
            left,
            openUpward,
        });
    }, [actions]);

    // Recompute right before paint whenever the menu opens, so it's
    // correctly placed on the very first frame it's visible.
    useLayoutEffect(() => {
        if (open) calculatePosition();
    }, [open, calculatePosition]);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e) => {
            if (
                triggerRef.current?.contains(e.target) ||
                menuRef.current?.contains(e.target)
            ) {
                return;
            }
            setOpen(false);
        };

        // Simpler and more robust than trying to keep a `fixed` menu glued to
        // a button that might live inside a scrolling table: just close it.
        // `capture: true` catches scroll on the table's own inner scroll
        // container too, not just the window.
        const closeOnScrollOrResize = () => setOpen(false);

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", closeOnScrollOrResize, true);
        window.addEventListener("resize", closeOnScrollOrResize);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", closeOnScrollOrResize, true);
            window.removeEventListener("resize", closeOnScrollOrResize);
        };
    }, [open]);

    return (
        <div className="relative inline-block">
            <button
                ref={triggerRef}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((prev) => !prev);
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
                <MoreVertical className="h-5 w-5" />
            </button>

            {open &&
                position &&
                createPortal(
                    <div
                        ref={menuRef}
                        style={{
                            position: "fixed",
                            top: position.openUpward ? undefined : position.top,
                            bottom: position.openUpward ? position.bottom : undefined,
                            left: position.left,
                            width: MENU_WIDTH,
                        }}
                        className="z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                    >
                        {actions.map((item, index) =>
                            item.divider ? (
                                <div key={index} className="my-1 border-t border-slate-200" />
                            ) : (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpen(false);
                                        item.onClick?.();
                                    }}
                                    className={`flex w-full items-center gap-3 px-4 py-3 text-sm ${item.className || "text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    {item.icon && <item.icon className="h-4 w-4" />}
                                    {item.label}
                                </button>
                            )
                        )}
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default ActionDropdown;