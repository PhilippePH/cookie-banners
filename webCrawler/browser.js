const puppeteer = require("puppeteer-core"); 
const puppeteer_extra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const BrowserNameError = require('./customErrors')

// register `puppeteer-extra` plugins (only for chromium)
puppeteer_extra.use(StealthPlugin()); // allows to pass all tests on SannySoft, even if not in headfull mode

const laptopExecutablePaths = {
    'Google Chrome' : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'Brave' : '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    'Firefox' : '/Applications/Firefox.app/Contents/MacOS/firefox',
    'Ghostery' : '/Applications/Ghostery Private Browser.app/Contents/MacOS/Ghostery',
};

const laptopUserProfiles = {
    'Google Chrome' : '/Users/philippe/Library/Application Support/Google/Chrome',
    'Brave' : '/Users/philippe/Library/Application Support/BraveSoftware/Brave-Browser/', // Found at : brave://version/ (take parent directory)
    'Firefox' : '/Users/philippe/Library/Application Support/Firefox/Profiles/sh5n5qfy.default', // found at about:profiles
    'Ghostery' : '/Users/philippe/Library/Application Support/Ghostery Browser/Profiles/j4yasrx6.WebCrawler',
};

const linuxExecutablePaths = {
    'Google Chrome' : '/opt/google/chrome/google-chrome'
}

const linuxUserProfiles = {
    'Google Chrome' : '/homes/pp1722/.config/google-chrome/Default'
}

async function createBrowserInstance(browser, vantagePoint, device = 'linux'){
    let executablePaths = linuxExecutablePaths;
    let userProfiles = linuxUserProfiles;

    if(device == 'laptop'){
        executablePaths = laptopExecutablePaths;
        userProfiles = laptopUserProfiles;
    }

    try{
        if(browser == 'Google Chrome'){
            if(vantagePoint == 'UK'){
                // Uses puppeteer_extra (stealth plugin)
                return await puppeteer_extra.launch({ 
                    headless: false,
                    executablePath: executablePaths[browser],
                    userDataDir: userProfiles[browser],
                    args: [ 
                        '--start-maximized',
                        '--profile-directory=Profile 7',
                        // '--proxy-server=socks5://127.0.0.1:8080',
                    ]
                });
            }
        }
        else if(browser == 'Brave'){
            if(vantagePoint == 'UK'){
                // Uses puppeteer_extra (stealth plugin)
                return await puppeteer_extra.launch({
                    headless: false,
                    executablePath: executablePaths[browser],
                    userDataDir: userProfiles[browser], 
                    /* User Profile Description: The EasyList Cookie found in 
                    brave://settings/shields/filters has been enabled. */
                    args: [ '--start-maximized',
                            '--profile-directory=Profile 1',
                            '--proxy-server=socks5://127.0.0.1:8080',
                    ]
                });
            }
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
            // NOTE: Webdriver flag is still set to true.
            return await puppeteer.launch({
                headless: false,
                product: 'firefox', // Ghostery is built off of firefox, and this helps puppeteer work. 
                executablePath: executablePaths[browser],
                userDataDir: userProfiles[browser], // found at about:profiles
                /* Default settings, but when prompted upon first visit, Ghostery has been activated. */
                defaultViewport: null, // makes window size take full browser size -- doesn't seem to work on ghsostery
            });
        }
        else{
            throw new BrowserNameError("Please ensure the browser name passed is one of: 'Google Chrome', 'Brave', 'Firefox', 'Ghostery'.");
        }
    } catch(error){
        if(error instanceof BrowserNameError){
            console.log(error.name + ": " + error.message);
            throw new Error;
        }
        else{
            console.log("Error launching the BrowserInstance");
            console.log(error);
            throw new Error;
        }
    }
}

module.exports = {
    createBrowserInstance
  };