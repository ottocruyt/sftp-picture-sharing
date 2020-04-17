const tar = require('tar');
const process = require('process');

class CompressingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CompressingError';
  }
}

const uncompress = async (file, srcdir, destdir) => {
  const hrstart = process.hrtime();
  if (!file.endsWith('.tar.gz') && !file.endsWith('.tar')) {
    // check the extension .tar.gz
    console.log(
      'the extension is not .tar.gz nor .tar so uncompressing will not work...'
    );
  }
  const pathToArch = `${srcdir}/${file}`; // relative path to tar.gz from working dir
  const options = {
    file: pathToArch,
    cwd: destdir, // output folder relative to working dir MUST exist
    strict: true,
    onwarn: (code, message, data) => {
      console.log(`uncompress warning: ${code} ${message} ${data}`);
    },
  };
  tar
    .x(options)
    .then(() => {
      const hrend = process.hrtime(hrstart);
      console.log(
        `Finished uncomrpressing ${file}... in %ds %dms`,
        hrend[0],
        hrend[1] / 1000000
      );
    })
    .catch((error) => {
      console.log(
        `Problem uncompressing ${file}... catched in uncompress, rethrowing error`
      );
      throw new CompressingError('Compressing Error: ' + error.message);
    });
};

module.exports = {
  uncompress,
};
