// import { getSiteNames } from './websiteSelection/websiteSelection.js'
// import { getScreenshot, getHTML } from './crawlMeasurements.js'
import { createBrowserInstance, closeBrowserInstance, closePage } from './pageAndBrowser.js'
import { getResponses, getRequests, getCookies, getLocalStorage, addRequestToDb } from './crawlMeasurements.js'
import { determineCookieBannerState } from './bannerIdTestFiles/bannerID.js'
import { saveSuccessfulWebsites, saveTimedoutWebsites } from './saveCrawlTraces.js'
import { startXvfb, stopXvfb } from './headlessSetUp.js'
import pg from 'pg'

// async function testCrawler (path, browser, device) {
//   path = path + '/test'
//   await fs.mkdir(path)
//   const newPath = path + '/screenshots'
//   await fs.mkdir(newPath)

//   // Tests bot detection + proxy (IP)
//   await crawlMain(browser, path, ['https://bot.sannysoft.com',
//     'https://www.whatismyip.com', 'https://www.showmyip.com', 'https://whatismyipaddress.com'], null)
// }

export async function visitWebsite (page, websiteUrl, browser, resultPath) {
  try {
    console.log(`    (${browser}) : Loading new page ${websiteUrl}`)
    await page.goto(websiteUrl, { timeout: 10000, waitUntil: 'load' })
    console.log(`    (${browser}) ${websiteUrl}: Page loaded`)
    return 'Success'
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.log(`**  (${browser}): TimeoutError -> ${websiteUrl}`)
      await saveTimedoutWebsites(websiteUrl, resultPath, browser)
      return 'TimeoutError'
    } else {
      console.log(`**  (${browser}): ${error.name} visiting webpage -> ${websiteUrl} (${error.message})`)
      return 'OtherError'
    }
  }
}

async function takeMeasurements (page, browser, websiteUrl, connection, requestData, wordCorpus, parentCutoff, childrenCutoff, crawlID) {
  console.log(`   (${browser}) ${websiteUrl}: Getting Cookies`)
  await getCookies(page, browser, websiteUrl, connection, crawlID)

  console.log(`   (${browser}) ${websiteUrl}: Getting Localstorage`)
  await getLocalStorage(page, browser, websiteUrl, connection, crawlID)

  console.log(`   (${browser}) ${websiteUrl}: Checking Cookie Banner`)
  await determineCookieBannerState(page, wordCorpus, parentCutoff, childrenCutoff, crawlID)

  console.log(`   (${browser}) ${websiteUrl}: Adding requests to DB`)
  await addRequestToDb(requestData, browser, websiteUrl, connection, crawlID)
}

async function evaluateWebsite (page, browser, websiteUrl, connection, wordCorpus, parentCutoff, childrenCutoff, resultPath, crawlID) {
  let successBool = true
  let requestData

  try {
    console.log(`   (${browser}) ${websiteUrl}: Getting Requests and Reponses`)
    requestData = await getRequests(page)
    await getResponses(page, browser, websiteUrl, connection)
  } catch (error) {
    console.log(`(${browser}) ${websiteUrl}: An error happened when getting requests or responses. ${error.name} ${error.message}`)
  }

  const returnCode = await visitWebsite(page, websiteUrl, browser, resultPath)

  if (returnCode === 'Success') {
    await takeMeasurements(page, browser, websiteUrl, connection, requestData, wordCorpus, parentCutoff, childrenCutoff, crawlID)
  } else {
    successBool = false
  }

  return successBool
}

export async function crawlMain (browser, version, resultPath, urlList, connection, device, wordCorpus, parentCutoff, childrenCutoff) {
  let browserInstance, page
  let urlCounter = 0

  // CrawlID as a DATETIME (mysql) or TIMESTAMP (postgres)
  let crawlID = new Date(new Date().toString().split('GMT') + ' UTC').toISOString().split('.')[0]
  crawlID = crawlID.replace(/T/g, ' ')

  // NEED TO ADAPT THIS TO RESACE browserinstance if re-created elsewhere
  browserInstance = await createBrowserInstance(browser, device, version)

  for (const websiteUrl of urlList) {
    urlCounter++
    console.log(`\n (${browser}): (${urlCounter}) ${websiteUrl}`)

    // CREATING A NEW PAGE
    // 1. Test that browser instance is still active
    try {
      page = await browserInstance.newPage()
    } catch (error) {
      console.log('Error accessing the browser instance.')

      // 1.1 Trying to close browser instance
      try {
        await Promise.race([
          await browserInstance.close(),
          new Promise((_, reject) => setTimeout(() => reject(new Error()), 2000))
        ])
      } catch (error) {} // Ignore the timeout, or the error saying the browserInstance was already closed.

      // 1.2 Now trying to launch a new browser instance
      try {
        browserInstance = await createBrowserInstance(browser, device, version)
        page = await browserInstance.newPage()
      } catch (error) {
        process.exit(1)
      }
    }

    // const siteName = await getSiteNames(websiteUrl)

    try {
      const [evaluationResult] = await Promise.race([
        await evaluateWebsite(page, browser, websiteUrl, connection, wordCorpus, parentCutoff, childrenCutoff, resultPath, crawlID),
        new Promise((_, reject) => setTimeout(() => reject(new Error()), 30000))
      ])

      if (evaluationResult) {
        console.log(`   (${browser}) ${websiteUrl}: Adding to successful website`)
        await saveSuccessfulWebsites(websiteUrl, resultPath, browser)
      }
    } catch (error) {
      // Add to timeout counter
      console.log('Website used up all its time allocation. Forced timedout.')
      await saveTimedoutWebsites(websiteUrl, resultPath, browser)
    }

    await closePage(page, browserInstance)
  }
  await closeBrowserInstance(browserInstance)
}

export async function callableMain (args) {
  // Accessing individual arguments
  const path = args[0]
  const browser = args[1]
  const version = args[2]
  const websiteList = args[3]
  const device = args[4]
  const wordCorpus = args[5]
  const parentCutoff = args[6]
  const childrenCutoff = args[7]

  // Linux SetUp
  let XVFB = null
  if (device === 'linux') {
    XVFB = await startXvfb()
    console.log('XVFB connected')
  }

  // Test the parameters
  // try {
  //   await testCrawler(path, browser, vantagePoint, processID, device)
  // } catch (error) {
  //   console.log('Error in the testCrawler.')
  //   console.log(error)
  // }

  // Set up Database connection
  const connection = new pg.Client({
    user: 'postgres',
    password: 'I@mastrongpsswd',
    host: '127.0.0.1',
    database: 'crawlingData',
    port: '5432'
  })

  await connection.connect()
  console.log('Database connection established')

  // Crawl
  try {
    await crawlMain(browser, version, path, websiteList, connection, device, wordCorpus, parentCutoff, childrenCutoff)
  } catch (error) {
    console.log('Error in the crawl function')
    console.log(error)
  }

  // Close database connection
  await connection.end()
  console.log('Database connection disconnected')

  // Close XVFB
  if (XVFB) {
    await stopXvfb(XVFB)
    console.log('XVFB disconnected')
  }
}
