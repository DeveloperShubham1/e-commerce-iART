import mongoose from "mongoose";
import Product from "../models/Product.js";
import Collection from "../models/Collection.js";
import CollectionAssign from "../models/CollectionAssign.js";

export const createCollection = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const merchantId = req.merchant._id;

    const { name, description, image, productIds = [] } = req.body;

    if (!name) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Collection name is required",
      });
    }

    const collection = await Collection.create(
      [
        {
          merchantId,
          name,
          description,
          image,
        },
      ],
      { session },
    );

    if (productIds.length) {
      const assignments = [
        ...new Map(
          productIds.map((id) => [
            id,
            {
              merchantId,
              collection: collection[0]._id,
              product: id,
            },
          ]),
        ).values(),
      ];

      await CollectionAssign.insertMany(assignments, {
        session,
        ordered: false,
      });
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Collection created successfully",
      collection: collection[0],
    });
  } catch (error) {
    await session.abortTransaction();

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const updateCollection = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const merchantId = req.merchant._id;
    const { id } = req.params;

    const { name, description, image, productIds = [] } = req.body;

    const collection = await Collection.findOne({
      _id: id,
      merchantId,
    }).session(session);

    if (!collection) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    if (name !== undefined) collection.name = name;
    if (description !== undefined) collection.description = description;
    if (image !== undefined) collection.image = image;

    await collection.save({ session });

    // Remove old products
    await CollectionAssign.deleteMany(
      {
        merchantId,
        collection: id,
      },
      { session },
    );

    // Add new products
    if (productIds.length) {
      const assignments = [
        ...new Map(
          productIds.map((pid) => [
            pid,
            {
              merchantId,
              collection: id,
              product: pid,
            },
          ]),
        ).values(),
      ];

      await CollectionAssign.insertMany(assignments, {
        session,
        ordered: false,
      });
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Collection updated successfully",
    });
  } catch (error) {
    await session.abortTransaction();

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const getCollections = async (req, res) => {
  try {
    const merchantId = req.merchant._id;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const result = await Collection.aggregate([
      {
        $match: {
          merchantId,
        },
      },
      {
        $facet: {
          collections: [
            {
              $sort: {
                createdAt: -1,
              },
            },
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
            {
              $lookup: {
                from: "collectionassigns",
                localField: "_id",
                foreignField: "collection",
                as: "products",
              },
            },
            {
              $addFields: {
                productCount: {
                  $size: "$products",
                },
              },
            },
            {
              $project: {
                products: 0,
              },
            },
          ],
          totalCount: [
            {
              $count: "count",
            },
          ],
        },
      },
    ]);

    const collections = result[0].collections;
    const total = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
      success: true,
      collections,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCollectionById = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    const { id } = req.params;

    const collection = await Collection.findOne({
      _id: id,
      merchantId,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    const products = await CollectionAssign.find({
      collection: id,
    }).populate({
      path: "product",
      select: "name variants.images variants.thumbnailIndex variants.sizes",
      transform: (doc) => {
        if (!doc) return null;

        return {
          _id: doc._id,
          name: doc.name,
          variants:
            doc.variants?.map((variant) => {
              const index = variant.thumbnailIndex ?? 0;

              return {
                image: variant.images?.[index] || variant.images?.[0] || null,
                price: variant.sizes?.[0]?.price || null, // ← top-level price
                sizes: variant.sizes || [], // ← all sizes
              };
            }) || [],
        };
      },
    });
    res.json({
      success: true,
      collection,
      products: products.map((p) => p.product),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCollection = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const merchantId = req.merchant._id;
    const { id } = req.params;

    const collection = await Collection.findOne({
      _id: id,
      merchantId,
    }).session(session);

    if (!collection) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    await Collection.deleteOne(
      {
        _id: id,
      },
      { session },
    );

    await CollectionAssign.deleteMany(
      {
        collection: id,
      },
      { session },
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Collection deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const addProductsToCollection = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    const { id } = req.params;
    const { productIds = [] } = req.body;

    const collection = await Collection.findOne({
      _id: id,
      merchantId,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    if (!productIds.length) {
      return res.status(400).json({
        success: false,
        message: "No products provided",
      });
    }

    const existing = await CollectionAssign.find({
      collection: id,
      product: { $in: productIds },
    }).select("product");

    const existingIds = new Set(
      existing.map((item) => item.product.toString()),
    );

    const newProducts = productIds.filter(
      (pid) => !existingIds.has(pid.toString()),
    );

    if (newProducts.length) {
      await CollectionAssign.insertMany(
        newProducts.map((pid) => ({
          merchantId,
          collection: id,
          product: pid,
        })),
      );
    }

    res.json({
      success: true,
      message: `${newProducts.length} product(s) added`,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get products for collection
export const getProductsForCollection = async (req, res) => {
  try {
    const merchantId = req.merchant._id;

    const products = await Product.aggregate([
      {
        $match: {
          merchantId,
          isActive: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          image: {
            $let: {
              vars: {
                variant: { $arrayElemAt: ["$variants", 0] },
              },
              in: {
                $arrayElemAt: [
                  "$$variant.images",
                  {
                    $ifNull: ["$$variant.thumbnailIndex", 0],
                  },
                ],
              },
            },
          },
          thumbnailIndex: {
            $ifNull: [{ $arrayElemAt: ["$variants.thumbnailIndex", 0] }, 0],
          },
        },
      },
      {
        $sort: {
          name: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeProductFromCollection = async (req, res) => {
  try {
    const merchantId = req.merchant._id;

    const { id, productId } = req.params;

    const deleted = await CollectionAssign.findOneAndDelete({
      merchantId,
      collection: id,
      product: productId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found in collection",
      });
    }

    res.json({
      success: true,
      message: "Product removed successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
