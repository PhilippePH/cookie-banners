import { saveCookies, saveResponses, saveRequests, saveLocalStorage } from './db.js'
import { writeFile } from 'fs'

export async function getScreenshot (page, resultPath, siteName) {
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

export async function getHTML (page, resultPath, siteName) {
  // Downloads the HTML of the website and saves it to a file
  try {
    const HTML_TIMEOUT = 5000
    const htmlContent = await Promise.race([
      await page.content(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout occurred')), HTML_TIMEOUT))
    ])
    const fileName = resultPath + `/htmlFiles/${siteName}.html`
    writeFile(fileName, htmlContent)
  } catch (error) { console.log('Error with saving the HTML of the page to a file') }
}

export async function getResponses (page, browser, websiteUrl, connection, crawlID) {
  try {
    if (page.isClosed()) {
      console.log('page closed, returning.')
      return
    }

    await page.on('response', async (interceptedResponse) => {
      try {
        if (page.isClosed()) {
          console.log('page closed, returning from page.on("response").')
          return
        }

        await interceptedResponse
        await saveResponses(crawlID, browser, websiteUrl, interceptedResponse, connection)
      } catch (error) { console.log('Error adding responses to the database.') }
    })
  } catch (error) { console.log('Error collecting responses.') }
}

export async function getRequests (page) {
  const frames = []
  const requestedURL = []
  try {
    await page.on('request', async (interceptedRequest) => {
      requestedURL.push(interceptedRequest.url())

      if (interceptedRequest.frame() != null) {
        if (interceptedRequest.frame().constructor.name === 'Frame') {
          frames.push(interceptedRequest.frame())
        }
      }
    })
  } catch (error) {
    console.log('Error collecting requests.')
    console.log(error)
  }
  return [frames, requestedURL]
}

export async function getCookies (page, browser, websiteUrl, connection, crawlID) {
  try {
    const topFrame = await page.mainFrame()
    await getFrameCookiesRecursive(topFrame, browser, websiteUrl, connection, crawlID)
  } catch (error) {
    console.log('Error getting top frame. Cookies not saved.')
  }
}

async function cookieFrameEvaluate (frame) {
  const FRAME_TIMEOUT = 5000
  return Promise.race([
    frame.evaluate(() => {
      return window.origin
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout occurred')), FRAME_TIMEOUT))
  ])
}

// Function to recursively iterate through frames and save the cookies
async function getFrameCookiesRecursive (frame, browser, websiteUrl, connection, crawlID) {
  let frameCookies, frameOrigin

  try {
    frameCookies = await frame.page().cookies()
    if (frame) {
      if (!frame.isDetached()) {
        try {
          frameOrigin = await cookieFrameEvaluate(frame)
        } catch (error) {
          console.log('      **** Error in CookieFrameEvaluate')
          throw new Error()
        }
      } else {
        console.log('      **** Cannot get frame origin because of lazy frame in cookies')
        throw new Error()
      }
    } else {
      console.log('    **** Frame is null in cookies')
      throw new Error()
    }
  } catch (error) {
    return
  }

  try {
    await saveCookies(crawlID, browser, websiteUrl, 'cookies', frameOrigin, frameCookies, connection)
  } catch (error) {
    console.log('Error with saving the cookies of the page to the database')
  }

  const childFrames = frame.childFrames()
  for (const childFrame of childFrames) {
    await getFrameCookiesRecursive(childFrame, browser, websiteUrl, connection, crawlID)
  }
}

async function LocalStorageFrameEvaluate (frame) {
  const FRAME_TIMEOUT = 5000
  return Promise.race([
    frame.evaluate(() => {
      // stuck here without timeouts
      const origin = window.origin
      const localStorageData = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        const value = localStorage.getItem(key)
        localStorageData[key] = value
      }
      return [localStorageData, origin]
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout occurred')), FRAME_TIMEOUT))
  ])
}

async function getLocalStorageRecursive (page, browser, websiteUrl, frame, connection, crawlID) {
  let values, localStorage, frameOrigin
  try {
    if (frame) {
      if (!frame.isDetached()) {
        try {
          values = await LocalStorageFrameEvaluate(frame)
        } catch (error) {
          console.log('      **** Error in LocalStorageFrameEvaluate')
          throw new Error()
        }

        localStorage = values[0]
        frameOrigin = values[1]
      } else {
        console.log('      **** Cannot get frame origin because of lazy frame in local storage')
        throw new Error()
      }
    } else {
      console.log('      **** Frame is null in localstorage')
      throw new Error()
    }
  } catch (error) {
    return
  }

  try {
    await saveLocalStorage(crawlID, browser, websiteUrl, 'localStorage', frameOrigin, localStorage, connection)
  } catch (error) {
    console.log('Error with saving the localStorage of the page to the database')
  }

  const childFrames = await frame.childFrames()
  for (const childFrame of childFrames) {
    await getLocalStorageRecursive(page, browser, websiteUrl, childFrame, connection)
  }
}

export async function getLocalStorage (page, browser, websiteUrl, connection) {
  const mainFrame = await page.mainFrame()
  await getLocalStorageRecursive(page, browser, websiteUrl, mainFrame, connection)
}

export async function addRequestToDb (requestData, browser, websiteUrl, connection, crawlID) {
  const framesObjects = requestData[0]
  const requestedURL = requestData[1]

  if (framesObjects.length === 0) { console.log(`${browser}, ${websiteUrl}, NO REQUEST ADDED`) }

  for (let index = 0; index < framesObjects.length; index++) {
    if (!framesObjects[index].isDetached()) {
      let frameOrigin
      try {
        frameOrigin = await cookieFrameEvaluate(framesObjects[index])
        await saveRequests(crawlID, browser, websiteUrl, frameOrigin, requestedURL[index], connection)
      } catch (error) { }
    }
  }
}
