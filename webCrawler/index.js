const selectWebsites = require('./websiteSelection');
const createBrowserInstance = require('./browser');
const databaseAPI = require('./db');
const mysql = require('mysql2');
const fs = require('fs').promises;
const { promisify } = require('util');
const puppeteer = require('puppeteer');
const path = require('path');

const crawlID = Date.now();
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'I@mastrongpsswd',
    database: 'CrawlData',
  });


async function testCrawler(path, browser, vantagePoint){
    path = path + "/test";
    await fs.mkdir(path);
    path = path + "/vantagePoint";
    await fs.mkdir(path);
    path = path + "/browser";
    await fs.mkdir(path);

    // Tests bot detection + proxy (IP)
    await crawl(browser, path, ["https://bot.sannysoft.com", 
                "https://www.whatismyipaddress.com"], vantagePoint, null, true);
}

async function getResponses(page, browser, URL, connection){
    try{
        await page.on('response', async (interceptedResponse) => {
            await databaseAPI.saveResponses(crawlID, browser, URL, interceptedResponse, connection)
        })
    } catch(error){ console.log("Error collecting HTTP headers, or adding them to the database"); }
}


async function getScreenshot(page, resultPath, siteName){
    try{ // Screenshot 
        await page.screenshot({
            path: resultPath + `/screenshots/${siteName}.jpeg`,
            type: "jpeg",
            quality: 50,
        });
    } catch(error){ console.log("Error with the screenshot"); console.log(error); }
}


async function getHTML(page, resultPath, siteName){
    try{
        // Downloads the HTML of the website and saves it to a file
        const htmlContent = await page.content();
        const fileName = resultPath+`/htmlFiles/${siteName}.html`;
        const writeFileAsync = promisify(fs.writeFile);
        writeFileAsync(fileName, htmlContent); // I REMOVED THE ASYNC HERE....
    } catch(error){ console.log("Error with saving the HTML of the page to a file"); }
}

async function getCookies(page, browser, URL, connection){
    try{
        const topFrame = await page.mainFrame();
        return getFrameCookiesRecursive(topFrame, browser, URL, connection);
    } catch(error){ 
        console.log("Error getting top frame. Cookies not saved.");
    }
}

// Function to recursively iterate through frames and save the cookies
async function getFrameCookiesRecursive(frame, browser, URL, connection) {
    let frameCookies, frameURL;

    try{
        frameCookies = await frame.page().cookies();
        frameURL = frame.url();
    } catch(error){ console.log("Error getting frame cookie information"); }

    try{
        await databaseAPI.saveCookies(crawlID, browser, URL, "cookies", frameURL, frameCookies, connection);
    } catch(error){ console.log("Error with saving the cookies of the page to the database");} 

    const childFrames = frame.childFrames();
    for (const childFrame of childFrames) {
        await getFrameCookiesRecursive(childFrame, browser, URL, connection);
    }
}

async function getLocalStorageRecursive(page, browser, URL, frame, connection){
    let localStorage;
    try{ 
        localStorage = await frame.evaluate(() => {
        const localStorageData = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          localStorageData[key] = value;
        }
        return localStorageData;
      });
    } catch(error){ console.log("Error fetching the local storage of a frame. "); }
    
    try{
        await databaseAPI.saveLocalStorage(crawlID, browser, URL, "localStorage", frame.url(), localStorage, connection) // NOTE TO SELF: using frame.url() because frame.origin() does not seem to exist
    } catch(error){ console.log("Error with saving the localStorage of the page to the database"); }

    const childFrames = frame.childFrames();
    for (const childFrame of childFrames) {
      await getLocalStorageRecursive(page, browser, URL, childFrame, connection);
    }
}


async function getLocalStorage(page, browser, URL, connection){
    const mainFrame = await page.mainFrame();
    await getLocalStorageRecursive(page, browser, URL, mainFrame, connection)
}


async function crawl(browser, resultPath, URL_list, vantagePoint, connection = null, test = false){
    let browserInstance, pages, page;

    try{ 
        browserInstance = await createBrowserInstance.createBrowserInstance(browser, vantagePoint);
    } catch{ return; } // Exit if fail to create browser instance

    try{ // Closes BrowserInstance in case of an unhandled error

        /* This gets rid of the about::blank page at startup.
        It is important to keep the number of tabs open at maximum 1, since 
        we want cookies to be removed when last tab is closed (for Chrome + Brave for now) */
        pages = await browserInstance.pages();
        page = pages[0];
        await page.close();

        for(let URL of URL_list){
            page = await browserInstance.newPage();
            
            console.log(URL);
            const siteName = await selectWebsites.getSiteNames(URL);
            
            if(! test){
                if(browser == 'Google Chrome' || browser == 'Brave'){
                    await getResponses(page, browser, URL, connection);
                }
            }

            try{   
                await page.goto(URL,{
                    timeout: 10000,
                    waitUntil: "networkidle2", 
                    /* waitUntil: either load, domcontentloaded,networkidle0, networkidle2
                    - domcontentloaded seems to be too quick, not all banners appear
                    - newtworkidle2 creates multiple timeouts (i think some browsers might never send the message)
                    */ 
                });
            } catch(error){
                if (error instanceof puppeteer.TimeoutError) {
                    console.log("TimeoutError:", URL);
                    await page.close();
                } else{ console.log("Error visiting webpage:", URL); }
                continue;
            }                
            
            await getScreenshot(page, resultPath, siteName);

            if(! test){
                await getHTML(page, resultPath, siteName);
                await getCookies(page, browser, URL, connection);
                await getLocalStorage(page, browser, URL, connection);
            }
            
            await page.close();
        }
    } catch(error){ // Here to ensure the BrowserInstance closes in case of an error
        console.log(error);
        await page.close();
        await browserInstance.close();
        console.log("BrowserInstance closed in error handling.")
        return;
    }

    await browserInstance.close();
    console.log(browser + " instance closed.")
}


async function main(){
    // Unpacking command line arguments (and removing 'node', 'index.js')
    const args = process.argv.slice(2);

    // Accessing individual arguments
    const path = args[0]
    const vantagePoint = args[1];
    const browser = args[2];

    let NUM_URLS = 5000;
    
    // Test the parameters
    // await testCrawler(path, browserList, vantagePoint);
    
    // Get websites list
    // const URL_list = await selectWebsites.getFirstURLs(NUM_URLS);
    const URL_list = ['https://www.walmart.com/'];

    // Set up Database connection
    await databaseAPI.establishConnection(connection); 
    
    // Crawl
    await crawl(browser, path, URL_list, vantagePoint, connection);

    // Close database connection
    await databaseAPI.endConnection(connection);

    return;
}

main();