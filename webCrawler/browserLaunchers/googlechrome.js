import { ParallelMain } from '../runtimeSetUp.js'

const BROWSER_LIST = ['Google Chrome']
const VERSION = 0
const START_NUMBER = 0
const NUM_URLS = 250
const ADD_TIMEOUTS = false
const PATH_TO_CSV = './webCrawler/websiteSelection/shuffled.txt'
const DEVICE = 'macserver'
const CORPUS = ['cookie', 'cookies', 'agree', 'i agree', 'accept', 'accept all',
'accept cookies', 'i accept','reject', 'reject all', 'decline', 'cookie preferences',
'manage cookies',  'preferences', 'learn more', 'more information',
'privacy policy', 'privacy statement', 'cookie policy', 'cookie notice',
'our partners', 'partners',  'third-party']
const PARENTS_THRESHOLD = 5
const CHILDREN_THRESHOLD = 15

ParallelMain(BROWSER_LIST, VERSION, START_NUMBER, NUM_URLS, CORPUS, PARENTS_THRESHOLD, CHILDREN_THRESHOLD, PATH_TO_CSV, DEVICE, ADD_TIMEOUTS)
