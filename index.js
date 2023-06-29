const selectWebsites = require('./websiteSelection.cjs');
const createBrowser = require('./browser');
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// register `puppeteer-extra` plugins.
puppeteer.use(StealthPlugin()) // allows to pass all tests on SannySoft, even if not *actually* in headfull mode

const NUM_URLS = 10;
const browser_list = ['Chrome']

async function crawl(browser_list){
    // set up URL List
    // URL_list = await selectWebsites.getFirstURLs(NUM_URLS);
    URL_list = ["https://bot.sannysoft.com/"];
    
    for(let j = 0; j < browser_list.length; j++){
        const browserInstance = await createBrowser.browserObject(browser_list[j]);
        const page = await browserInstance.newPage();

        // loop through URLs
        for(let i = 0; i < URL_list.length; i++){
            let URL = URL_list[i];
            console.log(URL);
            try{
                await page.goto(URL,{
                    timeout: 30000, // 30 sec nav timeout
                    waitUntil: "networkidle2", // either domcontentloaded,networkidle0, networkidle2 -- domcontentloaded seems to be too quick, not all banners appear
                });
                
                await page.screenshot({path: "./screenshots/"+i+".png"});
            } catch(error){
                console.log("Couldn't open" + URL);
                console.log(error);
            }
        }

        await browserInstance.close();
    }
}


crawl(browser_list);