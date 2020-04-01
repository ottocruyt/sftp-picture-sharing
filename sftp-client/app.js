// WEB SERVER
const express = require('express');
var cors = require('cors');
// SFTP connection
const RACK_IP = "10.129.208.228";
const RACK_PORT = "22";
const RACK_USER = "root";
const RACK_PASSWORD = "" ;
const CORS_ORIGIN = "*"; //http://localhost:5500

// custom middleware create
const LoggerMiddleware = (req,res,next) =>{
    console.log(`Logged  ${req.url}  ${req.method} -- ${new Date()}`)
    next();
}

const SFTPrequestList = async (req,res,next)=>{
  let reqdir = req.params.directory;
  console.log("Setting up SFTP client...");
  let Client = require('ssh2-sftp-client');
  let sftp = new Client();
  console.log("Starting connection to sftp server...");
  console.log(`Getting directory list of /${reqdir}`);
  try {
    let response = await sftp.connect({
      host: RACK_IP,
      port: RACK_PORT,
      username: RACK_USER,
      password: RACK_PASSWORD
    });
    let dirlist = await sftp.list(`/${reqdir}`);
    console.log("Received directory listing...");
    res.header("Access-Control-Allow-Origin", CORS_ORIGIN); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.json({
      reqdir,
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
      reqdir,
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
  console.log(`Getting file ${reqfile}.${reqext}`);
  try {
    let response = await sftp.connect({
      host: RACK_IP,
      port: RACK_PORT,
      username: RACK_USER,
      password: RACK_PASSWORD
    });
    let remotePath = `/tmp/${reqfile}.${reqext}`;
    let localPath = `C:\\Users\\cruyto\\Desktop\\webserverRack\\nodejsSFTP\\UI\\img\\${reqfile}.${reqext}`
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

const app = express()


// application level middleware
app.use(LoggerMiddleware);

// users route // 
app.get('/sftp/:directory',SFTPrequestList,(req,res)=>{
  console.log("req.params.directory:", req.params.directory);
  res.end();
})

app.get('/sftp/tmp/:file.:ext',SFTPrequestFile,(req,res)=>{
  console.log("req.params.file:", req.params.file);
  console.log("req.params.ext:", req.params.ext);
  res.end();
})



app.listen(3000,(req,res)=>{
    console.log('server running on http://localhost:3000')
})
