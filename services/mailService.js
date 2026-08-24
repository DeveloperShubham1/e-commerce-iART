import SuperAdmin from "../models/SuperAdmin.js";
import mailer from "../utils/mailer.js";
import fs from "fs";
import path from "path";

function renderTemplate(templateName, vars = {}) {
    const file = path.join(
        process.cwd(),
        "utils",
        "mailTemplates",
        templateName
    );

    if (!fs.existsSync(file)) {
        return Object.values(vars).join(" ");
    }

    let tpl = fs.readFileSync(file, "utf8");

    Object.keys(vars).forEach((key) => {
        const re = new RegExp(`{{\\s*${key}\\s*}}`, "g");
        tpl = tpl.replace(re, vars[key] ?? "-");
    });

    return tpl;
}


// ==========================================================
// Send notification to Admins
// ==========================================================

export const sendContactUsNotification = async (contact) => {
    try {
        // Only admins should receive this
        const admins = await SuperAdmin.find({
            email: { $exists: true, $ne: "" },
        }).select("email");

        const adminEmails = admins.map((admin) => admin.email);

        if (adminEmails.length === 0) {
            console.warn(
                "No Admin emails found for contact us notification"
            );
            return;
        }

        const html = renderTemplate("websiteContactUs.html", {
            name: contact.name || "-",
            email: contact.email || "-",
            phone: contact.phone || "-",
            company: contact.company || "-",
            message: contact.message || "-",
        });

        await mailer.sendMail({
            replyTo: contact.email,
            to: adminEmails,
            subject: `New Contact Us Submission: ${contact.name || "Website Visitor"
                }`,
            html,
        });

        console.log(
            "Contact Us notification sent to:",
            adminEmails
        );

    } catch (err) {
        console.error(
            "Contact Us Notification Error:",
            err
        );
    }
};

// ==========================================================
// Send confirmation to user
// ==========================================================

export const sendContactUsSelfNotification = async (contact) => {
    try {
        if (!contact?.email) return;

        const html = renderTemplate("websiteContactUsSelf.html", {
            name: contact.name || "there",
            email: contact.email || "-",
            phone: contact.phone || "-",
            company: contact.company || "-",
            message: contact.message || "-",
        });

        await mailer.sendMail({
            from: `"iART Technologies" <${process.env.SMTP_USER}>`,
            to: contact.email,
            subject: "Thank You for Contacting Us",
            html,
        });

        console.log(
            "Contact Us confirmation sent to:",
            contact.email
        );

    } catch (err) {
        console.error(
            "Contact Us Self Notification Error:",
            err
        );
    }
};


export default {
    sendContactUsNotification,
    sendContactUsSelfNotification,
};