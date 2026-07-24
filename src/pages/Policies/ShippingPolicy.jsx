import React from "react";
import { useAppContext } from "@/context/AppContext";

export const ShippingPolicy = () => {
    const { settings } = useAppContext();
    const email = settings?.contact?.email || "test@gmail.com";

    return (
        <section className="bg-[var(--color-primary-bg)] min-h-screen">
            <div className="bg-primary text-white py-16 px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-bold">Shipping &amp; Delivery</h1>
                <p className="mt-4 max-w-2xl mx-auto text-white/90">
                    Everything you need to know about how and when your order
                    will reach you.
                </p>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-10 space-y-10">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Estimated delivery time (India)
                        </h2>
                        <ul className="mt-4 space-y-2 text-gray-600">
                            <li>
                                <span className="font-medium text-gray-800">Metro cities:</span>{" "}
                                5 to 8 business days (approx.)
                            </li>
                            <li>
                                <span className="font-medium text-gray-800">Rest of India:</span>{" "}
                                8 to 12 business days (approx.)
                            </li>
                            <li>
                                <span className="font-medium text-gray-800">
                                    Remote / rural areas:
                                </span>{" "}
                                10 to 14 business days (approx.)
                            </li>
                            <li>
                                Free shipping is offered on all orders within India. We
                                currently do not offer cash on delivery.
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            International shipping
                        </h2>
                        <ul className="mt-4 space-y-2 text-gray-600">
                            <li>
                                Shipping charges apply for orders delivered outside India,
                                calculated at checkout based on destination and weight.
                            </li>
                            <li>
                                Any customs duties or import taxes levied by the destination
                                country are the customer's responsibility and are not
                                included in our shipping charge.
                            </li>
                            <li>
                                International orders are typically delivered in 10 to 18
                                business days (approx.), depending on the destination and
                                customs clearance times.
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Order tracking
                        </h2>
                        <p className="mt-4 text-gray-600">
                            Once your order is shipped, you'll receive tracking details by
                            email and, where available, by SMS or WhatsApp on the number
                            provided at checkout. Please check your spam or promotions
                            folder if you don't see it in your inbox.
                        </p>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <p className="text-sm text-gray-500">
                            Questions about a delivery? Reach us at{" "}
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