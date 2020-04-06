const color = '#ba004e';
const BASE_URL = 'http://localhost:3000'; // replace localhost with the IP of the server running (10.203.214.38)
const RACK_FOLDER = 'tmp'; // folder on the rack where to get the files

window.onload = function () {
  getDirFromRemote(RACK_FOLDER);
};
const folderHeader = document.getElementById('header');
const nextBtn = document.getElementById('next');
const prevBtn = document.getElementById('prev');
const sliderImg = document.getElementById('slider_img');
const imgHeader = document.getElementById('img-header');
const navLinkLatest = document.getElementById('nav-link-latest');
const saveSettings = document.getElementById('btn-save-settings');
const progressBar = document.getElementById('progress-bar');
const progressBarDiv = document.getElementById('progress-bar-div');

nextBtn.addEventListener('click', function (e) {
  e.preventDefault();
  goToNextImage();
});
prevBtn.addEventListener('click', function (e) {
  e.preventDefault();
  goToPrevImage();
});
navLinkLatest.addEventListener('click', function (e) {
  e.preventDefault();
  getDirFromRemote(RACK_FOLDER);
});
saveSettings.addEventListener('click', function (e) {
  e.preventDefault();
  console.log('saving settings');
  // should post settings... locally?
});

let images = [];
let currentImg = {};
let currentImgIndex = 0;

async function getDirFromRemote(dir) {
  setProgress(0);
  try {
    const res = await axios.get(`${BASE_URL}/sftp/list/${dir}`);

    const dirlist = await res.data;
    console.log(`GET: here is the directory list: `, dirlist);

    //folderHeader.innerText = `Requested Folder: ${dirlist.reqdir}`;

    if (dirlist.err) {
      folderHeader.innerHTML = `${dirlist.errcode}
          `;
    } else {
      //dataDiv.innerHTML = '';
      images = [];
      await Promise.all(
        dirlist.dirlist.map(async (file, index) => {
          let res = await axios.get(`${BASE_URL}/sftp/file/${file.name}`);
          let date = new Date(file.modifyTime);
          images.push({
            name: file.name,
            src: `/img/${res.data.reqfile}.${res.data.reqext}`,
            date,
          });
          if (dirlist.dirlist.length !== 0) {
            setProgress(images.length / dirlist.dirlist.length);
          }
        })
      );
      putImageArrayInHtml();
    }
  } catch (e) {
    console.error(e);
  }
}

// not used anymore
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
  currentImg = images[0];
  currentImgIndex = images.indexOf(currentImg);
  //setProgress(1); // ensure the progress is 100%
  showCurrentImage();
}

function showCurrentImage() {
  imgHeader.innerHTML = `${currentImg.date.toLocaleString()} (${
    currentImg.name
  })`;
  sliderImg.src = currentImg.src;
  disableNavigationButtonIfNeeded();
}

function goToNextImage() {
  if (currentImgIndex + 1 < images.length) {
    currentImg = images[currentImgIndex + 1];
    currentImgIndex++;
    showCurrentImage();
  }
}

function goToPrevImage() {
  if (currentImgIndex - 1 >= 0) {
    currentImg = images[currentImgIndex - 1];
    currentImgIndex--; // index -1
    showCurrentImage();
  }
}

function disableNavigationButtonIfNeeded() {
  if (currentImgIndex + 1 === images.length) {
    nextBtn.disabled = true;
    nextBtn.classList.add('disabled');
  } else {
    nextBtn.disabled = false;
    nextBtn.classList.remove('disabled');
  }
  if (currentImgIndex === 0) {
    prevBtn.disabled = true;
    prevBtn.classList.add('disabled');
  } else {
    prevBtn.disabled = false;
    prevBtn.classList.remove('disabled');
  }
}

function setProgress(progress) {
  console.log('Setting progress to: ', progress);
  progressBar.setAttribute('aria-valuenow', progress * 100);
  progressBar.setAttribute('style', `width: ${progress * 100}%`);
  progressBar.innerText = `${progress * 100}%`;
  if (progress === 1) {
    progressBar.style.display = 'none';
    progressBarDiv.style.display = 'none';
  } else {
    progressBar.style.display = 'block';
    progressBarDiv.style.display = 'block';
  }
}
