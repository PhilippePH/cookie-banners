import { getSiteNames } from './bannerIdWebsiteSelection.js'
import { createBrowserInstance } from './bannerIdBrowser.js'
import { determineCookieBannerState } from './bannerID.js'
import { exit } from 'process'

async function getScreenshot (page, resultPath, siteName) {
  // Screenshot
  try {
    await page.screenshot({
      path: resultPath + `/screenshots/${siteName}.jpeg`,
      type: 'jpeg',
      quality: 25
    })
  } catch (error) {
    console.log('Error with the screenshot')
    console.log(error)
  }
}

async function startBrowserInstance (browser, vantagePoint, device) {
  let BI
  try {
    BI = await createBrowserInstance(browser, vantagePoint, device)
  } catch (error) {
    console.log('Error starting browser ' + browser)
    console.log(error)
    exit()
  } // Exit if fail to create browser instance
  return BI
}

async function crawl (browser, resultPath, urlList, vantagePoint,
  connection = null, processID = 1, test = false, device = 'linux',
  wordCorpus, parentCutoff, childrenCutoff) {
  const bannerFoundArr = []
  let browserInstance, page
  browserInstance = await startBrowserInstance(browser, vantagePoint, device)

  try { // Closes BrowserInstance in case of an unhandled error
    let urlCounter = 0

    for (const websiteUrl of urlList) {
      urlCounter++

      // Test that browser instance is still active
      try {
        page = await browserInstance.newPage()
      } catch (error) {
        console.log(error)
        console.log('Browser instance was closed somehow. Starting a new one.')
        browserInstance = await startBrowserInstance(browser, vantagePoint, device)
        page = await browserInstance.newPage()
      }

      console.log(`\n${processID} (${browser}): (${urlCounter}) ${websiteUrl}`)
      const siteName = await getSiteNames(websiteUrl)

      page.on('console', msg => console.log('PAGE LOG:', msg.text()))

      try {
        console.log(`   ${processID} (${browser}) : Loading new page ${websiteUrl}`)
        await page.goto(websiteUrl, { timeout: 10000, waitUntil: 'load' })
        console.log(`   ${processID} (${browser}) ${websiteUrl}: Page loaded`)
      } catch (error) {
        // if (error instanceof TimeoutError) { // for some reason, this stopped working at one point.. I tried fixing the imports, but can't find the issue
        if (error.name === 'TimeoutError') {
          console.log(`** ${processID} (${browser}): TimeoutError -> ${websiteUrl}`)
        } else {
          console.log(`** ${processID} (${browser}): ${error.name} visiting webpage -> ${websiteUrl} (${error.message})`)
        }
        console.log(`** ${processID} (${browser}) closing page.`)
        try {
          await page.close()
          // also tried restarting the browser, but that didn't fix the issue etiher....
        } catch (error) { console.log(` ** ${processID} (${browser}): Error trying to close the page after error with webpage ${websiteUrl}`) }
        console.log(`** ${processID} (${browser}) Webpage closed.`)
        continue
      }

      await getScreenshot(page, resultPath, siteName) // screenshot for top 250
      const bannerFound = await determineCookieBannerState(page, wordCorpus, parentCutoff, childrenCutoff)
      bannerFoundArr.push({ siteName, bannerFound })

      console.log(`   ${processID} (${browser}) ${websiteUrl}: Page closed`)
      await page.close()
    }
  } catch (error) { // Here to ensure the BrowserInstance closes in case of an error
    console.log(error)
    await page.close()
    await browserInstance.close()
    console.log(`** ${processID} (${browser}): BrowserInstance closed in error handling.`)
    return
  }
  await browserInstance.close()
  console.log(`   ${processID} (${browser}) instance closed.`)

  console.log(bannerFoundArr)
}

async function CLImain () {
  // Unpacking command line arguments (and removing 'node', 'index.js')
  const args = process.argv.slice(2)

  // Accessing individual arguments
  const path = args[0]
  const vantagePoint = args[1]
  const browser = args[2]
  const websiteListString = args[3]
  const processID = args[4]
  const device = args[5]
  const wordCorpus = args[6]
  const parentCutoff = args[7]
  const childrenCutoff = args[8]

  const websiteList = websiteListString.split(',') // Convert back to an array

  // Crawl
  try {
    await crawl(browser, path, websiteList, vantagePoint, null, processID, false, device, wordCorpus, parentCutoff, childrenCutoff)
  } catch (error) {
    console.log('Error in the crawl function')
    console.log(error)
  }
}
CLImain()
