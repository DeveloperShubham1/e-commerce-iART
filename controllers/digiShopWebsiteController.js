import MailService from "../services/mailService.js";

export const websiteContactUs = async (req, res) => {
    try {
        const { name, email, phone, company, message } = req.body;

        const newContact ={
            name,
            email,
            phone,
            company,
            message,
        };

        // Fire-and-forget so a slow/failed mail send never blocks the API response
        Promise.allSettled([
            MailService.sendContactUsNotification(newContact),
            MailService.sendContactUsSelfNotification(newContact),
        ]).then((results) => {
            results.forEach((r) => {
                if (r.status === "rejected") {
                    console.error("Contact Us mail dispatch failed:", r.reason);
                }
            });
        });

        return res.status(201).json({
            success: true,
            message: "Contact form submitted successfully",
            contact: newContact,
        });
    } catch (err) {
        console.error("Error submitting website contact form:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while submitting contact form",
            error: err.message,
        });
    }
};