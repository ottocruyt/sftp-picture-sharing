const color = '#ba004e';
const BASE_URL = 'http://localhost:3000'; // replace localhost with the IP of the server running (10.203.214.38)

document.getElementById('btn-list').addEventListener('click', function(e) {
  e.preventDefault();
  getDirFromRemote('tmp');
});
const folderHeader = document.getElementById('header');
const dataDiv = document.getElementById('data');
const lastImage = document.getElementById('lastimage');
const filename = document.getElementById('filename');
let images = [];

async function getDirFromRemote(dir) {
  try {
    const res = await axios.get(`${BASE_URL}/sftp/list/${dir}`);

    const dirlist = await res.data;
    console.log(`GET: here is the directory list: `, dirlist);

    folderHeader.innerText = `Requested Folder: ${dirlist.reqdir}`;

    if (dirlist.err) {
      dataDiv.innerHTML = `${dirlist.errcode}
          `;
    } else {
      dataDiv.innerHTML = '';
      images = [];
      await Promise.all(
        dirlist.dirlist.map(async file => {
          let res = await axios.get(`${BASE_URL}/sftp/file/${file.name}`);
          let date = new Date(file.modifyTime);
          images.push({
            name: file.name,
            src: `/img/${res.data.reqfile}.${res.data.reqext}`,
            date
          });
        })
      );
      lastImage.src = '';
      putImageArrayInHtml();
    }
  } catch (e) {
    console.error(e);
  }
}

async function getFileFromRemote(file) {
  try {
    const res = await axios.get(`${BASE_URL}/sftp/file/${file}`);

    const responseFile = res.data;

    console.log(`GET: here is the file info: `, responseFile);

    folderHeader.innerText = `Requested File: ${responseFile.reqfile}.${responseFile.reqext}`;
    if (responseFile.err) {
      dataDiv.innerHTML = `${responseFile.errcode}
          `;
    } else {
      dataDiv.innerHTML = `${responseFile.msg}`;
      lastImage.src = `/img/${responseFile.reqfile}.${responseFile.reqext}`;
    }
    return responseFile;
  } catch (e) {
    console.error(e);
  }
}

function putImageArrayInHtml() {
  images.sort((a, b) => {
    return b.date - a.date;
  });
  images.forEach(image => {
    dataDiv.innerHTML += `<h2>${image.date.toLocaleString()}  (${
      image.name
    })</h2><br/>
    <img src=${image.src}><br/>
    `;
  });
}
