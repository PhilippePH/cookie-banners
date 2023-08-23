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
import { ParallelMain } from '../runtimeSetUp'

const BROWSER_LIST = ['Brave']
const VERSION = 0
const START_NUMBER = 0
const NUM_URLS = 10000
const PATH_TO_CSV = './webCrawler/websiteSelection/shuffled.txt'
const DEVICE = 'macserver'
const CORPUS = []
const PARENTS_THRESHOLD = 20
const CHILDREN_THRESHOLD = 5

ParallelMain(BROWSER_LIST, VERSION, START_NUMBER, NUM_URLS, CORPUS, PARENTS_THRESHOLD, CHILDREN_THRESHOLD, PATH_TO_CSV, DEVICE)
