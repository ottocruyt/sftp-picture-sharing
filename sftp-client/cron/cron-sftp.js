require('dotenv').config();
const fs = require('fs');
const RACK_IP = process.env.RACK_IP;
const RACK_PORT = process.env.RACK_PORT;
const RACK_USER = process.env.RACK_USER;
const RACK_PASSWORD = process.env.RACK_PASSWORD;
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const LOCAL_IMG_PATH = process.env.LOCAL_IMG_PATH; // local path of the node server.
const REMOTE_IMG_PATH = process.env.REMOTE_IMG_PATH; // remote path of the rack folder = 'tmp'
const SFTP_OPTIONS = {
  host: RACK_IP,
  port: RACK_PORT,
  username: RACK_USER,
  password: RACK_PASSWORD,
};

class KnownError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

const SFTPdownloadDir = async () => {
  try {
    let reqfolder = REMOTE_IMG_PATH;
    const hrstart = process.hrtime();
    //console.log('Setting up SFTP client...');
    let Client = require('ssh2-sftp-client');
    let sftp = new Client();
    sftp.on('error', (err) => {
      console.log('WARNING: ', err.message); // catch error that is not handled
    });
    let downloadresult;
    //console.log('Starting connection to sftp server...');
    //console.log(`logging in with user: ${RACK_USER}, pass: ${RACK_PASSWORD}`);
    //console.log(`Getting folder ${reqfolder}`);
    try {
      await sftp.connect(SFTP_OPTIONS);
    } catch (error) {
      closeConnection(hrstart);
      throw new KnownError(`${error.code}: ${error.message}`);
    }

    let remotePath = `/${reqfolder}`;
    let localPath = `${LOCAL_IMG_PATH}`;
    //console.log(`Download from ${remotePath} to ${localPath}`);
    sftp.on('download', (info) => {
      console.log(`Downloaded ${info.source} to ${localPath}`);
    });
    try {
      downloadresult = await sftp.downloadDir(remotePath, localPath);
    } catch (error) {
      closeConnection(hrstart);
      throw new KnownError(`${error.code}: ${error.message}`);
    }
    //console.log('DLRES:', downloadresult);
    console.log(`Received folder ${reqfolder}...`);
    const dlres = {
      reqfolder,
      msg: downloadresult,
      localPath,
      err: false,
      errcode: null,
    };
    closeConnection(hrstart);
  } catch (error) {
    if (error instanceof KnownError) {
      throw error;
    } else {
      console.log('Unhandled error catched: ', error.message);
    }
  }
};

async function closeConnection(hrstart) {
  try {
    await sftp.end();
  } catch (error) {
    //console.log('Error closing connection, probably already closed');
    //throw new Error(`${error.code}: ${error.message}`); // when no connection, this will result in error. maybe ignore this error...
  } finally {
    const hrend = process.hrtime(hrstart);
    console.info(
      'Total time for cron job: %ds %dms',
      hrend[0],
      hrend[1] / 1000000
    );
  }
}

module.exports = {
  SFTPdownloadDir,
};
