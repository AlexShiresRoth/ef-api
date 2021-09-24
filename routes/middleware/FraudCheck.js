const { default: axios } = require("axios");

module.exports.FraudCheck = async (obj) => {
  console.log("transaction ud", obj);
  try {
  } catch (error) {
    console.error("error checking fraud", error);

    return error;
  }
};
