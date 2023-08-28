import { ParallelMain } from '../runtimeSetUp.js'

const BROWSER_LIST = ['Google Chrome']
const VERSION = 0
const START_NUMBER = 0
const NUM_URLS = 250
const ADD_TIMEOUTS = false
const PATH_TO_CSV = '/Users/crawler/Documents/cookie-banners/webCrawler/bannerIdTestFiles/falsenegatives.txt'
const DEVICE = 'macserver'
const CORPUS = ['agree', 'accept', 'accept all', 'accept cookies', 'consent', 
                'customize', 'reject', 'reject all', 'decline', 
                'cookie preferences', 'manage cookies', 'manage cookie',
                'learn more', 'more information', 'privacy policy', 'privacy statement', 'cookie policy', 'cookie notice', 
                'use cookie', 'use cookies', 'uses cookies']
const PARENTS_THRESHOLD = 5
const CHILDREN_THRESHOLD = 15

ParallelMain(BROWSER_LIST, VERSION, START_NUMBER, NUM_URLS, CORPUS, PARENTS_THRESHOLD, CHILDREN_THRESHOLD, PATH_TO_CSV, DEVICE, ADD_TIMEOUTS)
