import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import router from './routes/index.js';
import requestValidator from './middleware/requestValidator.js';
require('dotenv').config();

const basicAuth = require('express-basic-auth');

// Set up the express app
const app = express();

let corsConfig = {
  origin: process.env.CORS_HOST
};

// Parse incoming requests data
app.use(cors(corsConfig));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(basicAuth({
  authorizer: requestValidator.authorize,
  unauthorizedResponse: requestValidator.getUnauthorizedResponse
}));
app.use(function(req, res, next) {
  // Replace "_" in username with ":" to ensure DID is valid
  // This is caused because HTTP Basic Auth doesn't support ":" in username
  req.auth.user = req.auth.user.replace(/_/g, ':');
  next();
});
app.use(router);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});