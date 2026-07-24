import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

const faqGroups = [
    {
        title: "Orders & payment",
        items: [
            {
                q: "How do I place an order?",
                a: "Simply browse our collection, select your size, and add the item to your cart. We accept orders only through our website — we don't take orders over calls, WhatsApp, or direct messages, so please always check out here to make sure your order is confirmed.",
            },
            {
                q: "What payment methods do you accept?",
                a: "We accept all major debit and credit cards, UPI, and net banking. Cash on delivery isn't available at the moment.",
            },
            {
                q: "Can I cancel or change my order after placing it?",
                a: "Once an order is placed, it's processed quickly for packing and dispatch, so we're not able to make changes or cancel it. Please double-check your size, address and order details before checking out.",
            },
        ],
    },
    {
        title: "Sizing & product",
        items: [
            {
                q: "How do I find my correct size?",
                a: "Check the size chart listed on each product page before ordering. Since we don't offer exchanges, we'd always recommend measuring yourself against the chart rather than going by your usual size in other brands.",
            },
            {
                q: "Will the product look exactly like the photos?",
                a: "We try to photograph every piece as accurately as possible, but slight variations in colour can happen depending on your screen and lighting. Fabric and embroidery are handled with care, so minor natural variations are part of the charm of each piece.",
            },
        ],
    },
    {
        title: "Shipping & delivery",
        items: [
            {
                q: "How long will my order take to arrive?",
                a: "Orders within India typically arrive in 5 to 12 business days depending on your location, and international orders in 10 to 18 business days. You can find full details on our Shipping & Delivery page.",
            },
            {
                q: "Do you ship internationally?",
                a: "Yes, we ship worldwide. International orders may be subject to customs duties or import taxes charged by your country, which are the customer's responsibility.",
            },
            {
                q: "How can I track my order?",
                a: "Once your order ships, you'll get tracking details by email and, where provided, on WhatsApp. Do check your spam folder if you don't see it in your inbox.",
            },
        ],
    },
    {
        title: "Returns & exchange",
        items: [
            {
                q: "Can I return or exchange an item?",
                a: "We currently don't offer returns or exchanges on any order. Every piece is checked for quality before it's packed, so we'd encourage you to review the size guide carefully before ordering. Full details are on our No Exchange & Return page.",
            },
            {
                q: "What if my order arrives damaged or incorrect?",
                a: "While this is rare given our quality checks, if it happens please reach out to us with photos as soon as you receive the order and we'll help sort it out.",
            },
        ],
    },
];

const FaqItem = ({ item, isOpen, onToggle }) => (
    <div className="border-b border-gray-200 last:border-b-0">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between gap-4 py-5 text-left"
        >
            <span className="font-medium text-gray-800">{item.q}</span>
            <ChevronDown
                size={18}
                className={`shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""
                    }`}
            />
        </button>
        <div
            className={`grid transition-all duration-200 ease-in-out ${isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
                }`}
            style={{ display: "grid" }}
        >
            <div className="overflow-hidden">
                <p className="text-gray-600 leading-relaxed pr-6">{item.a}</p>
            </div>
        </div>
    </div>
);

export const Faq = () => {
    const { settings } = useAppContext();
    const email = settings?.contact?.email || "test@gmail.com";
    const [openKey, setOpenKey] = useState("0-0");

    return (
        <section className="bg-[var(--color-primary-bg)] min-h-screen">
            <div className="bg-primary text-white py-16 px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-bold">
                    Frequently Asked Questions
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-white/90">
                    Everything you need to know before you shop with us.
                </p>
            </div>
        
            <div className="max-w-6xl mx-auto px-6 py-16 space-y-8">
                {faqGroups.map((group, gi) => (
                    <div
                        key={gi}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 md:px-8"
                    >
                        <h2 className="text-lg font-semibold text-gray-800 pt-6 pb-1">
                            {group.title}
                        </h2>
                        <div>
                            {group.items.map((item, ii) => {
                                const key = `${gi}-${ii}`;
                                return (
                                    <FaqItem
                                        key={key}
                                        item={item}
                                        isOpen={openKey === key}
                                        onToggle={() =>
                                            setOpenKey(openKey === key ? null : key)
                                        }
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Still have questions?
                    </h2>
                    <p className="mt-2 text-gray-500">
                        We're happy to help with anything not covered here.
                    </p>
                    <a
                        href={`mailto:${email}`}
                        className="inline-block mt-6 bg-primary text-white px-8 py-3 rounded-lg hover:opacity-90 transition"
                    >
                        Email us
                    </a>
                </div>
            </div>
        </section>
    );
};