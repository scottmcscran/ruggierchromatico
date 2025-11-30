/* eslint-disable */
import "@babel/polyfill";
import { login, logout } from "./login";
import { bookArtwork } from "./stripe";
import {
  uploadArtwork,
  deleteArtwork,
  updateArtwork,
  toggleOrderFulfilled,
} from "./admin";

// DOM ELEMENTS
const loginForm = document.querySelector(".form--login");
const logOutBtn = document.querySelector(".nav__el--logout");
const bookBtns = document.querySelectorAll(".btn--buy");
const adminTabs = document.querySelectorAll(".admin-tab");
const adminForms = document.querySelectorAll(".admin-form");
const formForSale = document.getElementById("form-for-sale");
const formSold = document.getElementById("form-sold");
const deleteBtns = document.querySelectorAll(".btn--delete");
const updateForms = document.querySelectorAll(".inventory-card__form");
const fulfillBtns = document.querySelectorAll(".btn--fulfill");

// DELEGATION
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener("click", logout);

if (bookBtns) {
  bookBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.target.textContent = "Processing...";
      const { artworkId } = e.target.dataset;
      bookArtwork(artworkId);
    });
  });
}

if (formForSale) {
  formForSale.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("title", document.getElementById("title-sale").value);
    form.append("price", document.getElementById("price-sale").value);
    form.append(
      "description",
      document.getElementById("description-sale").value
    );
    form.append(
      "colorPalette",
      document.getElementById("colorPalette-sale").value
    );
    form.append("category", document.getElementById("category-sale").value);
    form.append("image", document.getElementById("image-sale").files[0]);
    form.append("status", "for-sale");

    const success = await uploadArtwork(form);
    if (success) {
      document.getElementById("title-sale").value = "";
      document.getElementById("price-sale").value = "";
      document.getElementById("description-sale").value = "";
      document.getElementById("colorPalette-sale").value = "";
      document.getElementById("image-sale").value = "";
    }
  });
}

if (formSold) {
  formSold.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("title", document.getElementById("title-sold").value);
    form.append("price", document.getElementById("price-sold").value);
    form.append(
      "description",
      document.getElementById("description-sold").value
    );
    form.append(
      "colorPalette",
      document.getElementById("colorPalette-sold").value
    );
    form.append("category", document.getElementById("category-sold").value);
    form.append("image", document.getElementById("image-sold").files[0]);
    form.append("status", "sold");

    const success = await uploadArtwork(form);
    if (success) {
      document.getElementById("title-sold").value = "";
      document.getElementById("price-sold").value = "";
      document.getElementById("description-sold").value = "";
      document.getElementById("colorPalette-sold").value = "";
      document.getElementById("image-sold").value = "";
    }
  });
}

if (deleteBtns) {
  deleteBtns.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const { id } = e.target.dataset;
      if (confirm("Are you sure you want to delete this artwork?")) {
        const success = await deleteArtwork(id);
        if (success) {
          const card = e.target.closest(".inventory-card");
          if (card) card.remove();
        }
      }
    });
  });
}

if (updateForms) {
  updateForms.forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const { id } = e.target.dataset;
      const discountInput = document.getElementById(`discount-${id}`);
      const discountPercent = discountInput.value;
      const expiresInput = document.getElementById(`expires-${id}`);
      const discountExpiresAt = expiresInput.value;

      const updatedArtwork = await updateArtwork(id, {
        discountPercent,
        discountExpiresAt,
      });
      if (updatedArtwork) {
        const card = e.target.closest(".inventory-card");
        const priceBox = card.querySelector(".inventory-card__price-box");
        if (updatedArtwork.priceDiscount) {
          priceBox.innerHTML = `
            <span class="inventory-card__price inventory-card__price--old">$${updatedArtwork.price}</span>
            <span class="inventory-card__price inventory-card__price--new">$${updatedArtwork.priceDiscount}</span>
          `;
        } else {
          priceBox.innerHTML = `<span class="inventory-card__price">$${updatedArtwork.price}</span>`;
        }
      }
    });
  });
}

if (fulfillBtns) {
  fulfillBtns.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const { orderId } = e.target.dataset;
      const updatedOrder = await toggleOrderFulfilled(orderId);

      if (updatedOrder) {
        const card = e.target.closest(".order-card");
        const tag = card.querySelector(".tag");

        if (updatedOrder.fulfilled) {
          card.classList.remove("unfulfilled");
          card.classList.add("fulfilled");
          e.target.textContent = "Mark Unfulfilled";
          tag.textContent = "Fulfilled";
          tag.classList.remove("tag--active");
          tag.classList.add("tag--sold");
        } else {
          card.classList.remove("fulfilled");
          card.classList.add("unfulfilled");
          e.target.textContent = "Mark Fulfilled";
          tag.textContent = "Pending";
          tag.classList.remove("tag--sold");
          tag.classList.add("tag--active");
        }
      }
    });
  });
}

// TAB SWITCHING
if (adminTabs) {
  adminTabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      if (tab.tagName === "A") return; // Allow links to work normally

      e.preventDefault();
      // Remove active class from all tabs and forms
      adminTabs.forEach((t) => t.classList.remove("active"));
      adminForms.forEach((f) => f.classList.remove("active"));

      // Add active class to clicked tab
      e.target.classList.add("active");

      // Show corresponding form
      const tabName = e.target.dataset.tab;
      const formToShow = document.querySelector(`#form-${tabName}`);
      if (formToShow) {
        formToShow.classList.add("active");
      }
    });
  });
}

// DISCOUNT TIMER
const discountTimer = document.querySelector(".discount-timer");

if (discountTimer) {
  const expiresAt = new Date(discountTimer.dataset.expiresAt).getTime();
  const countdownElement = discountTimer.querySelector(
    ".discount-timer__countdown"
  );

  const updateTimer = () => {
    const now = new Date().getTime();
    const distance = expiresAt - now;

    if (distance < 0) {
      clearInterval(timerInterval);
      discountTimer.innerHTML = "Discount Expired";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    let timeString = "";
    if (days > 0) timeString += `${days}d `;
    if (hours > 0 || days > 0) timeString += `${hours}h `;
    timeString += `${minutes}m ${seconds}s`;

    countdownElement.textContent = timeString;
  };

  updateTimer(); // Run immediately
  const timerInterval = setInterval(updateTimer, 1000);
}
