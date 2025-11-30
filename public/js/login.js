/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/admin__portal/login",
      data: {
        email,
        password,
      },
    });

    if (res.data.status === "success") {
      showAlert("success", "Logged in successfully!");
      window.setTimeout(() => {
        location.assign("/admin");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "/api/v1/admin__portal/logout",
    });
    if ((res.data.status = "success")) location.reload(true);
  } catch (err) {
    console.log(err);
    showAlert("error", "Error logging out! Try again.");
  }
};
