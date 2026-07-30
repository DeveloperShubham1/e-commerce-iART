import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import SuperAdmin from "../models/SuperAdmin.js";
import Merchant from "../models/Merchants.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

// ============================= REGISTER =============================
export const register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, phone and password are required.",
            });
        }

        const existingAdmin = await SuperAdmin.findOne({
            $or: [{ email }, { phone }],
        });

        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Super Admin already exists.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await SuperAdmin.create({
            name,
            email,
            phone,
            password: hashedPassword,
        });

        const token = jwt.sign(
            {
                id: admin._id,
                role: "super_admin",
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("superAdminToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(201).json({
            success: true,
            message: "Super Admin registered successfully.",
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                isActive: admin.isActive,
            },
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================= LOGIN =============================
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const admin = await SuperAdmin.findOne({ email }).select("+password");

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated.",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            admin.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const token = jwt.sign(
            {
                id: admin._id,
                role: "super_admin",
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.cookie("superAdminToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                isActive: admin.isActive,
            },
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================= GET PROFILE =============================
export const getProfile = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            superAdmin: req.superAdmin,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================= UPDATE PROFILE =============================
export const updateProfile = async (req, res) => {
    try {
        const superAdminId = req.superAdmin._id;

        const {
            name,
            email,
            phone,
            currentPassword,
            newPassword,
        } = req.body;

        const superAdmin = await SuperAdmin.findById(superAdminId);

        if (!superAdmin) {
            return res.status(404).json({
                success: false,
                message: "Super Admin not found",
            });
        }

        // --------------------------
        // Update basic details
        // --------------------------
        if (name !== undefined) superAdmin.name = name.trim();

        if (email !== undefined) {
            const existing = await SuperAdmin.findOne({
                email,
                _id: { $ne: superAdminId },
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists",
                });
            }

            superAdmin.email = email.trim();
        }

        if (phone !== undefined) {
            const existing = await SuperAdmin.findOne({
                phone,
                _id: { $ne: superAdminId },
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number already exists",
                });
            }

            superAdmin.phone = phone.trim();
        }

        // --------------------------
        // Change password
        // --------------------------
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Current password is required",
                });
            }

            const isCurrentPasswordCorrect = await bcrypt.compare(
                currentPassword,
                superAdmin.password
            );

            if (!isCurrentPasswordCorrect) {
                return res.status(400).json({
                    success: false,
                    message: "Current password is incorrect",
                });
            }

            const isSamePassword = await bcrypt.compare(
                newPassword,
                superAdmin.password
            );

            if (isSamePassword) {
                return res.status(400).json({
                    success: false,
                    message: "New password cannot be the same as the current password",
                });
            }

            superAdmin.password = await bcrypt.hash(newPassword, 10);
        }

        await superAdmin.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            superAdmin: {
                id: superAdmin._id,
                name: superAdmin.name,
                email: superAdmin.email,
                phone: superAdmin.phone,
                isActive: superAdmin.isActive,
            },
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ============================= CREATE MERCHANT LIST =============================
export const createMerchant = async (req, res) => {
    try {
        const {
            MerchantName,
            OwnerName,
            phone,
            whatsappNumber,
            email,
            password,
            razorpayKey,
            razorpaySecret,
            logo,
            address,
            categories,
        } = req.body;

        // Basic validation
        if (!MerchantName || !OwnerName || !phone || !email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "MerchantName, OwnerName, phone, email, and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if merchant already exists
        const existingMerchant = await Merchant.findOne({
            $or: [{ email: normalizedEmail }, { phone }],
        });

        if (existingMerchant) {
            return res.status(409).json({
                success: false,
                message: "Merchant with this email or phone already exists",
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create merchant
        const newMerchant = new Merchant({
            MerchantName,
            OwnerName,
            phone,
            whatsappNumber,
            email: normalizedEmail,
            password: hashedPassword,
            razorpayKey,
            razorpaySecret,
            logo,
            address,
            categories,
        });

        await newMerchant.save();

        // Generate JWT token
        const token = jwt.sign(
            { merchantId: newMerchant._id, email: newMerchant.email },
            process.env.JWT_SECRET,
            { expiresIn: "5d" },
        );

        // Set cookie
        res.cookie("merchantToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 5 * 24 * 60 * 60 * 1000,
        });

        // Success response
        return res.status(201).json({
            success: true,
            message: "Merchant registered successfully",
            merchant: {
                _id: newMerchant._id,
                MerchantName: newMerchant.MerchantName,
                email: newMerchant.email,
                phone: newMerchant.phone,
            },
        });
    } catch (error) {
        console.error("Register merchant error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while registering merchant",
            error: error.message,
        });
    }
};

// ============================= GET MERCHANT LIST =============================
export const getMerchantList = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const perPage = Math.max(parseInt(req.query.per_page) || 10, 1);
        const search = (req.query.search || "").trim();

        const filter = {};

        if (search) {
            filter.$or = [
                { MerchantName: { $regex: search, $options: "i" } },
                { OwnerName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { whatsappNumber: { $regex: search, $options: "i" } },
            ];
        }

        const totalRecords = await Merchant.countDocuments(filter);

        const merchants = await Merchant.find(filter)
            .select({
                MerchantName: 1,
                OwnerName: 1,
                email: 1,
                phone: 1,
                whatsappNumber: 1,
                logo: 1,
                address: 1,
                isSubscribed: 1,
                createdAt: 1,
                "subscription.planName": 1,
                "subscription.endDate": 1,
                "instagram.isConnected": 1,
                "instagram.siteBaseUrl": 1,
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean();

        const data = merchants.map((merchant) => ({
            _id: merchant._id,
            MerchantName: merchant.MerchantName,
            OwnerName: merchant.OwnerName,
            email: merchant.email,
            phone: merchant.phone,
            whatsappNumber: merchant.whatsappNumber,
            logo: merchant.logo,
            address: merchant.address,
            isSubscribed: merchant.isSubscribed,
            planName: merchant.subscription?.planName || null,
            subscriptionEndDate: merchant.subscription?.endDate || null,
            instagramConnected: merchant.instagram?.isConnected || false,
            siteBaseUrl: merchant.instagram?.siteBaseUrl || null,
            createdAt: merchant.createdAt,
        }));

        const totalPages = Math.ceil(totalRecords / perPage);

        return res.status(200).json({
            success: true,
            merchants: data,
            pagination: {
                current_page: page,
                per_page: perPage,
                total_records: totalRecords,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_prev_page: page > 1,
            },
        });
    } catch (error) {
        console.error("Server error to get Merchant List:", error);

        return res.status(500).json({
            success: false,
            message: "Server error to get Merchant List",
            error: error.message,
        });
    }
};

// ============================= UPDATE MERCHANT LIST =============================
export const updateMerchant = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            isSubscribed,
            features,
            subscription,
            razorpayKey,
            razorpaySecret,
            logo,
            address,
            siteBaseUrl,
        } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Merchant ID is required",
            });
        }

        const updateFields = {};

        if (typeof isSubscribed === "boolean")
            updateFields.isSubscribed = isSubscribed;

        if (features?.stockManagement !== undefined) {
            updateFields["features.stockManagement"] = features.stockManagement;
        }

        if (subscription) updateFields.subscription = subscription;
        if (razorpayKey) updateFields.razorpayKey = razorpayKey;
        if (razorpaySecret) updateFields.razorpaySecret = razorpaySecret;
        if (logo) updateFields.logo = logo;
        if (address) updateFields.address = address;
        if (siteBaseUrl !== undefined) updateFields["instagram.siteBaseUrl"] = siteBaseUrl;

        const merchant = await Merchant.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true },
        );

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: "Merchant not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Merchant updated successfully",
            merchant,
        });
    } catch (error) {
        console.error("Update merchant error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update merchant",
        });
    }
};

// ============================= GET DASHBOARD DATA =============================
export const getDashboardData = async (req, res) => {
    try {
        // Dashboard counts
        const [
            totalMerchants,
            subscribedMerchants,
            recentMerchants,
        ] = await Promise.all([
            Merchant.countDocuments(),
            Merchant.countDocuments({ isSubscribed: true }),
            Merchant.find({})
                .select({
                    MerchantName: 1,
                    OwnerName: 1,
                    email: 1,
                    phone: 1,
                    logo: 1,
                    isSubscribed: 1,
                    createdAt: 1,
                })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
        ]);

        // Placeholder values until Customer & Order collections exist
        const totalCustomers = 0;
        const totalOrders = 0;

        return res.status(200).json({
            success: true,

            stats: {
                totalMerchants,
                subscribedMerchants,
                totalCustomers,
                totalOrders,
            },

            merchants: recentMerchants,
        });
    } catch (error) {
        console.error("Dashboard Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load dashboard.",
        });
    }
};

// ============================= SALES SUMMARY =============================
export const getSalesSummary = async (req, res) => {
    try {
        // total orders
        const totalOrders = await Order.countDocuments();

        // total customers (unique users who have placed orders)
        const customersAgg = await Order.aggregate([
            { $group: { _id: "$userId" } },
            { $count: "uniqueCustomers" },
        ]);
        const totalCustomers = (customersAgg[0] && customersAgg[0].uniqueCustomers) || 0;

        // total sales - sum of amountPaid for paid orders, fallback to totalAmount
        const salesAgg = await Order.aggregate([
            { $match: { $or: [{ isPaid: true }, { paymentStatus: "paid" }] } },
            { $group: { _id: null, totalAmountPaid: { $sum: { $ifNull: ["$amountPaid", "$totalAmount"] } } } },
        ]);

        const totalSales = (salesAgg[0] && salesAgg[0].totalAmountPaid) || 0;

        return res.status(200).json({
            success: true,
            stats: {
                totalSales,
                totalOrders,
                totalCustomers,
            },
        });
    } catch (error) {
        console.error("Sales summary error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch sales summary." });
    }
};

// ============================= ORDERS LIST =============================
export const getOrdersList = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const perPage = Math.max(parseInt(req.query.per_page) || 10, 1);
        const search = (req.query.search || "").trim();
        const status = req.query.status;
        const merchantId = req.query.merchantId;

        const filter = {};
        if (search) {
            const searchFilter = [
                { orderId: { $regex: search, $options: "i" } },
            ];

            // If search is a number, also search totalAmount
            const amount = Number(search);
            if (!isNaN(amount)) {
                searchFilter.push({ totalAmount: amount });
                searchFilter.push({ amountPaid: amount });
            }

            filter.$or = searchFilter;
        }
        if (status) filter.orderStatus = status;
        if (merchantId) filter.merchantId = merchantId;

        const totalRecords = await Order.countDocuments(filter);

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate("userId", "name email")
            .populate("merchantId", "MerchantName email")
            .lean();

        const data = orders.map((o) => ({
            id: o._id,
            orderId: o.orderId,
            user: o.userId || null,
            merchant: o.merchantId || null,
            totalAmount: o.totalAmount,
            amountPaid: o.amountPaid,
            paymentStatus: o.paymentStatus,
            orderStatus: o.orderStatus,
            createdAt: o.createdAt,
        }));

        const totalPages = Math.ceil(totalRecords / perPage);

        return res.status(200).json({
            success: true,
            orders: data,
            pagination: {
                current_page: page,
                per_page: perPage,
                total_records: totalRecords,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_prev_page: page > 1,
            },
        });
    } catch (error) {
        console.error("Get orders error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch orders." });
    }
};

// ============================= CUSTOMERS LIST =============================
export const getCustomersList = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const perPage = Math.max(parseInt(req.query.per_page) || 10, 1);
        const search = (req.query.search || "").trim();
        const includeGuests = req.query.includeGuests === "true";

        const filter = {};
        if (!includeGuests) filter.isGuest = false;
        if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];

        const totalRecords = await User.countDocuments(filter);

        const users = await User.find(filter)
            .select({ name: 1, email: 1, isGuest: 1, createdAt: 1 })
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean();

        const data = users.map((u) => ({
            id: u._id,
            name: u.name,
            email: u.email,
            isGuest: u.isGuest || false,
            createdAt: u.createdAt,
        }));

        const totalPages = Math.ceil(totalRecords / perPage);

        return res.status(200).json({
            success: true,
            customers: data,
            pagination: {
                current_page: page,
                per_page: perPage,
                total_records: totalRecords,
                total_pages: totalPages,
                has_next_page: page < totalPages,
                has_prev_page: page > 1,
            },
        });
    } catch (error) {
        console.error("Get customers error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch customers." });
    }
};

// ============================= MERCHANT DETAIL =============================
export const getMerchantDetail = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, message: "Merchant id required" });

        const merchant = await Merchant.findById(id).lean();
        if (!merchant) return res.status(404).json({ success: false, message: "Merchant not found" });

        // revenue and orders count for this merchant
        const agg = await Order.aggregate([
            { $match: { merchantId: merchant._id } },
            { $group: { _id: "$merchantId", totalSales: { $sum: { $ifNull: ["$amountPaid", "$totalAmount"] } }, ordersCount: { $sum: 1 } } },
        ]);

        const stats = agg[0] || { totalSales: 0, ordersCount: 0 };

        return res.status(200).json({ success: true, merchant: { ...merchant, stats } });
    } catch (error) {
        console.error("Get merchant detail error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch merchant detail." });
    }
};

// ============================= MERCHANTS REVENUE STATS =============================
export const getMerchantsRevenue = async (req, res) => {
    try {
        const top = Math.max(parseInt(req.query.top) || 10, 1);

        const agg = await Order.aggregate([
            { $group: { _id: "$merchantId", totalSales: { $sum: { $ifNull: ["$amountPaid", "$totalAmount"] } }, ordersCount: { $sum: 1 } } },
            { $sort: { totalSales: -1 } },
            { $limit: top },
            { $lookup: { from: "merchants", localField: "_id", foreignField: "_id", as: "merchant" } },
            { $unwind: { path: "$merchant", preserveNullAndEmptyArrays: true } },
            { $project: { merchant: { MerchantName: 1, email: 1, phone: 1 }, totalSales: 1, ordersCount: 1 } },
        ]);

        return res.status(200).json({ success: true, data: agg });
    } catch (error) {
        console.error("Merchants revenue error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch merchants revenue." });
    }
};

// ============================= CUSTOMER DETAIL =============================
export const getCustomerDetail = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, message: "Customer id required" });

        const user = await User.findById(id).select({ password: 0 }).lean();
        if (!user) return res.status(404).json({ success: false, message: "Customer not found" });

        const agg = await Order.aggregate([
            { $match: { userId: user._id } },
            { $group: { _id: "$userId", totalOrders: { $sum: 1 }, totalSpent: { $sum: { $ifNull: ["$amountPaid", "$totalAmount"] } } } },
        ]);

        const stats = agg[0] || { totalOrders: 0, totalSpent: 0 };

        return res.status(200).json({ success: true, customer: user, stats });
    } catch (error) {
        console.error("Get customer detail error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch customer detail." });
    }
};

// ============================= TOGGLE MERCHANT SUBSCRIPTION =============================
export const toggleMerchantSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, message: "Merchant id required" });

        const merchant = await Merchant.findById(id);
        if (!merchant) return res.status(404).json({ success: false, message: "Merchant not found" });

        merchant.isSubscribed = !merchant.isSubscribed;
        await merchant.save();

        return res.status(200).json({ success: true, message: "Subscription toggled", merchant: { _id: merchant._id, isSubscribed: merchant.isSubscribed } });
    } catch (error) {
        console.error("Toggle merchant subscription error:", error);
        return res.status(500).json({ success: false, message: "Failed to toggle subscription." });
    }
};
