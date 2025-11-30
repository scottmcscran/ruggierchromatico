/* eslint-disable */
import axios from "axios";

const { showAlert } = require(`./alerts`);

module.exports.logIn = async (email, password) => {
  try {
    const res = await axios({
      method: `POST`,
      url: `/api/v1/users/login`,
      data: { email, password },
    });

    if (res.data.status === `success`) {
      showAlert(`success`, `login success`);
      window.setTimeout(() => {
        location.assign(`/`);
      }, 1500);
    }
  } catch (err) {
    showAlert(`error`, err.response.data.message);
  }
};

module.exports.logOut = async () => {
  try {
    const res = await axios({
      method: `GET`,
      url: `/api/v1/users/logout`,
    });

    if (res.data.status === `success`) location.reload(true);
  } catch (err) {
    console.log(err);
    showAlert(`error`, `Could not log out, try again.`);
  }
};
