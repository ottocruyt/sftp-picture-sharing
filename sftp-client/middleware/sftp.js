require('dotenv').config();
const fs = require('fs');
const RACK_IP = process.env.RACK_IP;
const RACK_PORT = process.env.RACK_PORT;
const RACK_USER = process.env.RACK_USER;
const RACK_PASSWORD = process.env.RACK_PASSWORD;
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const LOCAL_IMG_PATH = './UI/img/'; // local path of the node server.
const SFTP_OPTIONS = {
  host: RACK_IP,
  port: RACK_PORT,
  username: RACK_USER,
  password: RACK_PASSWORD
};

const SFTPrequestList = async (req, res, next) => {
  let reqdirlist = req.params.directory;
  console.log('Setting up SFTP client...');
  let Client = require('ssh2-sftp-client');
  let sftp = new Client();
  console.log('Starting connection to sftp server...');
  console.log(`logging in with user: ${RACK_USER}, pass: ${RACK_PASSWORD}`);
  console.log(`Getting directory list of /${reqdirlist}`);
  try {
    let response = await sftp.connect(SFTP_OPTIONS);
    let dirlist = await sftp.list(`/${reqdirlist}`);
    console.log('Received directory listing...');
    res.header('Access-Control-Allow-Origin', CORS_ORIGIN); // update to match the domain you will make the request from
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    res.json({
      reqdir: reqdirlist,
      dirlist,
      err: false,
      errcode: null
    });
    //console.log("dirlist: ",dirlist);
  } catch (err) {
    // catches errors both in fetch and response.json
    console.log('catched error: ', err);
    console.log('Sending error response...');
    res.header('Access-Control-Allow-Origin', CORS_ORIGIN); // update to match the domain you will make the request from
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    res.json({
      reqdir: reqdirlist,
      dirlist: null,
      err: true,
      errcode: err.code
    });
  } finally {
    sftp.end();
  }
  next();
};

const SFTPrequestFile = async (req, res, next) => {
  let reqfile = req.params.file;
  let reqext = req.params.ext;
  const pathToImg = `${LOCAL_IMG_PATH}${reqfile}.${reqext}`;
  let fileExists = false;
  let localPath = `${LOCAL_IMG_PATH}${reqfile}.${reqext}`;
  let sftpError = false;
  let sftpErrorCode = null;
  try {
    if (fs.existsSync(pathToImg)) {
      console.log(
        `No need get ${reqfile}.${reqext} from RACK because already exists: ${pathToImg}`
      );
      fileExists = true;
    }
  } catch (err) {
    console.error(err);
  }

  // get file from RACK because is not on node server
  if (!fileExists) {
    console.log('Setting up SFTP client...');
    let Client = require('ssh2-sftp-client');
    let sftp = new Client();
    console.log('Starting connection to sftp server...');
    console.log(`logging in with user: ${RACK_USER}, pass: ${RACK_PASSWORD}`);
    console.log(`Getting file ${reqfile}.${reqext}`);
    try {
      let response = await sftp.connect(SFTP_OPTIONS);
      let remotePath = `/tmp/${reqfile}.${reqext}`;
      console.log(`Download from ${remotePath} to ${localPath}`);
      let downloadresult = await sftp.fastGet(remotePath, localPath);
      console.log('DLRES:', downloadresult);
      console.log(`Received file ${reqfile}.${reqext}...`);
    } catch (err) {
      // catches errors both in fetch and response.json
      console.log('catched error: ', err);
      console.log('Setting response to error...');
      sftpError = true;
      sftpErrorCode = err.code;
    } finally {
      sftp.end();
    }
  }
  // end getting file from RACK

  // response independent wether it was fetched via sftp or already existed:
  res.header('Access-Control-Allow-Origin', CORS_ORIGIN); // update to match the domain you will make the request from
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  const dlres = {
    reqfile,
    reqext,
    localPath,
    err: sftpError,
    errcode: sftpErrorCode
  };
  //console.log('Response:');
  //console.table(dlres);
  res.json(dlres);
  next();
};

const SFTPdownloadDir = async (req, res, next) => {
  let reqfolder = req.params.directory;
  console.log('Setting up SFTP client...');
  let Client = require('ssh2-sftp-client');
  let sftp = new Client();
  console.log('Starting connection to sftp server...');
  console.log(`logging in with user: ${RACK_USER}, pass: ${RACK_PASSWORD}`);
  console.log(`Getting folder ${reqfolder}`);
  try {
    let response = await sftp.connect(SFTP_OPTIONS);

    let remotePath = `/${reqfolder}`;
    let localPath = `${LOCAL_IMG_PATH}${reqfolder}`;
    console.log(`Download from ${remotePath} to ${localPath}`);
    sftp.on('download', info => {
      console.log(`Listener: Download ${info.source}`);
    });
    let downloadresult = await sftp.downloadDir(remotePath, localPath);
    console.log('DLRES:', downloadresult);
    console.log(`Received folder ${reqfolder}...`);
    res.header('Access-Control-Allow-Origin', CORS_ORIGIN); // update to match the domain you will make the request from
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    const dlres = {
      reqfolder,
      msg: downloadresult,
      localPath,
      err: false,
      errcode: null
    };
    //console.log("Response: ", dlres);
    res.json(dlres);
    //console.log("dirlist: ",dirlist);
  } catch (err) {
    // catches errors both in fetch and response.json
    console.log('catched error: ', err);
    console.log('Sending error response...');
    res.header('Access-Control-Allow-Origin', CORS_ORIGIN); // update to match the domain you will make the request from
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    res.json({
      reqfolder,
      msg: null,
      err: true,
      errcode: err.code
    });
  } finally {
    sftp.end();
  }
  next();
};

module.exports = {
  SFTPrequestList,
  SFTPrequestFile,
  SFTPdownloadDir
};
