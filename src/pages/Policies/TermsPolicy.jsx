import React from "react";
import { useAppContext } from "@/context/AppContext";

const sections = [
    {
        title: "About these terms",
        body: `This website is operated by DigiShop. Throughout the site, "we", "us" and "our" refer to DigiShop. By visiting our site or placing an order, you agree to be bound by these terms, along with any additional policies referenced here, such as our Shipping and Return policies. If you don't agree with any part of these terms, please don't use our website or services.`,
    },
    {
        title: "Using our site",
        body: `You must be of legal age in your place of residence to use this site, or have a parent or guardian's consent. You agree not to use the site for any unlawful purpose, to interfere with its security, or to transmit any harmful code. We reserve the right to suspend access for anyone who breaches these terms.`,
    },
    {
        title: "Products, pricing & availability",
        body: `We try to display product colours, fabrics and details as accurately as possible, but slight variations can occur due to screen settings and the handcrafted nature of some pieces. Prices, descriptions and availability are subject to change without notice, and we reserve the right to limit quantities or discontinue a product at any time.`,
    },
    {
        title: "Orders & payments",
        body: `We reserve the right to refuse or cancel any order, including in cases of suspected fraud, pricing errors, or unavailable stock. If we cancel an order after payment has been made, we'll process a refund to your original payment method. Please make sure your billing and shipping details are accurate when checking out.`,
    },
    {
        title: "Returns & exchanges",
        body: `Our orders are final once placed. Please see our No Exchange & Return policy page for full details before you order.`,
    },
    {
        title: "Third-party links",
        body: `Our site may link to third-party websites or services, such as payment gateways or social platforms. We aren't responsible for the content, accuracy, or practices of any third-party site, and any transactions you make there are between you and that third party.`,
    },
    {
        title: "Limitation of liability",
        body: `We work hard to keep this site accurate and running smoothly, but we don't guarantee it will be error-free or uninterrupted at all times. To the extent permitted by law, DigiShop isn't liable for indirect or consequential losses arising from your use of the site or our products.`,
    },
    {
        title: "Changes to these terms",
        body: `We may update these terms from time to time by posting the revised version on this page. Continuing to use our site after changes are posted means you accept the updated terms, so we'd encourage you to check back occasionally.`,
    },
    {
        title: "Governing law",
        body: `These terms are governed by the laws of India, and any disputes will be subject to the jurisdiction of the courts local to our registered place of business.`,
    },
];

export const TermsPolicy = () => {
    const { settings } = useAppContext();
    const email = settings?.contact?.email || "test@gmail.com";

    return (
        <section className="bg-[var(--color-primary-bg)] min-h-screen">
            <div className="bg-primary text-white py-16 px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-bold">Terms &amp; Conditions</h1>
                <p className="mt-4 max-w-2xl mx-auto text-white/90">
                    Please read these terms carefully before using our website or
                    placing an order.
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
                            Questions about these terms? Reach us at{" "}
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