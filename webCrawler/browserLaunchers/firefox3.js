import { ParallelMain } from '../runtimeSetUp.js'

const BROWSER_LIST = ['Firefox']
const VERSION = 3
const START_NUMBER = 9556
const NUM_URLS = 10000
const ADD_TIMEOUTS = false
const PATH_TO_CSV = './webCrawler/websiteSelection/shuffled.txt'
const DEVICE = 'macserver'
const CORPUS = ['agree', 'accept', 'accept all', 'accept cookies', 'consent', 'reject', 'reject all', 'decline', 'cookie preferences',
'manage cookies', 'more information', 'privacy statement', 'cookie policy', 'cookie notice', 'use cookie', 'use cookies', 'uses cookies']
const PARENTS_THRESHOLD = 5
const CHILDREN_THRESHOLD = 15

ParallelMain(BROWSER_LIST, VERSION, START_NUMBER, NUM_URLS, CORPUS, PARENTS_THRESHOLD, CHILDREN_THRESHOLD, PATH_TO_CSV, DEVICE, ADD_TIMEOUTS)
