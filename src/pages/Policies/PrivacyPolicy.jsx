import React from "react";
import { useAppContext } from "@/context/AppContext";

const sections = [
    {
        title: "What we collect",
        body: `When you place an order or create an account, we collect information such as your name, email address, phone number, and shipping and billing address. We use this to process your order, keep you updated on delivery, and — if you've opted in — to send you occasional offers and updates.`,
    },
    {
        title: "How we use your information",
        body: `We use your details to fulfil orders, respond to support requests, personalise your experience on the site, and improve how DigiShop works overall. We also use your IP address and browsing activity to help diagnose issues and understand general trends in how the site is used — never to identify you individually beyond what's needed to serve you.`,
    },
    {
        title: "Cookies",
        body: `Like most websites, we use cookies to remember your preferences, keep you logged in, and understand how the site is used. Cookies don't store personally identifiable information. You're free to disable cookies in your browser, though parts of the site may not work as smoothly without them.`,
    },
    {
        title: "Sharing your information",
        body: `We don't sell your personal information. We may share it with trusted service providers who help us run the site — such as payment processors and delivery partners — solely to complete your order. We may also disclose information if required by law, or to protect our rights, users, or the public.`,
    },
    {
        title: "Keeping your data secure",
        body: `We use industry-standard security practices to protect your information, including secure connections for account and payment details. While no system is completely risk-free, we take reasonable steps to keep your data safe from unauthorised access.`,
    },
    {
        title: "Your choices",
        body: `You can opt out of promotional emails at any time using the unsubscribe link, or by contacting us directly. You may also request details of the personal information we hold about you, or ask us to delete it, subject to any records we're legally required to keep.`,
    },
    {
        title: "Changes to this policy",
        body: `We may update this privacy policy from time to time to reflect changes in our practices. Updates take effect as soon as they're posted here, so please check back periodically.`,
    },
];

export const PrivacyPolicy = () => {
    const { settings } = useAppContext();
    const email = settings?.contact?.email || "test@gmail.com";

    return (
        <section className="bg-[var(--color-primary-bg)] min-h-screen">
            <div className="bg-primary text-white py-16 px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
                <p className="mt-4 max-w-2xl mx-auto text-white/90">
                    We value your trust — here's how we collect, use and protect
                    your information.
                </p>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-10 space-y-8">
                    {sections.map((section, i) => (
                        <div key={i}>
                            <h2 className="text-xl font-semibold text-gray-800">
                                {i + 1}. {section.title}
                            </h2>
                            <p className="mt-3 text-gray-600 leading-relaxed">
                                {section.body}
                            </p>
                        </div>
                    ))}

                    <div className="border-t border-gray-200 pt-6">
                        <p className="text-sm text-gray-500">
                            Questions about your data? Reach us at{" "}
                            <a
                                href={`mailto:${email}`}
                                className="text-primary hover:underline"
                            >
                                {email}
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};