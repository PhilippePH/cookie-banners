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
    'Brave' : '/Users/philippe/Library/Application Support/BraveSoftware/Brave-Browser', // Found at : brave://version/ (take parent directory)
    'Firefox' : '/Users/philippe/Library/Application Support/Firefox/Profiles/sh5n5qfy.default', // found at about:profiles
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
        });
    }
    else if(browser == 'Brave'){
        // Uses puppeteer_extra (stealth plugin)
        return await puppeteer_extra.launch({
            headless: false,
            executablePath: executablePaths[browser],
            userDataDir: userProfiles[browser], 
            /* User Profile Description: The EasyList Cookie found in 
            brave://settings/shields/filters has been enabled. */
            args: [ '--start-maximized' ]
        });
    }
    else if(browser == 'Firefox'){ 
        // Does not use stealth plugin
        // NOTE: Webdriver flag is still set to true.
        return await puppeteer.launch({
            headless: false,
            product: 'firefox',
            executablePath: executablePaths[browser],
            userDataDir: userProfiles[browser], 
            /* User Profile Description: In about:config -->
            "cookiebanners.service.mode" is set to 2
            "dom.webdriver.enabled" is set to false 
            "useAutomationExtension" is set to false
            "enable-automation" is set to false
            These last two are an attempt to avoid the webdriver detection (source: https://stackoverflow.com/questions/57122151/exclude-switches-in-firefox-webdriver-options)*/

            defaultViewport: null, // makes window size take full browser size
            // Browser window isn't maximised currently, but not priority
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