const express = require("express");
const authController = require("../controllers/authController");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.post("/login", authController.login);
router.get("/logout", authController.logout);

// Protect all routes after this middleware
router.use(authController.protect);
router.use(authController.restrictTo("admin"));

router.post(
  "/upload",
  adminController.uploadArtworkImage,
  adminController.uploadArtWork
);

router.patch("/update/:id", adminController.updateArtWork);
router.delete("/delete/:id", adminController.deleteArtWork);
router.patch("/order/:id/fulfill", adminController.toggleOrderFulfilled);

module.exports = router;
