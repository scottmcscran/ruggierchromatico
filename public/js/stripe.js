/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

const stripeKey = document.querySelector("body").dataset.stripeKey;
const stripe = Stripe(stripeKey);

export const bookArtwork = async (artworkId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/orders/checkout-session/${artworkId}`);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    const message =
      err.response && err.response.data && err.response.data.message
        ? err.response.data.message
        : "Something went wrong! Please try again.";
    showAlert("error", message);
  }
};
