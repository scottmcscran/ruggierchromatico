const express = require("express");
const artworkController = require("../controllers/artworkController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(artworkController.getAllArtworks)
  .post(
    authController.protect,
    authController.restrictTo("admin"),
    artworkController.uploadArtworkImages,
    artworkController.resizeArtworkImages,
    artworkController.createArtwork
  );

router
  .route("/:id")
  .get(artworkController.getArtwork)
  .patch(
    authController.protect,
    authController.restrictTo("admin"),
    artworkController.uploadArtworkImages,
    artworkController.resizeArtworkImages,
    artworkController.updateArtwork
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    artworkController.deleteArtwork
  );

module.exports = router;
