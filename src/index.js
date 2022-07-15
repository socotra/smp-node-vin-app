const { default: axios } = require("axios");
const express = require("express");
const app = express();

/**
 * Retrieve env variables for port to listen to as well as the state api URL.
 */
const port = process.env["SMP_PORT"] ?? "3000";
const listenPort = parseInt(port);
const stateApi = process.env["SMP_STATE_API"];

/**
 * Main root endpoint
 */
app.get("/", async (req, res) => {
  // Get SMP Key and configuration in each request.
  const key = req.headers["x-smp-key"];
  const stateUrl = `${stateApi}/state/${key}`;
  const config = (await axios.get(stateUrl)).data;

  const { socotraApiUrl, tenantHostName, token, settings, mappings } = config;

  //Using external service to lookup the vin details
  const vin = req.params?.vin ?? "WBANF73576CG65408";
  const vinLookupUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`;
  const apiResult = await axios.get(vinLookupUrl);
  if (apiResult.data.Results.length === 0) {
    return res.send({});
  }

  // compose result for socotra
  const data = apiResult.data.Results[0];
  const fieldValues = {
    make: data.Make,
    model: data.Model,
    year: data.ModelYear,
  };

  res.send({ fieldValues });
});




/**
 * Debugging endpoint
 */
app.get("/debug", async (req, res) => {
  const key = req.headers["x-smp-key"];
  const url = `${stateApi}/state/${key}`;
  const config = (await axios.get(`${stateApi}/state/${key}`))?.data;

  //export to external
  if (config.settings?.debugPostUrl) {
    try {
      await axios.post(config.settings.debugPostUrl, {
        config,
        headers: req.headers,
        env: process.env,
        req: req.body,
      });
    } catch (error) {}
  }
  res.send({
    config,
    headers: req.headers,
    env: process.env,
  });
});


app.listen(listenPort, () => {
  console.log(`App listening on port ${listenPort}`);
});
