const express = require("express");
const router = express.Router();

//! Files and Img packages
const fileUpload = require("express-fileupload"); // fileupload import
const cloudinary = require("cloudinary").v2; // cloudinary import
const convertToBase64 = require("../utils/convertToBase64"); // middleware to convert buffer into base64

//  ! Authentication middleware
const isAuthenticated = require("../middlewares/isAuthenticated");

// ! Importing Offer model
const Offer = require("../models/Offer");

//! Routes starting
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const {
        productName,
        productDescription,
        productPrice,
        productBrand,
        productSize,
        productCondition,
        productColor,
        productCity,
      } = req.body;

      // ! Limit productName to 50 characters
      if (productName.length > 50) {
        return res
          .status(400)
          .json({ message: "Product name cannot exceed 50 characters" });
      }

      // ! Limit productDescription to 500 characters
      if (productDescription.length > 500) {
        return res.status(400).json({
          message: "Product description cannot exceed 500 characters",
        });
      }

      // ! Limit productPrice to 100 000
      if (productPrice > 100000) {
        return res.status(400).json({
          message: "Product price cannot exceed 100 000",
        });
      }

      const productPicture = await cloudinary.uploader.upload(
        convertToBase64(req.files.productPicture),
        {
          folder: "/vinted/offres",
        }
      );

      if (!productPicture) {
        return res.status(400).json({
          message: "A picture of the product is required 🖼",
        });
      }

      const newOffer = new Offer({
        product_name: productName,
        product_description: productDescription,
        product_price: productPrice,
        product_details: [
          {
            BRAND: productBrand,
          },
          {
            SIZE: productSize,
          },
          {
            CONDITION: productCondition,
          },
          {
            COLOR: productColor,
          },
          {
            CITY: productCity,
          },
        ],
        product_image: productPicture,
        owner: req.user._id,
      });

      await newOffer.save();
      res.status(201).json({ message: "Offer created", newOffer });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    const {
      productName,
      priceMin,
      priceMax,
      productCity,
      productColor,
      productSize,
      productBrand,
      sort,
      page,
    } = req.query;

    // ! Creates an empty object filter used to filter the offers based on the query parameters and will be used as an argument to the find()
    const filter = {};

    // ! If a productName query exists then filter
    if (productName) {
      filter.product_name = new RegExp(productName, "i");
    }

    if (productCity) {
      filter.product_details.CITY = new RegExp(productCity, "i");
    }

    // ! If a priceMin query exists then filter
    if (priceMin) {
      filter.product_price = {
        $gte: priceMin,
      };
    }

    // ! If a priceMax query exists then filter, handling the case when another product_price filter exists too
    if (priceMax) {
      if (filter.product_price) {
        filter.product_price.$lte = priceMax;
      } else {
        filter.product_price = {
          $lte: priceMax,
        };
      }
    }

    // ! SORT
    const sortFilter = {};

    if (sort === "price-desc") {
      sortFilter.product_price = "desc";
    } else if (sort === "price-asc") {
      sortFilter.product_price = "asc";
    }

    // ! Calculates the number of offers to skip based on the page parameter. Implement pagination.
    let pageToSend = 1;
    if (page) {
      pageToSend = page;
    }

    const skip = (pageToSend - 1) * 5; //

    const offers = await Offer.find(filter)
      .sort(sortFilter)
      .limit(10)
      .skip(skip);
    //   .select("product_name product_price");

    const numberOfOffers = await Offer.countDocuments(filter);

    res.json({ count: numberOfOffers, offers: offers });

    // ? Starting code
    // const offers = await Offer.find({
    //   product_name: {
    //     $regex: productName,
    //     $option: "i",
    //   },
    //   product_price: {
    //     $gte: priceMin,
    //     $lte: priceMax,
    //   },
    //   "product_details.CITY": productCity,
    //   "product_details.COLOR": productColor,
    //   "product_details.SIZE": productSize,
    //   "product_details.BRAND": productBrand,
    // }).sort({ product_price: "asc" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account _id"
    );
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/offers/:id", isAuthenticated, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    if (offer.owner.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this offer" });
    }

    await offer.remove();

    res.json({ message: "Offer deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/offers/:id", isAuthenticated, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    if (offer.owner.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to modify this offer" });
    }

    const {
      productName,
      productDescription,
      productPrice,
      productBrand,
      productSize,
      productCondition,
      productColor,
      productCity,
    } = req.body;

    offer.product_name = productName;
    offer.product_description = productDescription;
    offer.product_price = productPrice;
    offer.product_details = [
      {
        BRAND: productBrand,
      },
      {
        SIZE: productSize,
      },
      {
        CONDITION: productCondition,
      },
      {
        COLOR: productColor,
      },
      {
        CITY: productCity,
      },
    ];

    await offer.save();

    res.json({ message: "Offer modified", offer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
