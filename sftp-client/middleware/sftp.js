require('dotenv').config();
const fs = require('fs');
const events = require('events');
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
  password: RACK_PASSWORD,
};

const progress = {};

const eventEmitter = new events.EventEmitter();

const SFTPrequestList = async (req, res, next) => {
  let reqdirlist = req.params.directory;
  for (let member in progress) delete progress[member];
  console.log('progress:', progress);
  console.log('Setting up SFTP client...');
  let Client = require('ssh2-sftp-client');
  let sftp = new Client();
  console.log('Starting connection to sftp server...');
  console.log(`logging in with user: ${RACK_USER}, pass: ${RACK_PASSWORD}`);
  console.log(`Getting directory list of /${reqdirlist}`);
  try {
    await sftp.connect(SFTP_OPTIONS);
    let dirlist = await sftp.list(`/${reqdirlist}`);
    const sizes = dirlist.reduce((sizes, img) => {
      return sizes.concat(img.size);
    }, []);
    const totalSize = sizes.reduce((total, size) => total + size);
    console.log('Received directory listing...');
    res.header('Access-Control-Allow-Origin', CORS_ORIGIN); // update to match the domain you will make the request from
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    res.json({
      reqdir: reqdirlist,
      dirlist,
      totalSize,
      err: false,
      errcode: null,
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
      errcode: err.code,
    });
  } finally {
    try {
      await sftp.end();
    } catch (error) {
      // if an error, it was already closed probably...
    }
  }
  next();
};

const SFTPrequestFile = async (req, res, next) => {
  // response independent wether it was fetched via sftp or already existed:
  res.header('Access-Control-Allow-Origin', CORS_ORIGIN); // update to match the domain you will make the request from
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );

  let reqfile = req.params.file;
  let reqext = req.params.ext;
  const pathToImg = `${LOCAL_IMG_PATH}${reqfile}.${reqext}`;
  let fileExists = false;
  let localPath = `${LOCAL_IMG_PATH}${reqfile}.${reqext}`;
  let sftpError = false;
  let sftpErrorCode = null;
  let fileSize = 0;
  try {
    if (fs.existsSync(pathToImg)) {
      const stats = fs.statSync(pathToImg);
      const fileSizeInBytes = stats['size'];
      console.log(
        `No need get ${reqfile}.${reqext} from RACK because already exists: ${pathToImg}. Size on disk: ${fileSizeInBytes} bytes`
      );
      fileExists = true;
      fileSize = fileSizeInBytes;
      progress[`${reqfile}_${reqext}`] = fileSizeInBytes;
      console.log('progress in file:', progress);
      eventEmitter.emit('progress');
      console.log('emitted already found');
    } else {
      fileExists = false;
      progress[`${reqfile}_${reqext}`] = 0;
      eventEmitter.emit('progress');
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
      let stats = await sftp.stat(remotePath); // gets the file stats before downloading
      const downloadOptions = {
        step: (total_transferred, chunk, total) => {
          const percDone = Math.round((total_transferred / total) * 100);
          console.log(`${reqfile}.${reqext}: ${percDone}%`); // callback called each time a chunk is transferred
          progress[`${reqfile}_${reqext}`] = total_transferred;
          console.table(progress);
          eventEmitter.emit('progress');
        },
      };
      let downloadresult = await sftp.fastGet(
        remotePath,
        localPath,
        downloadOptions
      );
      fileSize = stats.size;
      console.log('DLRES:', downloadresult);
      console.log(
        `Received file ${reqfile}.${reqext}... Size: ${fileSize} bytes`
      );
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

  const dlres = {
    reqfile,
    reqext,
    localPath,
    fileSize,
    err: sftpError,
    errcode: sftpErrorCode,
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
    sftp.on('download', (info) => {
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
      errcode: null,
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
      errcode: err.code,
    });
  } finally {
    sftp.end();
  }
  next();
};

module.exports = {
  SFTPrequestList,
  SFTPrequestFile,
  SFTPdownloadDir,
  progress,
  eventEmitter,
};
