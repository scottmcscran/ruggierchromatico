const multer = require("multer");
const Art = require(`./../models/artworkModel`);
const { catchAsync } = require(`./../utils/catchAsync`);
const AppError = require("./../utils/appError");
const Order = require("../models/orderModel");
const { uploadToR2, deleteFromR2 } = require("../utils/r2");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadArtworkImage = upload.single("image");

exports.uploadArtWork = catchAsync(async (req, res) => {
  if (req.file) {
    const ext = req.file.mimetype.split("/")[1];
    const filename = `art-${req.user.id}-${Date.now()}.${ext}`;

    // Upload to R2
    const imageUrl = await uploadToR2(req.file, filename);
    req.body.image = imageUrl;
  }

  const newArt = await Art.create(req.body);

  res.status(201).json({ status: `success`, data: newArt });
});

exports.updateArtWork = catchAsync(async (req, res, next) => {
  // 1) Get artwork
  const artwork = await Art.findById(req.params.id);
  if (!artwork) return next(new AppError("No artwork found with that ID", 404));

  // 2) Handle Image Upload
  if (req.file) {
    const ext = req.file.mimetype.split("/")[1];
    const filename = `art-${req.user.id}-${Date.now()}.${ext}`;

    // Upload new image to R2
    const imageUrl = await uploadToR2(req.file, filename);
    req.body.image = imageUrl;

    // Delete old image from R2 if it exists and is an R2 URL
    if (artwork.image && artwork.image.startsWith("http")) {
      const oldFilename = artwork.image.split("/").pop();
      // Don't await this, let it happen in background or catch error so we don't fail the update
      deleteFromR2(oldFilename).catch((err) =>
        console.error("Failed to delete old image from R2", err)
      );
    }
  }

  // 3) Check if we are applying a discount
  if (req.body.discountPercent) {
    const discount = req.body.discountPercent * 1; // Convert to number
    if (discount > 0 && discount <= 100) {
      // Calculate new price
      const newPrice = Math.round(artwork.price * (1 - discount / 100));
      req.body.priceDiscount = newPrice;
    } else if (discount === 0) {
      // Remove discount
      req.body.priceDiscount = null;
      req.body.discountExpiresAt = null;
    }
  }

  // 4) Handle Discount Expiration
  if (req.body.discountExpiresAt) {
    // Ensure it's a valid date or null
    if (req.body.discountExpiresAt === "") {
      req.body.discountExpiresAt = null;
    }
  }

  // 5) Update artwork
  const updatedArtwork = await Art.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      artwork: updatedArtwork,
    },
  });
});

exports.deleteArtWork = catchAsync(async (req, res, next) => {
  const art = await Art.findById(req.params.id);

  if (!art) {
    return next(new AppError(`No art with that ID`, 404));
  }

  // Delete from R2 if it's a full URL (assuming R2 URL)
  if (art.image && art.image.startsWith("http")) {
    const filename = art.image.split("/").pop();
    await deleteFromR2(filename);
  }
  // If it's local, we could delete it from fs, but let's skip that for now or add fs.unlink

  await Art.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: `success`,
    message: `Art Work Deleted Successfully`,
  });
});

exports.toggleOrderFulfilled = catchAsync(async (req, res, next) => {
  // Now we toggle fulfillment on the Artwork document itself
  const artwork = await Art.findById(req.params.id);

  if (!artwork) {
    return next(new AppError("No artwork found with that ID", 404));
  }

  artwork.fulfilled = !artwork.fulfilled;
  await artwork.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    data: {
      order: artwork, // Returning as 'order' to keep frontend compatible
    },
  });
});
