const express = require("express");
const orderController = require("../controllers/orderController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router.get("/checkout-session/:artworkId", orderController.getCheckoutSession);

module.exports = router;
