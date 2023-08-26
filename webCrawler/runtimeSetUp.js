import * as fs from 'node:fs/promises'
import { callableMain } from './index.js'
import { getURLs } from './websiteSelection/websiteSelection.js'

// CREATING RESULTS FOLDER
export async function createResultFolder (browserList, device) {
  const date = new Date()

  // Saving the data to OneDrive, which doesn't allow some chars (":","/") in filename.
  const options = {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
    hour12: false,
    hourCycle: 'h23'
  }
  const formattedDate = date.toLocaleString('en-GB', options)
  let formattedDateWithoutColons = formattedDate.replace(/:/g, '-')
  formattedDateWithoutColons = formattedDate.replace(/[/:]/g, '-')

  let path = `/homes/pp1722/Documents/cookie-banners/results/${formattedDateWithoutColons}`
  if (device === 'laptop') {
    path = `/Users/philippe/Library/CloudStorage/OneDrive-Personal/cookie-banners-results/${formattedDateWithoutColons}`
  }
  if (device === 'macserver') {
    path = `/Users/crawler/OneDrive/cookie-banners-results/${formattedDateWithoutColons}`
  }
  await fs.mkdir(path)

  for (const browser of browserList) {
    const newPath2 = path + `/${browser}`
    await fs.mkdir(newPath2)

    const screenshotPath = newPath2 + '/screenshots'
    await fs.mkdir(screenshotPath)

    const HTMLPath = newPath2 + '/htmlFiles'
    await fs.mkdir(HTMLPath)
  }

  return path
}

export async function createArgumentArray (browserList, version, startNumber, numberUrls, corpus, parentsThreshold, childrenThreshold, pathToCsv, device, resultsPath) {
  const argArray = []

  for (const browser of browserList) {
    const websiteList = await getURLs(numberUrls, startNumber, browser, pathToCsv)
    argArray.push([resultsPath, browser, version, websiteList, device, corpus, parentsThreshold, childrenThreshold])
  }
  return argArray
}

export async function ParallelMain (browserList, version, startNumber, numberUrls, corpus, parentsThreshold, childrenThreshold, pathToCsv, device, addTimeouts = true) {
  const resultsPath = await createResultFolder(browserList, device, addTimeouts)

  // ARGUMENTS PER PROCESS
  const argumentsArray = await createArgumentArray(browserList, version, startNumber, numberUrls, corpus, parentsThreshold, childrenThreshold, pathToCsv, device, resultsPath)

  callableMain(argumentsArray[0])
}
