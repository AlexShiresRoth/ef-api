const stripe = require("stripe")(process.env.STRIPE_LULU_LIVE);
const { default: axios } = require("axios");
const express = require("express");
const { checkAuth } = require("./CheckAuth");
const fs = require("fs");
const { FraudCheck } = require("./FraudCheck");
const { format } = require("date-fns");
const mailgun = require("mailgun-js");
const Report = require("../../models/Report");
const { validateEmail } = require("./validateEmail");
const { validateLocation } = require("./geocode");
const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: "sandboxf00916c1597e4395bbbe3ad940fd43bb.mailgun.org",
});

module.exports.runDisputeReport = async () => {
  //Always mail yesterday's report
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayTime = Math.round(yesterday.getTime() / 1000);

  const yesterdayFormatted = format(yesterday, "P");
  //float between 0-100

  try {
    const disputes = await stripe.disputes.list({
      limit: 100,
      // created: { gte: yesterdayTime },
    });

    const checked = await Promise.all(
      disputes.data.map(async (dispute) => {
        let fraud_risk_score = 0;
        let fraud_details = "";
        try {
          if (!dispute.evidence.customer_email_address) {
            fraud_risk_score = fraud_risk_score + 50;
            fraud_details = `${fraud_details}. No email provided.`;
          }

          const isEmailValid = await validateEmail(
            dispute.evidence.customer_email_address
          );

          if (!isEmailValid.valid) {
            fraud_risk_score = fraud_risk_score + 20;
            fraud_details = `${fraud_details} ${JSON.stringify(
              isEmailValid.reasons
            )}`;
          }

          if (!dispute.evidence.shipping_address) {
            fraud_risk_score = fraud_risk_score + 50;
            fraud_details = `${fraud_details}. No address provided.`;
          }

          const isLocationValid = await validateLocation(
            dispute.evidence.shipping_address
          );

          if (!isLocationValid.valid) {
            fraud_risk_score = fraud_risk_score + 20;
            fraud_details = `${fraud_details} ${JSON.stringify(
              isLocationValid.reasons
            )}`;
          }
          console.log("dispute!", fraud_risk_score, fraud_details);

          if (fraud_risk_score >= 40) {
            const adjustedDispute = {
              ...dispute,
              fraud_risk: fraud_risk_score,
              fraud_details: `FRAUD_RISK_SCORE: ${fraud_risk_score}, please review. ADDITIONAL_FRAUD_REASONS: ${fraud_details}`,
              fraud_score: fraud_risk_score + "%",
            };

            console.log("fraud check", adjustedDispute);
            return adjustedDispute;
          }
          //Return null if no fraudulent dispute was reported
          return null;
        } catch (error) {
          console.error("error! checking dispute", error);
          return undefined;
        }
      })
    );

    const filteredFraudDispute = await checked.filter(Boolean);

    const data = {
      reportBody: filteredFraudDispute,
      reportDate: yesterdayFormatted,
    };

    console.log("checked", data);
    if (data.reportBody.length === 0) {
      console.log("No fraudulent disputes to report");
      return;
    }

    const newReport = new Report(data);

    await newReport.save();

    const yesterdayAPI = `https://ef-api-bridge.herokuapp.com/api/fraud/report/${newReport._id}`;

    const msg = {
      from: "Fraud Report, lordoffraud@popcrumbs.com",
      to: "alex@popcrumbs.com, rcantar@popcrumbs.com",
      subject: yesterdayFormatted + "Here's your daily fraud report",
      html: `<p>Fraud report for yesterday can be accessed <a href=${yesterdayAPI}/>${yesterdayAPI}</a>

      </p>
      <p>Please see attached file to be added to script editor in google sheets. Name the file ImportJSON.<br /></p>
      <p>Call the function from A1 in the sheets like this =ImportJSON("${yesterdayAPI}")</p>`,
      attachment: `googlescripts/ImportJSON.js`,
    };

    mg.messages().send(msg, function (error, body) {
      if (error) console.log("error", error);
      console.log("msg body?", body);
    });

    return newReport;
  } catch (error) {
    console.log("error", error);
    return error;
  }
};
