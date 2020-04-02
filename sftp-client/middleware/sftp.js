require('dotenv').config();
const RACK_IP = process.env.RACK_IP;
const RACK_PORT = process.env.RACK_PORT;
const RACK_USER = process.env.RACK_USER;
const RACK_PASSWORD = process.env.RACK_PASSWORD;
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const LOCAL_IMG_PATH = "./UI/img/"; // local path of the node server.

const SFTPrequestList = async (req,res,next)=>{
    let reqdirlist = req.params.directory;
    console.log("Setting up SFTP client...");
    let Client = require('ssh2-sftp-client');
    let sftp = new Client();
    console.log("Starting connection to sftp server...");
    console.log(`logging in with user: ${RACK_USER}, pass: ${RACK_PASSWORD}`);
    console.log(`Getting directory list of /${reqdirlist}`);
    try {
      let response = await sftp.connect({
        host: RACK_IP,
        port: RACK_PORT,
        username: RACK_USER,
        password: RACK_PASSWORD
      });
      let dirlist = await sftp.list(`/${reqdirlist}`);
      console.log("Received directory listing...");
      res.header("Access-Control-Allow-Origin", CORS_ORIGIN); // update to match the domain you will make the request from
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.json({
        reqdir: reqdirlist,
        dirlist,
        err: false,
        errcode: null} );
      //console.log("dirlist: ",dirlist);
  
    } catch(err) {
      // catches errors both in fetch and response.json
      console.log('catched error: ', err);
      console.log("Sending error response...");
      res.header("Access-Control-Allow-Origin", CORS_ORIGIN); // update to match the domain you will make the request from
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.json({
        reqdir: reqdirlist,
        dirlist: null,
        err: true,
        errcode: err.code
      });
    } finally {
      sftp.end()
    }
    next();
  }
  
  
  
  const SFTPrequestFile = async (req,res,next)=>{
    let reqfile = req.params.file;
    let reqext = req.params.ext;
    console.log("Setting up SFTP client...");
    let Client = require('ssh2-sftp-client');
    let sftp = new Client();
    console.log("Starting connection to sftp server...");
    console.log(`logging in with user: ${RACK_USER}, pass: ${RACK_PASSWORD}`);
    console.log(`Getting file ${reqfile}.${reqext}`);
    try {
      let response = await sftp.connect({
        host: RACK_IP,
        port: RACK_PORT,
        username: RACK_USER,
        password: RACK_PASSWORD
      });

      let remotePath = `/tmp/${reqfile}.${reqext}`;
      let localPath = `${LOCAL_IMG_PATH}${reqfile}.${reqext}`
      console.log(`Download from ${remotePath} to ${localPath}`);
      let downloadresult = await sftp.fastGet(remotePath, localPath);
      console.log("DLRES:",downloadresult);
      console.log(`Received file ${reqfile}.${reqext}...`);
      res.header("Access-Control-Allow-Origin", CORS_ORIGIN); // update to match the domain you will make the request from
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      const dlres = {
          reqfile,
          reqext,
          msg: downloadresult,
          localPath, 
          err: false,
          errcode: null
      };
      console.log("Response: ", dlres);
      res.json(dlres);
      //console.log("dirlist: ",dirlist);
  
    } catch(err) {
      // catches errors both in fetch and response.json
      console.log('catched error: ', err);
      console.log("Sending error response...");
      res.header("Access-Control-Allow-Origin", CORS_ORIGIN); // update to match the domain you will make the request from
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.json({
        reqfile: `${reqfile}.${reqext}`,
        msg: null,
        err: true,
        errcode: err.code
      });
      //console.error('error code: ', err.code);
      //console.error('error level: ', err.level);
      //console.error('error obj:', JSON.stringify(err));
    } finally{
      sftp.end();
    }
    next();
  }
  
  const SFTPdownloadDir = async (req,res,next)=>{
    let reqfolder = req.params.directory;
    console.log("Setting up SFTP client...");
    let Client = require('ssh2-sftp-client');
    let sftp = new Client();
    console.log("Starting connection to sftp server...");
    console.log(`logging in with user: ${RACK_USER}, pass: ${RACK_PASSWORD}`);
    console.log(`Getting folder ${reqfolder}`);
    try {
      let response = await sftp.connect({
        host: RACK_IP,
        port: RACK_PORT,
        username: RACK_USER,
        password: RACK_PASSWORD
      });

      let remotePath = `/${reqfolder}`;
      let localPath = `${LOCAL_IMG_PATH}${reqfolder}`
      console.log(`Download from ${remotePath} to ${localPath}`);
      sftp.on('download', info => {
          console.log(`Listener: Download ${info.source}`);
      });
      let downloadresult = await sftp.downloadDir(remotePath, localPath);
      console.log("DLRES:",downloadresult);
      console.log(`Received folder ${reqfolder}...`);
      res.header("Access-Control-Allow-Origin", CORS_ORIGIN); // update to match the domain you will make the request from
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      const dlres = {
          reqfolder,
          msg: downloadresult,
          localPath, 
          err: false,
          errcode: null
      };
      console.log("Response: ", dlres);
      res.json(dlres);
      //console.log("dirlist: ",dirlist);
    } catch(err) {
      // catches errors both in fetch and response.json
      console.log('catched error: ', err);
      console.log("Sending error response...");
      res.header("Access-Control-Allow-Origin", CORS_ORIGIN); // update to match the domain you will make the request from
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.json({
        reqfolder,
        msg: null,
        err: true,
        errcode: err.code
      });
    } finally{
      sftp.end();
    }
    next();
  }

  module.exports = {
    SFTPrequestList,
    SFTPrequestFile,
    SFTPdownloadDir
  };