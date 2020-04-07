const middleware = require('./middleware/middleware');
const cronjobs = require('./cron/cron-sftp');
require('dotenv').config();

// CRON JOB
const cron = require('node-cron');

// WEB SERVER
const express = require('express');
const app = express();

// cron jobs
// * * * * * = every minute
// * * * * * * = every second
cron.schedule('* * * * *', async function () {
  console.log('Running Cron Job at: ', new Date().toLocaleString());
  cronjobs
    .SFTPdownloadDir()
    .catch((error) => console.log('Problem in Cron Job: ', error.message));
});

// application level middleware for logging
app.use(middleware.logger);

// routes for getting files from RACK
app.get(
  '/sftp/list/:directory',
  middleware.sftp.SFTPrequestList,
  (req, res) => {
    res.end();
  }
);

app.get(
  '/sftp/file/:file.:ext',
  middleware.sftp.SFTPrequestFile,
  (req, res) => {
    res.end();
  }
);

app.get(
  '/sftp/download/:directory',
  middleware.sftp.SFTPdownloadDir,
  (req, res) => {
    res.end();
  }
);

// this is the web page being served.
app.use(express.static('UI'));

// listen for web page being opened
app.listen(process.env.PORT, (req, res) => {
  console.log(`server running on http://localhost:${process.env.PORT}`);
});
