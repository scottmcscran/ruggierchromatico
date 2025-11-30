const mongoose = require(`mongoose`);
const slugify = require("slugify");

const workSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, `Add the title dumbass`],
    unique: [true, `This painting already exists`],
  },
  slug: String,
  status: {
    type: String,
    enum: ["for-sale", "sold"],
    default: "for-sale",
  },
  category: {
    type: String,
    enum: ["painting", "carving"],
    default: "painting",
  },
  price: {
    type: Number,
    required: [true, `Add the price ya dunce`],
    default: 2500,
    unique: false,
  },
  priceDiscount: {
    type: Number,
  },
  discountExpiresAt: {
    type: Date,
  },
  description: {
    type: String,
    required: [true, `Add the description you absolute fungus gnat`],
  },
  colorPalette: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: [true, `Add the image dum dum`],
  },
  clicks: {
    type: Number,
    default: 0,
  },
  buyNowClicks: {
    type: Number,
    default: 0,
  },
  clickHistory: [
    {
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: { type: Date, default: Date.now, select: false },
  // Order Details
  buyer: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  paymentId: String,
  fulfilled: {
    type: Boolean,
    default: false,
  },
  shippingAddress: Object,
  soldAt: Date,
});

workSchema.pre(`save`, function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

const Art = mongoose.model(`Art`, workSchema);

module.exports = Art;
