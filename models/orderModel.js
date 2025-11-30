const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  artwork: {
    type: mongoose.Schema.ObjectId,
    ref: "Art",
    required: [true, "Order must belong to an Artwork!"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Order must belong to a User!"],
  },
  price: {
    type: Number,
    required: [true, "Order must have a price."],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
  fulfilled: {
    type: Boolean,
    default: false,
  },
  shippingAddress: {
    type: Object,
    required: [true, "Order must have a shipping address"],
  },
  paymentId: {
    type: String,
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
