const middleware = require("./middleware/middleware");
require('dotenv').config();
// WEB SERVER
const express = require('express');
const app = express()


// application level middleware
app.use(middleware.logger);

// users route // 
app.get('/sftp/list/:directory',middleware.sftp.SFTPrequestList,(req,res)=>{
  console.log("req.params.directory:", req.params.directory);
  res.end();
})

app.get('/sftp/file/:file.:ext',middleware.sftp.SFTPrequestFile,(req,res)=>{
  console.log("req.params.file:", req.params.file);
  console.log("req.params.ext:", req.params.ext);
  res.end();
})

app.get('/sftp/download/:directory',middleware.sftp.SFTPdownloadDir,(req,res)=>{
  console.log("req.params.directory:", req.params.directory);
  res.end();
})


app.listen(process.env.PORT,(req,res)=>{
    console.log(`server running on http://localhost:${process.env.PORT}`)
})
