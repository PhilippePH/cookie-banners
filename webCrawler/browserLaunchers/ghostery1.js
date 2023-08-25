import { ParallelMain } from '../runtimeSetUp.js'

const BROWSER_LIST = ['Ghostery']
// VERSION 0 is the Ghostery branded browser. VERSION 1 is Google Chrome with the Ghostery extension enabled.
const VERSION = 1
const START_NUMBER = 0
const NUM_URLS = 100
const PATH_TO_CSV = './webCrawler/websiteSelection/shuffled.txt'
const DEVICE = 'macserver'
const CORPUS = []
const PARENTS_THRESHOLD = 20
const CHILDREN_THRESHOLD = 5

ParallelMain(BROWSER_LIST, VERSION, START_NUMBER, NUM_URLS, CORPUS, PARENTS_THRESHOLD, CHILDREN_THRESHOLD, PATH_TO_CSV, DEVICE)
