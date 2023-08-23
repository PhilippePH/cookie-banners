// import { getSiteNames } from './bannerIdWebsiteSelection.js'
import { determineCookieBannerState } from './bannerID.js'
import { getScreenshot } from './bannerIdMeasurements.js'
import { startBrowserInstance, closeBrowserInstance, createNewPage, closePage } from '../pageAndBrowser.js'

async function visitWebsite (page, websiteUrl, browser) {
  try {
    console.log(`    (${browser}) : Loading new page ${websiteUrl}`)
    await page.goto(websiteUrl, { timeout: 10000, waitUntil: 'load' })
    console.log(`    (${browser}) ${websiteUrl}: Page loaded`)
    return 'Success'
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.log(`**  (${browser}): TimeoutError -> ${websiteUrl}`)
      return 'TimeoutError'
    } else {
      console.log(`**  (${browser}): ${error.name} visiting webpage -> ${websiteUrl} (${error.message})`)
      return 'OtherError'
    }
  }
}

async function takeMeasurements (page, resultPath, siteName, wordCorpus, parentCutoff, childrenCutoff) {
  await getScreenshot(page, resultPath, siteName) // screenshot for top 250
  const bannerFound = await determineCookieBannerState(page, wordCorpus, parentCutoff, childrenCutoff)
}

async function evaluateWebsite (browser, resultPath, websiteUrl, siteName,
  connection = null, wordCorpus, parentCutoff, childrenCutoff) {
    returnCode = await visitWebsite(page, websiteUrl, browser)

    if (returnCode === 'Success') {
      await takeMeasurements(page, resultPath, siteName, connection, wordCorpus, parentCutoff, childrenCutoff)
    }
}
  
async function crawlMain (browser, resultPath, urlList, connection = null,
  test = false, device, wordCorpus, parentCutoff, childrenCutoff) {
  let browserInstance, page
  let urlCounter = 0
  browserInstance = await startBrowserInstance(browser, device)
    
  for (const websiteUrl of urlList) {
    urlCounter++
    console.log(`\n (${browser}): (${urlCounter}) ${websiteUrl}`)

    page = await createNewPage(browserInstance)

    try {
      await Promise.race([
        await evaluateWebsite(browser, resultPath, websiteUrl, siteName,
          connection = null, wordCorpus, parentCutoff, childrenCutoff),
        
        new Promise((_, reject) => setTimeout(() => reject(new Error()), 30000))
      ])
    } catch (error) {
      // Add to timeout counter
      console.log('Website used up all its time allocation. Forced timedout.')
    }
    await closePage(page, browserInstance)
  }
  await closeBrowserInstance(browserInstance)
}

async function CLImain () {
  // Unpacking command line arguments (and removing 'node', 'index.js')
  const args = process.argv.slice(2)

  // Accessing individual arguments
  const path = args[0]
  const browser = args[1]
  const websiteListString = args[2]
  const device = args[3]
  const wordCorpus = args[4]
  const parentCutoff = args[5]
  const childrenCutoff = args[6]

  const websiteList = websiteListString.split(',') // Convert back to an array

  // Crawl
  try {
    await crawlMain(browser, path, websiteList, null, false, device, wordCorpus, parentCutoff, childrenCutoff)
  } catch (error) {
    console.log('Error in the crawl function')
    console.log(error)
  }
}
CLImain()
