import puppeteer from 'puppeteer-core';
import puppeteer_extra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import child_process from "child_process";
import webExt from 'web-ext';
// import getPort from 'get-port';
// import dns from 'node:dns'

class BrowserNameError extends Error {
    constructor(message) {
      super(message);
      this.name = 'BrowserNameError';
    }
  }

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
    'Google Chrome' : '/opt/google/chrome/google-chrome',
    'Brave' : '/opt/brave.com/brave/brave',
    'Firefox' : '/usr/bin/firefox',
    'Ghostery' : '/homes/pp1722/Desktop/Ghostery/Ghostery'
}

const linuxUserProfiles = {
    'Google Chrome' : '/homes/pp1722/.config/google-chrome/Default',
    'Brave' : '/homes/pp1722/.config/BraveSoftware/Brave-Browser/Default',
    'Firefox' : '/homes/pp1722/.mozilla/firefox/bl49t284.webCrawler',
    'Ghostery': '/homes/pp1722/.ghostery browser/kdq1f4o2.webCrawler'
}

async function openFileUpload(page){
    const FRAME_TIMEOUT = 10000;
    return Promise.race([
        page.evaluate(() => {
            document.getElementsByClassName('undefined default-button qa-temporary-extension-install-buttons')[0].click();
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout occurred')), FRAME_TIMEOUT))
    ]);
}


export async function createBrowserInstance(browser, vantagePoint, device = 'linux'){
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
                        '--proxy-server=socks5://127.0.0.1:8080',
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

        // Source for firefox launch code: https://github.com/puppeteer/puppeteer/issues/5532
        else if(browser == 'Firefox'){ 
            if(vantagePoint == 'UK'){
                try{
                    let ffxBrowser = await puppeteer.launch({
                        headless: false,
                        product: 'firefox',
                        executablePath: executablePaths[browser],
                        userDataDir: userProfiles[browser], 
                    });

                    let page = await ffxBrowser.newPage();
                    console.log("hello");

                    // await page.goto('https://chercher.tech/practice/popups');

                    // const [fileChooser] = await Promise.all([
                    //         page.waitForFileChooser(),
                    //         page.click('[name="upload"]')
                    //     ])
                    //     console.log("waiting");
                    //     await fileChooser.accept(['/homes/pp1722/Documents/cookie-banners/webdriverFirefoxExtension']);

                        //  page.goto('about:debugging#/runtime/this-firefox');
                        await page.goto('https://www.google.com', {waitUntil:'load'}) 
                        // child_process.execSync('sleep 10');
                        let x= await page.evaluate( () => {
                            return window.origin;
                            // document.getElementsByClassName('undefined default-button qa-temporary-extension-install-buttons')[0].click();
                        });
                        console.log(x)


                    // console.log("hi");

                    // // const uploadBttn = (page.waitForSelector('undefined default-button qa-temporary-extension-install-buttons')).click()
                    // // uploadBttn.click();
                    
                    // child_process.execSync('sleep 2');

                    // // let x = page.evaluate(()=>{
                    // //     document.getElementsByClassName('undefined default-button qa-temporary-extension-install-buttons')[0].click();
                    // //     return;
                    // // })

                    // // try{
                    // //     await openFileUpload(page);
                    // // } catch(error){ console.log("timeout in helper");}

                    // child_process.execSync('sleep 2');

                    // // page.click('xpath/'+'/html/body/div/div/main/article/section[1]/div/section/div/button');





                    console.log("heuy")

                    const [fileChooser] = await Promise.all([
                        page.waitForFileChooser(),
                        // (page.waitForSelector('undefined default-button qa-temporary-extension-install-buttons')).click()
                        // openFileUpload(page)
                        // page.evaluate(()=>{document.getElementsByClassName('undefined default-button qa-temporary-extension-install-button')[0].click()} )
                        // page.click('[class="undefined default-button qa-temporary-extension-install-button"]')
                        // page.click('xpath/'+'/html/body/div/div/main/article/section[1]/div/section/div/button')
                    ])
                    console.log("waiting");
                    await fileChooser.accept(['/homes/pp1722/Documents/cookie-banners/webdriverFirefoxExtension']);
                    
                    return ffxBrowser;
            }
            catch(error){ console.log(error); return error;}
                // return await (async () => {
                //     await webExt.cmd.run({
                //         firefox: executablePaths[browser],
                //         sourceDir:'/homes/pp1722/Documents/cookie-banners/webdriverFirefoxExtension',
                //         args: [ '--remote-debugging-port', '--verbose']
                //     }, { shouldExitProgram: false });
                                        
                //     // Needed because `webExt.cmd.run` returns before the DevTools agent starts running.
                //     // Alternative would be to wrap the call to pptr.connect() with some custom retry logic
                //     child_process.execSync('sleep 2');
                    
                //     return await puppeteer.connect({
                //         browserURL: `http://127.0.0.1:9222`, // error: SocketError: other side closed
                //     });
                // })();
            }
        }



        // else if(browser == 'Firefox'){ 
        //     return await puppeteer.connect({
        //         browserWSEndpoint: `ws://127.0.0.1:9222/devtools/browser/a637ff4f-5517-46b8-94c8-a6c159dad35f`
        //     });
        //     // Does not use stealth plugin
        //     // NOTE: Webdriver flag is still set to true.
        //     // return await puppeteer.launch({
        //     //     headless: false,
        //     //     product: 'firefox', // Ghostery is built off of firefox, and this helps puppeteer work. 
        //     //     executablePath: executablePaths[browser],
        //     //     userDataDir: userProfiles[browser], // found at about:profiles
        //     //     /* Default settings, but when prompted upon first visit, Ghostery has been activated. */
        //     //     defaultViewport: null, // makes window size take full browser size -- doesn't seem to work on ghsostery

        //     //     //the proxy settings are set to 127.0.0.1:8080
        //     // });
        // }
        // else{
        //     throw new BrowserNameError("Please ensure the browser name passed is one of: 'Google Chrome', 'Brave', 'Firefox', 'Ghostery'.");
        // }
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

// module.exports = {
//     createBrowserInstance
//   };