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
import { fork } from 'child_process'
import { createResultFolder, createArgumentArray } from '../runtimeSetUp'

const BROWSER_LIST = ['Google Chrome']
const START_NUMBER = 0
const NUM_URLS = 25
const CORPUS = ['cookie', 'cookies', 'agree', 'accept', 'reject', 'decline', 'preferences', 'policy', 'privacy', 'notice', 'partners', 'third-party']
const PARENTS_THRESHOLD = 5
const CHILDREN_THRESHOLD = 20
const PATH_TO_CSV = './shuffled.txt'
const DEVICE = 'laptop'

async function ParallelMain (browserList, startNumber, numberUrls, corpus, parentsThreshold, childrenThreshold, pathToCsv, device) {
  const path = await createResultFolder(browserList, device)

  // ARGUMENTS PER PROCESS
  const argumentsArray = await createArgumentArray(browserList, startNumber, numberUrls, corpus, parentsThreshold, childrenThreshold, pathToCsv, device)

  // Launching child processes
  for (const args of argumentsArray) {
    fork('./bannerIdIndex.js', args)
  }
}

ParallelMain(BROWSER_LIST, START_NUMBER, NUM_URLS, CORPUS, PARENTS_THRESHOLD, CHILDREN_THRESHOLD, PATH_TO_CSV, DEVICE)
