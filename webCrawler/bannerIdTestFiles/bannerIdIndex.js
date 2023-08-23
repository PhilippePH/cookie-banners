// // import { getSiteNames } from './bannerIdWebsiteSelection.js'
// import { determineCookieBannerState } from './bannerID.js'
// import { getScreenshot } from './bannerIdMeasurements.js'
// import { startBrowserInstance, closeBrowserInstance, createNewPage, closePage } from '../pageAndBrowser.js'

// async function takeMeasurements (page, resultPath, siteName, wordCorpus, parentCutoff, childrenCutoff) {
//   await getScreenshot(page, resultPath, siteName) // screenshot for top 250
//   await determineCookieBannerState(page, wordCorpus, parentCutoff, childrenCutoff)
// }

// async function CLImain () {
//   // Unpacking command line arguments (and removing 'node', 'index.js')
//   const args = process.argv.slice(2)

//   // Accessing individual arguments
//   const path = args[0]
//   const browser = args[1]
//   const websiteListString = args[2]
//   const device = args[3]
//   const wordCorpus = args[4]
//   const parentCutoff = args[5]
//   const childrenCutoff = args[6]

//   const websiteList = websiteListString.split(',') // Convert back to an array

//   // Crawl
//   try {
//     await crawlMain(browser, path, websiteList, null, false, device, wordCorpus, parentCutoff, childrenCutoff)
//   } catch (error) {
//     console.log('Error in the crawl function')
//     console.log(error)
//   }
// }
// CLImain()
