const { fork } = require('child_process');
const fs = require('fs').promises;

const BROWSER_LIST = ['Google Chrome', 'Brave'];
const VANTAGE_POINTS = ['UK'];
const NUM_URLS = 5;

// CREATING RESULTS FOLDER
async function createResultFolder(browserList, vantagePoint){
  let date = new Date();

  // Saving the data to OneDrive, which doesn't allow some chars (":","/") in filename.
  const options = {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
      hour12: false,
      hourCycle: 'h23'
    };
    const formattedDate = date.toLocaleString('en-GB', options);
    let formattedDateWithoutColons = formattedDate.replace(/:/g, '-');
    formattedDateWithoutColons = formattedDate.replace(/[/:]/g, '-');

  let path = `/Users/philippe/Library/CloudStorage/OneDrive-Personal/cookie-banners-results/${formattedDateWithoutColons}`; 
  await fs.mkdir(path);
  
  for(const location of vantagePoint){
    let newPath1 = path+`/${location}`; 
    await fs.mkdir(newPath1);

    for (const browser of browserList) {
      let newPath2 = newPath1+`/${browser}`; 
      await fs.mkdir(newPath2);

      let screenshotPath = newPath2 + "/screenshots";
      await fs.mkdir(screenshotPath)
    
      let HTMLPath = newPath2 + "/htmlFiles";
      await fs.mkdir(HTMLPath)
    }
  }
  return path;
}

async function createArgumentArray(path, browserList, vantagePoint){
  let argArray = []
  let i = 1;
  for(const location of vantagePoint){
    for (const browser of browserList) {
      let newPath = path + `/${location}/${browser}`;
      argArray.push([newPath, location, browser, NUM_URLS, i]);
      i++;
    }
  }
  return argArray;
}

async function main(browserList, vantagePoint){
  const path = await createResultFolder(browserList, vantagePoint);

  // ARGUMENTS PER PROCESS
  const argumentsArray = await createArgumentArray(path, browserList, vantagePoint);
    
  // Launching child processes
  for (const args of argumentsArray) {
    const child = fork('webCrawler/index.js', args);
  }
}

main(BROWSER_LIST, VANTAGE_POINTS);