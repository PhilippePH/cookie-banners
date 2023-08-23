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
  Firefox: '/Users/crawler/Library/Application Support/Firefox/Profiles/5rv5rl49.default-release',
  Ghostery: '/Users/crawler/Library/Application Support/Ghostery Browser/Profiles/qjo0uxbs.default-release'
}

export async function createBrowserInstance (browser, vantagePoint, device = 'linux') {
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
      return await puppeteer.launch({
        headless: false,
        product: 'firefox',
        executablePath: executablePaths[browser],
        userDataDir: userProfiles[browser],
        defaultViewport: null
      })
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