const puppeteer = require("puppeteer-core"); 
const puppeteer_extra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// register `puppeteer-extra` plugins (only for chromium)
puppeteer_extra.use(StealthPlugin()); // allows to pass all tests on SannySoft, even if not in headfull mode

const executablePaths = {
    'Google Chrome' : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'Brave' : '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    'Firefox' : '/Applications/Firefox.app/Contents/MacOS/firefox',
    'Ghostery' : '/Applications/Ghostery Private Browser.app/Contents/MacOS/Ghostery',
    'DuckDuckGo' : '/Applications/DuckDuckGo.app/Contents/MacOS/DuckDuckGo'
};

const userProfiles = {
    'Google Chrome' : '',
    'Brave' : '/Users/philippe/Library/Application Support/BraveSoftware/Brave-Browser',
    'Firefox' : '/Users/philippe/Library/Application Support/Firefox/Profiles/sh5n5qfy.default',
    'Ghostery' : '',
    'DuckDuckGo' : ''
};

async function createBrowserInstance(browser){
    console.log("Browser: " + browser + ". At path: " + executablePaths[browser]);

    if(browser == 'Google Chrome'){
        // Uses puppeteer_extra (stealth plugin)
        return await puppeteer_extra.launch({ 
            headless: false,
            executablePath: executablePaths[browser],
            args: [ '--start-maximized' ]
            // unsure what that would do:
            //ignoreDefaultArgs: ['--enable-automation'],
            // args: ['--disable-blink-features=AutomationControlled'
            // '--user-data-dir = /Users/philippe/Documents/code/cookie-banners/userDataProfile',
            // --proxy-server = x.x.x.x:xxxx] // this can be used to specify the IP address
        });
    }
    else if(browser == 'Brave'){
        // Uses puppeteer_extra (stealth plugin)
        return await puppeteer_extra.launch({
            headless: false,
            executablePath: executablePaths[browser],
            userDataDir: userProfiles[browser], // Found at : brave://version/ (take parent directory)
            args: [ '--start-maximized' ]
        });
    }
    else if(browser == 'Firefox'){ 
        // Does not use stealth plugin
        return await puppeteer.launch({
            headless: false,
            product: 'firefox',
            executablePath: executablePaths[browser],
            userDataDir: userProfiles[browser], // found at about:profiles
            // still need to make it larger also
            // ** NOTE THAT STILL NEEDS TO ADD CORRECT SETTINGS IN THAT PROFILE
            
            // defaultViewport: null,
            // args: ['--no-sandbox', '--start-maximized'],
            // args: [
            //     '--wait-for-browser' // https://github.com/puppeteer/puppeteer/issues/5958 -- unclear what it does though..
            //     ],
            // ignoreDefaultArgs: ['--enable-automation'],
            // extraPrefsFirefox: {
            //     'marionette': true,
            // }
        });
    }
    else if(browser == 'Ghostery'){ 
        // Does not use stealth plugin
        return await puppeteer.launch({
            headless: false,
            executablePath: executablePaths[browser],
            userDataDir: userProfiles[browser], // found at about:profiles
            // ** NOTE THAT STILL NEEDS TO ADD CORRECT SETTINGS IN THAT PROFILE
        });
    }
    else if(browser == 'DuckDuckGo'){}
}

module.exports = {
    createBrowserInstance
  };