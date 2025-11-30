const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Art = require("../models/artworkModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const { catchAsync } = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently ordered artwork
  const artwork = await Art.findById(req.params.artworkId);

  // Increment buy now clicks
  artwork.buyNowClicks += 1;
  await artwork.save({ validateBeforeSave: false });

  console.log(
    `Creating checkout session for artwork: ${artwork.title} (ID: ${req.params.artworkId})`
  );

  // Use discounted price if available, otherwise regular price
  let price = artwork.priceDiscount || artwork.price;

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}/?alert=order`,
    cancel_url: `${req.protocol}://${req.get("host")}/artwork/${artwork.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.artworkId,
    metadata: {
      userId: req.user.id,
    },
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "AU", "NZ"],
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${artwork.title} Artwork`,
            description: artwork.description,
            images: [
              artwork.image.startsWith("http")
                ? artwork.image
                : `${req.protocol}://${req.get("host")}/img/artworks/${
                    artwork.image
                  }`,
            ],
          },
          unit_amount: price * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
  });

  // 3) Create session as response
  res.status(200).json({
    status: "success",
    session,
  });
});

const createBookingCheckout = async (session) => {
  const artworkId = session.client_reference_id;
  const userId = session.metadata.userId;
  const price = session.amount_total / 100;
  const shippingAddress = session.shipping_details;

  console.log(`Updating artwork ${artworkId} to sold`);
  if (!artworkId) {
    console.error("No artworkId found in session!");
    return;
  }

  const updatedArt = await Art.findByIdAndUpdate(artworkId, {
    status: "sold",
    buyer: userId,
    paymentId: session.payment_intent,
    shippingAddress: shippingAddress,
    fulfilled: false,
    soldAt: Date.now(),
  });

  if (!updatedArt) {
    console.error(`Artwork with ID ${artworkId} not found!`);
  } else {
    console.log(`Successfully updated artwork ${artworkId} to sold`);
  }

  // Legacy Order creation removed to consolidate logic
  /*
  await Order.create({
    artwork: artworkId,
    user: userId,
    price,
    shippingAddress,
    paymentId: session.id,
  });
  */
  console.log(`Order details saved to artwork for user ${userId}`);
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  console.log("Webhook received!");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  console.log(`Webhook event type: ${event.type}`);

  if (event.type === "checkout.session.completed") {
    console.log("Processing checkout session completed");
    createBookingCheckout(event.data.object).catch((err) =>
      console.error("Error in createBookingCheckout:", err)
    );
  } else {
    console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
};
