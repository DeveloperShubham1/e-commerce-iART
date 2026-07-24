import React from "react";
import { Mail, Phone, MapPin, Instagram, Facebook, Youtube } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { footerLinks } from "../assets/assets";

const socialIcons = {
    Instagram,
    Facebook,
    YouTube: Youtube,
};

const Contact = () => {
    const { settings } = useAppContext();

    const rawPhone = settings?.contact?.phone || "9876543210";

    // Display
    const displayPhone = `+91 ${rawPhone}`;

    // Link
    const phoneHref = `tel:+91${rawPhone}`;
    const email = settings?.contact?.email || "test@gmail.com";
    const address =
        settings?.contact?.address ||
        "test, Kharar, India, 140301";

    const contactItems = [
        {
            icon: Mail,
            label: "Email",
            value: email,
            href: `mailto:${email}`,
        },
        {
            icon: Phone,
            label: "Phone",
            value: displayPhone,
            href: phoneHref,
        },
        {
            icon: MapPin,
            label: "Address",
            value: address,
            href: `https://maps.google.com/?q=${encodeURIComponent(address)}`,
        },
    ];

    const socialSection = footerLinks.find((s) => s.title === "Follow Us");

    return (
        <section className="bg-[var(--color-primary-bg)] min-h-screen">
            {/* Hero */}
            <div className="bg-primary text-white py-16 px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-bold">Contact Us</h1>
                <p className="mt-4 max-w-2xl mx-auto text-white/90">
                    Have questions or need assistance? We're here to help. Reach out to us
                    using any of the contact methods below.
                </p>
            </div>

            {/* Contact Cards */}
            <div className="max-w-6xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {contactItems.map(({ icon: Icon, label, value, href }, idx) => (
                        <a
                            key={idx}
                            href={href}
                            target={label === "Address" ? "_blank" : undefined}
                            rel={label === "Address" ? "noopener noreferrer" : undefined}
                            className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-300"
                        >
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto group-hover:bg-primary group-hover:text-white transition">
                                <Icon size={30} />
                            </div>

                            <h3 className="mt-6 text-xl font-semibold text-center text-gray-800">
                                {label}
                            </h3>

                            <p className="mt-3 text-center text-gray-500 break-words">
                                {value}
                            </p>
                        </a>
                    ))}
                </div>

                {/* Follow Us */}
                {socialSection && (
                    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                        <h3 className="text-xl font-semibold text-gray-800">
                            {socialSection.title}
                        </h3>
                        <p className="mt-2 text-gray-500">
                            Stay updated with our latest drops and offers.
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-4">
                            {socialSection.links.map((link, i) => {
                                const Icon = socialIcons[link.text];
                                return (
                                    <a
                                        key={i}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={link.text}
                                        className="group flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition"
                                    >
                                        {Icon && <Icon size={24} />}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Extra Section */}
                <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                    <h2 className="text-2xl font-semibold text-gray-800">
                        We're Happy to Help
                    </h2>

                    <p className="mt-4 text-gray-600 max-w-3xl mx-auto">
                        Whether you have questions about your order, need product
                        recommendations, or want more information about our services, our
                        support team is ready to assist you.
                    </p>

                    <a
                        href={`mailto:${email}`}
                        className="inline-block mt-8 bg-primary text-white px-8 py-3 rounded-lg hover:opacity-90 transition"
                    >
                        Send us an Email
                    </a>
                </div>
            </div>
        </section>
    );
};

export default Contact;