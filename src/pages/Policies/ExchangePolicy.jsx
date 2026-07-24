import { useAppContext } from "@/context/AppContext";
import React from "react";

export const ExchangePolicy = () => {
    const { settings } = useAppContext();
    const email = settings?.contact?.email || "test@gmail.com";

    return (
        <section className="bg-[var(--color-primary-bg)] min-h-screen">
            <div className="bg-primary text-white py-16 px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-bold">No Exchange &amp; Return</h1>
                <p className="mt-4 max-w-2xl mx-auto text-white/90">
                    Please read this carefully before placing your order.
                </p>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-10 space-y-6">
                    <p className="text-gray-600">
                        Once an order is placed, it cannot be cancelled, returned or
                        exchanged. We do not offer refunds or exchanges on any product,
                        for any reason, once the order has been confirmed.
                    </p>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Why we don't accept returns
                        </h2>
                        <p className="mt-3 text-gray-600">
                            Every item is quality-checked and carefully packed by our team
                            before it leaves our warehouse, so we can be confident there
                            are no defects when it reaches you. Because each piece is
                            handled individually, we're not able to accept returns or
                            exchanges once an order has shipped.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Before you order
                        </h2>
                        <p className="mt-3 text-gray-600">
                            Since we don't offer returns or exchanges, please check your
                            size carefully before placing an order. Refer to our size
                            guide, and reach out to us beforehand if you're unsure — we're
                            happy to help you pick the right fit.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Order confirmation
                        </h2>
                        <p className="mt-3 text-gray-600">
                            After placing an order, all details are sent to your email and,
                            where provided, your WhatsApp number for delivery updates.
                            Please check your spam folder if you don't see the confirmation
                            in your inbox.
                        </p>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <p className="text-sm text-gray-500">
                            Questions before you order? Reach us at{" "}
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