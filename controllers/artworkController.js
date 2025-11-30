const multer = require("multer");
const APIFeatures = require("../utils/apiFeatures");
const { catchAsync } = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Art = require(`./../models/artworkModel`);

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/artworks");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `art-${req.user.id}-${Date.now()}.${ext}`);
  },
});

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

exports.uploadArtworkImages = upload.single("image");

exports.resizeArtworkImages = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `art-${req.user.id}-${Date.now()}.jpeg`;

  // If you had sharp installed, you would resize here.
  // For now, we just proceed since sharp is not in package.json
  next();
});

exports.createArtwork = catchAsync(async (req, res, next) => {
  if (req.file) req.body.image = req.file.filename;
  const newArtWork = await Art.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      data: newArtWork,
    },
  });
});

exports.updateArtwork = catchAsync(async (req, res, next) => {
  if (req.file) req.body.image = req.file.filename;

  const artWork = await Art.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!artWork) {
    return next(new AppError("No artwork found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: artWork,
    },
  });
});

exports.deleteArtwork = catchAsync(async (req, res, next) => {
  const artWork = await Art.findByIdAndDelete(req.params.id);

  if (!artWork) {
    return next(new AppError("No artwork found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getAllArtworks = catchAsync(async (req, res) => {
  const features = new APIFeatures(Art.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const artWorks = await features.query;

  res.status(200).json({
    status: `success`,
    results: artWorks.length,
    data: artWorks,
  });
});

exports.getArtwork = catchAsync(async (req, res, next) => {
  const artWork = await Art.findById(req.params.id);

  if (!artWork) {
    return next(new AppError("No artwork found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: artWork,
    },
  });
});

exports.trackClick = catchAsync(async (req, res, next) => {
  const art = await Art.findById(req.params.id);
  if (!art) return next(new AppError("No artwork found with that ID", 404));

  art.clicks += 1;
  art.clickHistory.push({ timestamp: Date.now() });
  await art.save({ validateBeforeSave: false });

  res.status(200).json({ status: "success", clicks: art.clicks });
});

exports.trackBuyClick = catchAsync(async (req, res, next) => {
  const art = await Art.findById(req.params.id);
  if (!art) return next(new AppError("No artwork found with that ID", 404));

  art.buyNowClicks = (art.buyNowClicks || 0) + 1;
  await art.save({ validateBeforeSave: false });

  res.status(200).json({ status: "success", buyNowClicks: art.buyNowClicks });
});
