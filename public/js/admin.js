/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export const uploadArtwork = async (data) => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/admin__portal/upload",
      data,
    });

    if (res.data.status === "success") {
      showAlert("success", "Artwork uploaded successfully!");
      return true;
    }
  } catch (err) {
    console.error(err);
    const message =
      err.response && err.response.data && err.response.data.message
        ? err.response.data.message
        : "Something went wrong! Please try again.";
    showAlert("error", message);
    return false;
  }
};

export const deleteArtwork = async (id) => {
  try {
    const res = await axios({
      method: "DELETE",
      url: `/api/v1/admin__portal/delete/${id}`,
    });

    if (res.status === 204) {
      showAlert("success", "Artwork deleted successfully!");
      return true;
    }
  } catch (err) {
    showAlert("error", "Error deleting artwork! Try again.");
    return false;
  }
};

export const updateArtwork = async (id, data) => {
  try {
    const res = await axios({
      method: "PATCH",
      url: `/api/v1/admin__portal/update/${id}`,
      data,
    });

    if (res.data.status === "success") {
      showAlert("success", "Artwork updated successfully!");
      return res.data.data.artwork;
    }
  } catch (err) {
    showAlert("error", err.response.data.message || "Error updating artwork!");
    return false;
  }
};

export const toggleOrderFulfilled = async (id) => {
  try {
    const res = await axios({
      method: "PATCH",
      url: `/api/v1/admin__portal/order/${id}/fulfill`,
    });

    if (res.data.status === "success") {
      showAlert("success", "Order status updated!");
      return res.data.data.order;
    }
  } catch (err) {
    showAlert("error", "Error updating order status!");
    return false;
  }
};
