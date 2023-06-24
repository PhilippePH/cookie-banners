const selectWebsites = require('./websiteSelection.cjs');
const puppeteer = require("puppeteer"); /// change this to puppeteer core!!!!!!!!!!

const NUM_URLS = 10;

// async waits for something to finish before moving on

async function crawl(){
    data = await selectWebsites.getFirstURLs(NUM_URLS);
    // console.log(data);

    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    // loop through URLs
    for(let i = 0; i < data.length; i++){
        let URL = data[i];
        console.log(URL);
        try{
            await page.goto(URL);
            await page.screenshot({path: "./screenshots/"+i+".png"});
        } catch(error){
            console.log("Couldn't open" + URL);
            console.log(error);
        }
    }

    await browser.close();
}
crawl();