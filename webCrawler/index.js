const selectWebsites = require('./websiteSelection');
const createBrowserInstance = require('./browser');
const databaseAPI = require('./db');
const mysql = require('mysql2');
const fs = require('fs').promises;
const { promisify } = require('util');
const puppeteer = require('puppeteer');
const path = require('path');

let crawlID = Date.now();
//   const options = {
//     year: 'numeric',
//     month: 'numeric',
//     day: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//     second: '2-digit',
//     hour12: false,
//     hourCycle: 'h23'
//     };
// crawlID = crawlID.toLocaleString('en-GB', options);
// crawlID = crawlID.replace(/,/g, '');

// console.log(crawlID);
// return;

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'I@mastrongpsswd',
    database: 'CrawlData',
  });


async function testCrawler(path, browser, vantagePoint, processID){
    path = path + '/test';
    await fs.mkdir(path);
    newPath = path + '/screenshots';
    await fs.mkdir(newPath);

    // Tests bot detection + proxy (IP)
    await crawl(browser, path, ["https://bot.sannysoft.com", 
                "https://www.whatismyip.com/"], vantagePoint, null, processID, true);
}

async function getResponses(page, browser, URL, connection){
    try{
        await page.on('response', async (interceptedResponse) => {
            try{
                await databaseAPI.saveResponses(crawlID, browser, URL, interceptedResponse, connection)
            } catch(error){ console.log("Error adding HTTP headers to the database."); }
        })
    } catch(error){ console.log("Error collecting HTTP headers."); }
}


async function getScreenshot(page, resultPath, siteName){
    try{ // Screenshot 
        await page.screenshot({
            path: resultPath + `/screenshots/${siteName}.jpeg`,
            type: "jpeg",
            quality: 25,
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
    let frameCookies, frameOrigin;

    try{
        frameCookies = await frame.page().cookies();
        frameOrigin = await frame.evaluate(() => {            
            return window.origin;
        });
    } catch(error){ console.log("Error getting frame cookie information"); }
    console.log(frameOrigin);
    try{
        await databaseAPI.saveCookies(crawlID, browser, URL, "cookies", frameOrigin, frameCookies, connection);
    } catch(error){ console.log("Error with saving the cookies of the page to the database"); console.log(error);} 

    const childFrames = frame.childFrames();
    for (const childFrame of childFrames) {
        await getFrameCookiesRecursive(childFrame, browser, URL, connection);
    }
}

async function getLocalStorageRecursive(page, browser, URL, frame, connection){
    let values;
    try{ 
        values = await frame.evaluate(() => {            
            const origin = window.origin;
            const localStorageData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                localStorageData[key] = value;
            }
            return [localStorageData, origin];
        });
    } catch(error){ console.log("Error fetching the local storage of a frame. "); }
    
    let localStorage = values[0];
    let frameOrigin = values[1];

    try{
        await databaseAPI.saveLocalStorage(crawlID, browser, URL, "localStorage", frameOrigin, localStorage, connection) // NOTE TO SELF: using frame.url() because frame.origin() does not seem to exist
    } catch(error){ console.log("Error with saving the localStorage of the page to the database"); }

    const childFrames = await frame.childFrames();
    for (const childFrame of childFrames) {
      await getLocalStorageRecursive(page, browser, URL, childFrame, connection);
    }
}


async function getLocalStorage(page, browser, URL, connection){
    const mainFrame = await page.mainFrame();
    await getLocalStorageRecursive(page, browser, URL, mainFrame, connection)
}


async function crawl(browser, resultPath, URL_list, vantagePoint, 
                    connection = null, processID = 1, test = false){
    
    let browserInstance, pages, page;

    try{ 
        browserInstance = await createBrowserInstance.createBrowserInstance(browser, vantagePoint);
    } catch{ return; } // Exit if fail to create browser instance

    try{ // Closes BrowserInstance in case of an unhandled error

        /* This gets rid of the about::blank page at startup. */
        pages = await browserInstance.pages();
        page = pages[0];
        await page.close();

        for(let URL of URL_list){
            page = await browserInstance.newPage();
            
            console.log(`${processID} (${browser}): ${URL}`);
            const siteName = await selectWebsites.getSiteNames(URL);
            
            if(! test){
                if(browser == 'Google Chrome' || browser == 'Brave'){
                    await getResponses(page, browser, URL, connection);
                }
            }

              try{
                await page.goto(URL, { timeout: 30000, waitUntil: "load", } );
            } catch(error){
                if (error instanceof puppeteer.TimeoutError) {
                    console.log(`${processID} (${browser}): TimeoutError -> ${URL}`);
                } else{ console.log(`${processID} (${browser}): Error visiting webpage -> ${URL}`);}
                await page.close();
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
        console.log(`${processID} (${browser}): BrowserInstance closed in error handling.`)
        return;
    }

    await browserInstance.close();
    console.log(`${processID} (${browser}) instance closed.`)
}


async function main(){
    // Unpacking command line arguments (and removing 'node', 'index.js')
    const args = process.argv.slice(2);

    // Accessing individual arguments
    const path = args[0];
    const vantagePoint = args[1];
    const browser = args[2];
    const websiteListString = args[3];
    const processID = args[4];

    const websiteList = websiteListString.split(','); // Convert back to an array

    // Test the parameters
    // await testCrawler(path, browser, vantagePoint, processID);

    // Set up Database connection
    await databaseAPI.establishConnection(connection); 
    
    // Crawl
    await crawl(browser, path, websiteList, vantagePoint, connection, processID, false);

    // Close database connection
    await databaseAPI.endConnection(connection);
}

main();