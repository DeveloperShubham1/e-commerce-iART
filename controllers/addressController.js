import Address from "../models/Address.js";

// Add Address : POST /api/address/add
export const addAddress = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized — user not logged in",
      });
    }

    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address data is required",
      });
    }

    await Address.create({ ...address, userId });

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message,
    });
  }
};

// Get Address : GET /api/address/get
export const getAddress = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized — user not logged in",
      });
    }

    const addresses = await Address.find({ userId });

    return res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message,
    });
  }
};
