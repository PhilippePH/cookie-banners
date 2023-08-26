import { ParallelMain } from '../runtimeSetUp.js'

const BROWSER_LIST = ['Firefox']
const VERSION = 1
const START_NUMBER = 0
const NUM_URLS = 1
const ADD_TIMEOUTS = true
const PATH_TO_CSV = './webCrawler/websiteSelection/shuffled.txt'
const DEVICE = 'macserver'
const CORPUS = []
const PARENTS_THRESHOLD = 5
const CHILDREN_THRESHOLD = 20

ParallelMain(BROWSER_LIST, VERSION, START_NUMBER, NUM_URLS, CORPUS, PARENTS_THRESHOLD, CHILDREN_THRESHOLD, PATH_TO_CSV, DEVICE, ADD_TIMEOUTS)
