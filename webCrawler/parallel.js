/*  Note to self:
ssh -f -N -D 8080 -M -S /tmp/sshtunnelProxy -o ExitOnForwardFailure=yes philippe@hamedhome.ddns.net && \
echo "ssh tunnel started successfully" || \
echo "ssh tunnel failed to start"

ssh -S /tmp/sshtunnelProxy -O exit philippe@hamedhome.ddns.net -p22

export PATH=/vol/bitbucket/pp1722/nodeProject/node_modules/.bin:$PATH

netstat -lntu
*/

import {fork} from 'child_process';
import * as fs from 'node:fs/promises';
import {getFirstURLs} from './websiteSelection.js';

const BROWSER_LIST = ['Firefox'];
const VANTAGE_POINTS = ['UK'];
const NUM_URLS = 1;
const PATH_TO_CSV = "./webCrawler/top-1m.csv";
const DEVICE = 'laptop';

// CREATING RESULTS FOLDER
async function createResultFolder(browserList, vantagePoint, device){
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
  
  let path = `/homes/pp1722/Documents/cookie-banners/results/${formattedDateWithoutColons}`;
  if(device == 'laptop'){
    path = `/Users/philippe/Library/CloudStorage/OneDrive-Personal/cookie-banners-results/${formattedDateWithoutColons}`; 
  }

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

async function createArgumentArray(path, browserList, vantagePoint, device){
  let argArray = []
  let i = 1;
  const websiteList = await getFirstURLs(NUM_URLS, PATH_TO_CSV);

  for(const location of vantagePoint){
    for (const browser of browserList) {
      let newPath = path + `/${location}/${browser}`;
      argArray.push([newPath, location, browser, websiteList, i, device]);
      i++;
    }
  }
  return argArray;
}

async function main(browserList, vantagePoint, device){
  const path = await createResultFolder(browserList, vantagePoint, device);

  // ARGUMENTS PER PROCESS
  const argumentsArray = await createArgumentArray(path, browserList, vantagePoint, device);
    
  // Launching child processes
  for (const args of argumentsArray) {
    const child = fork('webCrawler/index.js', args);
  }
}

main(BROWSER_LIST, VANTAGE_POINTS, DEVICE);
