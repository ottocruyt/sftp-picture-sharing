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
const progressBarServer = document.getElementById('progress-bar-server');
const progressBarServerDiv = document.getElementById('progress-bar-server-div');
const imgSpinner = document.getElementById('img-spinner');

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
let totalSize = 0;

async function getDirFromRemote(dir) {
  const evtSource = subscribeToServerProgress();
  try {
    const res = await axios.get(`${BASE_URL}/sftp/list/${dir}`);
    const dirlist = await res.data;

    console.log(`GET: here is the directory list response: `, dirlist);

    //folderHeader.innerText = `Requested Folder: ${dirlist.reqdir}`;

    if (dirlist.err) {
      folderHeader.innerHTML = 'Problem connecting to server...';
      folderHeader.setAttribute(
        'data-original-title',
        `Error message: ${dirlist.errmsg}
          `
      );
      evtSource.close();
    } else {
      totalSize = dirlist.totalSize;
      console.log(`Total size of the directory: `, dirlist.totalSize);
      images = [];
      console.log('Start getting individual files');
      await Promise.all(
        dirlist.dirlist.map(async (file, index) => {
          let res = await axios.get(`${BASE_URL}/sftp/file/${file.name}`);
          let date = new Date(file.modifyTime);
          console.log('push received image');
          images.push({
            name: file.name,
            src: `/img/${res.data.reqfile}.${res.data.reqext}`,
            size: res.data.fileSize,
            date,
          });
          // for calculating received size
          /*
          if (dirlist.dirlist.length !== 0) {
            const sizes = images.reduce(
              (sizes, img) => sizes.concat(img.size),
              []
            );
            const totalReceivedSize = sizes.reduce(
              (total, size) => total + size
            );
          }
          */
        })
      );
      evtSource.close();
      setProgress(1, 'server');
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
      hideProgress('server');
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
  imgSpinner.style.display = 'flex';
  PreLoadImage(currentImg.src, sliderImg, () => {
    imgSpinner.style.display = 'none';
    sliderImg.style.display = 'block';
  });
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

// route defines which progressbar
function setProgress(progress, bar) {
  let { progressBarToUpdate } = getProgressBar(bar);
  roundedProgress = Math.round(progress * 100);
  progressBarToUpdate.setAttribute('aria-valuenow', roundedProgress);
  progressBarToUpdate.setAttribute('style', `width: ${roundedProgress}%`);
  progressBarToUpdate.innerText = `${roundedProgress}%`;
  if (roundedProgress === 100) {
    setTimeout(() => {
      hideProgress(bar);
    }, 1000);
  } else {
    showProgress(bar);
  }
}

function hideProgress(bar) {
  let { progressBarToUpdate, progressBarToUpdateDiv } = getProgressBar(bar);
  progressBarToUpdate.style.display = 'none';
  progressBarToUpdateDiv.style.display = 'none';
}
function showProgress(bar) {
  let { progressBarToUpdate, progressBarToUpdateDiv } = getProgressBar(bar);
  progressBarToUpdate.style.display = 'block';
  progressBarToUpdateDiv.style.display = 'block';
}

function getProgressBar(bar) {
  switch (bar) {
    //case 'client':
    //  progressBarToUpdate = progressBarClient;
    // progressBarToUpdateDiv = progressBarClientDiv;
    //  break;
    case 'server':
      return {
        progressBarToUpdate: progressBarServer,
        progressBarToUpdateDiv: progressBarServerDiv,
      };
    default:
      return;
  }
}

function PreLoadImage(srcURL, element, callback, errorCallback) {
  element.src = '';
  element.style.display = 'none';
  element.onload = function () {
    callback();
    element.onload = function () {};
  };

  element.onerror = function () {
    errorCallback();
  };
  element.src = srcURL;
}

function subscribeToServerProgress() {
  console.log('Adding sse for progress on server side');
  const evtSource = new EventSource(`${BASE_URL}/sftp/progress`);
  evtSource.onmessage = (event) => {
    const arrayOfDone = Object.values(JSON.parse(event.data));
    if (arrayOfDone.length !== 0) {
      // check if already an updated value
      const totalDone = arrayOfDone.reduce((total, done) => total + done);
      if (totalSize !== 0) {
        const percDone = totalDone / totalSize;
        setProgress(percDone, 'server');
      }
    }
    //console.log('Percent done: ', percDone);
  };
  evtSource.onerror = (error) => console.error('EventSource failed:', error);

  return evtSource;
}
