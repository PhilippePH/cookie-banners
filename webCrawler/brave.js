/*  Note to self:
ssh -f -N -D 8080 -M -S /tmp/sshtunnelProxy -o ExitOnForwardFailure=yes philippe@hamedhome.ddns.net && \
echo "ssh tunnel started successfully" || \
echo "ssh tunnel failed to start"

ssh -S /tmp/sshtunnelProxy -O exit philippe@hamedhome.ddns.net -p22

export PATH=/vol/bitbucket/pp1722/nodeProject/node_modules/.bin:$PATH

node webCrawler/parallel.js > webCrawler/crawlLog.log 2>&1

scp pp1722@shell1.doc.ic.ac.uk:"/homes/pp1722/Documents/cookie-banners/results/11-08-2023,\ 22-24-04\ BST/UK/Google\ Chrome/test/screenshots/sannysoft.jpeg" /Users/philippe/Downloads
sannysoft.jpeg

/vol/linux/bin/nfiles

netstat -lntu
*/
// import { fork } from 'child_process'
import * as fs from 'node:fs/promises'
import { getURLs } from './WebsiteSelection.js'
import { callableMain } from './index.js'

const BROWSER_LIST = ['Brave']
const VANTAGE_POINTS = ['UK']
const START_NUMBER = 0
const NUM_URLS = 10000
const PATH_TO_CSV = './webCrawler/websiteSelection/shuffled.txt'
const DEVICE = 'macserver'

// CREATING RESULTS FOLDER
async function createResultFolder (browserList, vantagePoint, device) {
  const date = new Date()

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
  }
  const formattedDate = date.toLocaleString('en-GB', options)
  let formattedDateWithoutColons = formattedDate.replace(/:/g, '-')
  formattedDateWithoutColons = formattedDate.replace(/[/:]/g, '-')

  let path = `/homes/pp1722/Documents/cookie-banners/results/${formattedDateWithoutColons}`
  if (device === 'laptop') {
    path = `/Users/philippe/Library/CloudStorage/OneDrive-Personal/cookie-banners-results/${formattedDateWithoutColons}`
  }
  if (device === 'macserver') {
    path = `/Users/crawler/OneDrive/cookie-banners-results/${formattedDateWithoutColons}`
  }
  await fs.mkdir(path)

  for (const location of vantagePoint) {
    const newPath1 = path + `/${location}`
    await fs.mkdir(newPath1)

    for (const browser of browserList) {
      const newPath2 = newPath1 + `/${browser}`
      await fs.mkdir(newPath2)

      const screenshotPath = newPath2 + '/screenshots'
      await fs.mkdir(screenshotPath)

      const HTMLPath = newPath2 + '/htmlFiles'
      await fs.mkdir(HTMLPath)
    }
  }
  return path
}

async function createArgumentArray (path, browserList, vantagePoint, device) {
  const argArray = []
  let i = 1

  for (const location of vantagePoint) {
    for (const browser of browserList) {
      const websiteList = await getURLs(NUM_URLS, START_NUMBER, browser, PATH_TO_CSV)
      const newPath = path + `/${location}/${browser}`
      argArray.push([newPath, location, browser, websiteList, i, device])
      i++
    }
  }
  return argArray
}

async function ParallelMain (browserList, vantagePoint, device) {
  const path = await createResultFolder(browserList, vantagePoint, device)

  // ARGUMENTS PER PROCESS
  const argumentsArray = await createArgumentArray(path, browserList, vantagePoint, device)

  // Launching child processes
  // for (const args of argumentsArray) {
  //   fork('./bannerIdIndex.js', args)
  // }

  callableMain(argumentsArray[0])
}
ParallelMain(BROWSER_LIST, VANTAGE_POINTS, DEVICE)
