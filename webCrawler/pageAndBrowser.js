import puppeteer from 'puppeteer-core'
import puppeteerExtra from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

class BrowserNameError extends Error {
  constructor (message) {
    super(message)
    this.name = 'BrowserNameError'
  }
}

// register `puppeteer-extra` plugins (only for chromium)
puppeteerExtra.use(StealthPlugin()) // allows to pass all tests on SannySoft, even if not in headfull mode

const laptopExecutablePaths = {
  'Google Chrome': '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  Brave: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  Firefox: '/Applications/Firefox.app/Contents/MacOS/firefox',
  Ghostery: '/Applications/Ghostery Private Browser.app/Contents/MacOS/Ghostery'
}

const laptopUserProfiles = {
  'Google Chrome': '/Users/philippe/Library/Application Support/Google/Chrome',
  Brave: '/Users/philippe/Library/Application Support/BraveSoftware/Brave-Browser/', // Found at : brave://version/ (take parent directory)
  Firefox: '/Users/philippe/Library/Application Support/Firefox/Profiles/sh5n5qfy.default', // found at about:profiles
  Ghostery: '/Users/philippe/Library/Application Support/Ghostery Browser/Profiles/j4yasrx6.WebCrawler'
}

const linuxExecutablePaths = {
  'Google Chrome': '/opt/google/chrome/google-chrome',
  Brave: '/opt/brave.com/brave/brave',
  Firefox: '/usr/bin/firefox',
  Ghostery: '/homes/pp1722/Desktop/Ghostery/Ghostery'
}

const linuxUserProfiles = {
  'Google Chrome': '/homes/pp1722/.config/google-chrome/Default',
  Brave: '/homes/pp1722/.config/BraveSoftware/Brave-Browser/Default',
  Firefox: '/homes/pp1722/.mozilla/firefox/bl49t284.webCrawler',
  Ghostery: '/homes/pp1722/.ghostery browser/kdq1f4o2.webCrawler'
}

const macserverExecutablePaths = {
  'Google Chrome': '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  Brave: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  Firefox: '/Applications/Firefox.app/Contents/MacOS/firefox',
  Ghostery: '/Applications/Ghostery Private Browser.app/Contents/MacOS/Ghostery'
}
const macserverUserProfiles = {
  'Google Chrome': '/Users/crawler/Library/Application Support/Google/Chrome/Default',
  Brave: '/Users/crawler/Library/Application Support/BraveSoftware/Brave-Browser/',
  Ghostery: '/Users/crawler/Library/Application Support/Ghostery Browser/Profiles/qjo0uxbs.default-release',
  'Firefox 1': '/Users/crawler/Library/Application Support/Firefox/Profiles/5rv5rl49.default-release',
  'Firefox 2': 'TBD'
}

async function puppeteerLaunchBrowser (browser, device, version) {
  let executablePaths = linuxExecutablePaths
  let userProfiles = linuxUserProfiles

  if (device === 'laptop') {
    executablePaths = laptopExecutablePaths
    userProfiles = laptopUserProfiles
  }

  if (device === 'macserver') {
    executablePaths = macserverExecutablePaths
    userProfiles = macserverUserProfiles
  }

  try {
    if (browser === 'Google Chrome') {
      return await puppeteerExtra.launch({
        headless: false,
        executablePath: executablePaths[browser],
        userDataDir: userProfiles[browser],
        defaultViewport: null,
        args: ['--start-maximised']
      })
    } else if (browser === 'Brave') {
      return await puppeteerExtra.launch({
        headless: false,
        executablePath: executablePaths[browser],
        userDataDir: userProfiles[browser],
        defaultViewport: null,
        args: ['--start-maximized', '--profile-directory=Profile 1']
      })
    } else if (browser === 'Firefox') {
      if (version === 1) {
        return await puppeteer.launch({
          headless: false,
          product: 'firefox',
          executablePath: executablePaths[browser],
          userDataDir: userProfiles['Firefox 1'],
          defaultViewport: null
        })
      } else if (version === 2) {
        return await puppeteer.launch({
          headless: false,
          product: 'firefox',
          executablePath: executablePaths[browser],
          userDataDir: userProfiles['Firefox 2'],
          defaultViewport: null
        })
      }
    } else if (browser === 'Ghostery') {
      return await puppeteer.launch({
        headless: false,
        product: 'firefox',
        executablePath: executablePaths[browser],
        userDataDir: userProfiles[browser],
        defaultViewport: null
      })
    }
  } catch (error) {
    if (error instanceof BrowserNameError) {
      console.log(error.name + ': ' + error.message)
      throw new Error()
    } else {
      console.log('Error launching the BrowserInstance')
      console.log(error)
      throw new Error()
    }
  }
}

export async function createBrowserInstance (browser, device, version) {
  let BI
  try {
    BI = await puppeteerLaunchBrowser(browser, device)
  } catch (error) {
    console.log('Error starting browser ' + browser)
    console.log(error)
    process.exit(1)
  } // Exit if fail to create browser instance
  return BI
}

export async function closeBrowserInstance (browserInstance) {
  try {
    await Promise.race([
      await browserInstance.close(),
      new Promise((_, reject) => setTimeout(() => reject(new Error()), 5000))
    ])
  } catch (error) {
    console.log('Timeout occurred trying to close the browser instance. Exiting program execution')
    process.exit(1)
  }
}

export async function closePage (page, browserInstance) {
  try {
    // Here, the goal is to close all the pages that are opened, apart from the about:blank. This should remove pop-ups, etc. 
    let pages = await browserInstance.pages()
    pages.splice(0, 1) // removing the about:blank from the pages to close
    for (const page of pages) {
      await Promise.race([
        await page.close(),
        new Promise((_, reject) => setTimeout(() => reject(new Error()), 1000))
      ])
    }
  } catch (error) {
    console.log('Timeout occurred trying to close the page. Closing browserInstance.')
    await closeBrowserInstance(browserInstance)
  }
}
