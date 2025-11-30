const Art = require("../models/artworkModel");
const Order = require("../models/orderModel");
const { catchAsync } = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get artwork data from collection
  const filter = { status: "for-sale" };
  if (req.query.category) filter.category = req.query.category;

  const artworks = await Art.find(filter);

  let placeholderCount = (3 - (artworks.length % 3)) % 3;
  if (artworks.length === 0) placeholderCount = 3;

  // 2) Build template
  // 3) Render that template using artwork data from 1)
  res.status(200).render("overview", {
    title: "Current Collection",
    artworks,
    placeholderCount,
    category: req.query.category || "all",
  });
});

exports.getSold = catchAsync(async (req, res, next) => {
  const filter = { status: "sold" };
  if (req.query.category) filter.category = req.query.category;

  const artworks = await Art.find(filter);

  let placeholderCount = (3 - (artworks.length % 3)) % 3;
  if (artworks.length === 0) placeholderCount = 3;

  res.status(200).render("overview", {
    title: "Sold Archive",
    artworks,
    placeholderCount,
    category: req.query.category || "all",
  });
});

exports.getArtwork = catchAsync(async (req, res, next) => {
  const artwork = await Art.findOne({ slug: req.params.slug });

  if (!artwork) {
    return res.status(404).render("artwork404", {
      title: "Artwork Not Found",
    });
  }

  // Increment clicks on page load
  artwork.clicks += 1;
  artwork.clickHistory.push({ timestamp: Date.now() });
  await artwork.save({ validateBeforeSave: false });

  res.status(200).render("artwork", {
    title: artwork.title,
    artwork,
  });
});

exports.getAbout = (req, res) => {
  res.status(200).render("about", {
    title: "About Oliver",
  });
};

exports.getLoginForm = (req, res) => {
  res.status(200).render("login", {
    title: "Log into your account",
  });
};

exports.getAdminDashboard = catchAsync(async (req, res, next) => {
  // Fetch all artworks, populating the buyer field for sold items
  const artworks = await Art.find().populate("buyer").sort("-createdAt");

  // We no longer need separate orders, as order info is on the artwork
  // But we can pass 'orders' as the sold artworks to keep the view logic similar if we want,
  // or just update the view to filter artworks.
  // Let's pass soldArtworks as 'orders' for compatibility with the view we just wrote.
  const orders = artworks.filter((art) => art.status === "sold");

  res.status(200).render("admin", {
    title: "Admin Dashboard",
    artworks,
    orders,
  });
});

exports.getAnalytics = catchAsync(async (req, res, next) => {
  const artworks = await Art.find();
  res.status(200).render("analytics", {
    title: "Analytics",
    artworks,
  });
});
