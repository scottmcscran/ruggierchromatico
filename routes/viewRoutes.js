const express = require("express");
const viewController = require("../controllers/viewController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.isLoggedIn);

router.get("/", viewController.getOverview);
router.get("/sold", viewController.getSold);
router.get("/artwork/:slug", viewController.getArtwork);
router.get("/login", viewController.getLoginForm);
router.get(
  "/admin",
  authController.protect,
  authController.restrictTo("admin"),
  viewController.getAdminDashboard
);
router.get(
  "/admin/analytics",
  authController.protect,
  authController.restrictTo("admin"),
  viewController.getAnalytics
);
router.get("/about", viewController.getAbout);

module.exports = router;
