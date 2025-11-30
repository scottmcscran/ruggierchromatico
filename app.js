const path = require("path");
const express = require(`express`);
const morgan = require(`morgan`);
const helmet = require(`helmet`);
const rateLimit = require(`express-rate-limit`);
const cookieParser = require("cookie-parser");
const app = express();

app.set("trust proxy", 1);

const hpp = require(`hpp`);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

const artWorkRouter = require(`./routes/artWorkRoutes`);
const adminRouter = require(`./routes/adminRoutes`);
const viewRouter = require("./routes/viewRoutes");
const orderRouter = require("./routes/orderRoutes");
const orderController = require("./controllers/orderController");

// Set security headers.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "https://*.stripe.com"],
        scriptSrc: [
          "'self'",
          "https://js.stripe.com",
          "https://checkout.stripe.com",
          "https://*.stripe.com",
          "https://*.stripe.network",
          "https://cdn.jsdelivr.net",
          "'unsafe-inline'",
        ],
        frameSrc: [
          "'self'",
          "https://js.stripe.com",
          "https://checkout.stripe.com",
          "https://*.stripe.com",
          "https://*.stripe.network",
        ],
        styleSrc: [
          "'self'",
          "https://fonts.googleapis.com",
          "'unsafe-inline'",
          "https://*.stripe.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://*.stripe.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "https://*.stripe.com",
          "https://assets.ruggierchromatico.com",
        ],
        connectSrc: [
          "'self'",
          "ws://localhost:*",
          "ws://127.0.0.1:*",
          "https://*.stripe.com",
          "https://*.stripe.network",
          "https://checkout.stripe.com",
        ], // Allow Parcel HMR and Stripe
      },
    },
  })
);

app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  orderController.webhookCheckout
);

app.use(express.json());
app.use(cookieParser());

// Expose Stripe Public Key to templates
app.use((req, res, next) => {
  res.locals.stripePublicKey = process.env.STRIPE_PUBLIC_KEY;
  next();
});

if (process.env.NODE_ENV === `development`) {
  app.use(morgan(`dev`));
}

// Rate Limiting
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: `Request limit reached, try again in 1hr`,
  validate: { xForwardedForHeader: false }, // Disable the check causing the error
});
app.use(`/api`, limiter);

app.use(express.json({ limit: `10kb` }));

app.use(
  hpp({
    whitelist: [`price`, `priceDiscount`],
  })
);

app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  // This middleware adds the time property to each request for use in the response.
  req.requestTime = new Date().toISOString();
  next();
});

app.use("/", viewRouter);
app.use(`/api/v1/artworks`, artWorkRouter);
app.use(`/api/v1/orders`, orderRouter);
app.use(`/api/v1/admin__portal`, adminRouter);

module.exports = app;
