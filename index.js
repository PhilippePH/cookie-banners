const selectWebsites = require('./websiteSelection.cjs');
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// register `puppeteer-extra` plugins.
puppeteer.use(StealthPlugin()) // allows to pass all tests on SannySoft, even if not *actually* in headfull mode

const NUM_URLS = 10;
const browser_list = ['Chrome']

async function setUpBrowser(TBD){
    let browser = puppeteer.launch({
        headless: false, // allows to pass most tests on SannySoft, except WebDrive
        ignoreHTTPSErrors: true,
        args: ['--start-maximized'] // browser takes whole screen
    });
    return browser;
}

async function crawl(browser_list){
    // set up URL List
    // URL_list = await selectWebsites.getFirstURLs(NUM_URLS);
    URL_list = ["https://bot.sannysoft.com/"];
    
    for(let j = 0; j < browser_list.length; j++){
        const browser = await setUpBrowser(browser_list[j]);
        const page = await browser.newPage();

        // loop through URLs
        for(let i = 0; i < URL_list.length; i++){
            let URL = URL_list[i];
            console.log(URL);
            try{
                await page.goto(URL,{
                    waitUntil: "domcontentloaded", // need to double check docs here
                });


                await page.screenshot({path: "./screenshots/"+i+".png"});
            } catch(error){
                console.log("Couldn't open" + URL);
                console.log(error);
            }
        }

        await browser.close();
    }
}


crawl(browser_list);