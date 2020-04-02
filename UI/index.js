const BASE_URL = "http://localhost:3000";
document.getElementById("btn-list").addEventListener("click", function(e) {
  e.preventDefault();
  getDirFromRemote("tmp");
});
document.getElementById("btn-file").addEventListener("click", function(e) {
  e.preventDefault();
  const requestedFilename = filename.value;
  getFileFromRemote(requestedFilename);
});
const folderHeader = document.getElementById("header");
const dataDiv = document.getElementById("data");
const lastImage = document.getElementById("lastimage");
const filename = document.getElementById("filename");

async function getDirFromRemote(dir){
    console.log(`getDirFromRemote called with ${dir}`)
    try {
        const res = await axios.get(`${BASE_URL}/sftp/list/${dir}`);
    
        const dirlist = res.data;
    
        console.log(`GET: here is the directory list: `, dirlist);

        
        folderHeader.innerText = `Requested Folder: ${dirlist.reqdir}`;
        if(dirlist.err){
          dataDiv.innerHTML =
          `${dirlist.errcode}
          `;

        } else {
          dataDiv.innerHTML = '';
          dirlist.dirlist.forEach(async file => {
            let res = await axios.get(`${BASE_URL}/sftp/file/${file.name}`);
            dataDiv.innerHTML +=
            `${file.name} <br/>
            <img src="/img/${res.data.reqfile}.${res.data.reqext}"><br/>
            `;
          });
          lastImage.src = "";
        }

        return dirlist;
      } catch (e) {
        console.error(e);
      }
}

async function getFileFromRemote(file){
  console.log(`getFileFromRemote called with ${file}`)
  try {
      const res = await axios.get(`${BASE_URL}/sftp/file/${file}`);
  
      const responseFile = res.data;
  
      console.log(`GET: here is the file info: `, responseFile);

      folderHeader.innerText = `Requested File: ${responseFile.reqfile}.${responseFile.reqext}`;
        if(responseFile.err){
          dataDiv.innerHTML =
          `${responseFile.errcode}
          `;

        } else {
          dataDiv.innerHTML = `${responseFile.msg}`;
          lastImage.src =`/img/${responseFile.reqfile}.${responseFile.reqext}` ;
        }
      return responseFile;

    } catch (e) {
      console.error(e);
    }
}




