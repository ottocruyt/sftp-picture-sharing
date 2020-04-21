const parser = require('fast-xml-parser');
const he = require('he');
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

const xmlDatUrl = process.env.PROJECT_XML_PATH;

const xmlParser = async () => {
  let jsonObj;
  let iplist = [];

  const options = {
    attributeNamePrefix: '@_',
    attrNodeName: 'attr', //default is 'false'
    textNodeName: '#text',
    ignoreAttributes: true,
    ignoreNameSpace: false,
    allowBooleanAttributes: false,
    parseNodeValue: true,
    parseAttributeValue: false,
    trimValues: true,
    cdataTagName: '__cdata', //default is 'false'
    cdataPositionChar: '\\c',
    parseTrueNumberOnly: false,
    arrayMode: false, //"strict"
    attrValueProcessor: (val, attrName) =>
      he.decode(val, { isAttributeValue: true }), //default is a=>a
    tagValueProcessor: (val, tagName) => he.decode(val), //default is a=>a
    stopNodes: ['parse-me-as-string'],
  };
  try {
    const xmlData = await readFileAsync(xmlDatUrl, 'utf8');
    jsonObj = parser.parse(xmlData, options, true);

    if (jsonObj.Configuration.EgvList.Egv.length === 0) {
      return {
        error: true,
        code: 'IPLIST_EMPTY',
        message: 'IP List is empty',
      };
    }
    jsonObj.Configuration.EgvList.Egv.forEach((egv) => {
      //console.log('ID: ', egv.ID);
      //console.log('IP: ', egv.IP);
      if (egv.ID !== undefined && egv.IP !== undefined)
        iplist.push({ ID: egv.ID, IP: egv.IP });
    });
    if (iplist.length === 0) {
      return {
        error: true,
        code: 'IPLIST_EMPTY',
        message: 'IP List is empty',
      };
    } else {
      console.log(`Parsed ${iplist.length} vehicle(s) from XML:`);
      console.table(iplist);
      //console.log('jsonObj: ', jsonObj);
      return iplist;
    }
  } catch (error) {
    console.log('Error: ', error);
    return {
      error: true,
      code: 'XML_READ_ERROR',
      message: error.message,
    };
  }
};

module.exports = {
  xmlParser,
};
