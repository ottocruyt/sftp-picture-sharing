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
  /*
  console.log('Running Cron Job at: ', new Date().toLocaleString());
  cronjobs
    .SFTPdownloadDir()
    .catch((error) => console.log('Problem in Cron Job: ', error.message));
*/
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

app.get('/sftp/progress', (req, res) => {
  console.log('client connected on progress feedback');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders(); // flush the headers to establish SSE with client
  const progressEvent = middleware.sftp.eventEmitter;
  progressEvent.addListener('progress', () => {
    //console.log('event listener fired');
    res.write(`data: ${JSON.stringify(middleware.sftp.progress)}\n\n`); // res.write() instead of res.send()
  });
  // If client closes connection, stop sending events
  res.on('close', () => {
    progressEvent.removeAllListeners();
    console.log('client disconnected from progress feedback');
    res.end();
  });
});

// this is the web page being served.
app.use(express.static('UI'));

// listen for web page being opened
app.listen(process.env.PORT, (req, res) => {
  console.log(`server running on http://localhost:${process.env.PORT}`);
});
