const selectWebsites = require('./websiteSelection');
const createBrowserInstance = require('./browser');
const databaseAPI = require('./db');
const fs = require('fs').promises;
const { promisify } = require('util');
const puppeteer = require('puppeteer');
const xvfb = require('xvfb');
const { Client } = require('pg');

// CrawlID as a DATETIME (mysql) or TIMESTAMP (postgres)
let crawlID = new Date(new Date().toString().split('GMT')+' UTC').toISOString().split('.')[0];
crawlID = crawlID.replace(/T/g, ' ');

async function startXvfb(){
    const XVFB = new xvfb({
        silent:true,
        xvfb_args: ['-screen', '0', '1280x1024x24'],
    });

    return new Promise((resolve, reject) => {
        XVFB.start((error) => {
            if(error) {reject(error);}
            resolve(XVFB);
        });
    });
}

async function stopXvfb(XVFB){
    return new Promise((resolve, reject) => {
        XVFB.stop((error) => {
            if(error) {reject(error);}
            resolve(error);
        });
    });
}

async function testCrawler(path, browser, vantagePoint, processID, device = 'linux'){
    path = path + '/test';
    await fs.mkdir(path);
    newPath = path + '/screenshots';
    await fs.mkdir(newPath);

    // Tests bot detection + proxy (IP)
    await crawl(browser, path, ["https://bot.sannysoft.com", 
                "https://www.whatismyip.com/"], vantagePoint, null, processID, true, device);
}

async function getResponses(page, browser, websiteUrl, connection){
    try{
        await page.on('response', async (interceptedResponse) => {
            try{
                await databaseAPI.saveResponses(crawlID, browser, websiteUrl, interceptedResponse, connection)
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

async function getCookies(page, browser, websiteUrl, connection){
    try{
        const topFrame = await page.mainFrame();
        return getFrameCookiesRecursive(topFrame, browser, websiteUrl, connection);
    } catch(error){ 
        console.log("Error getting top frame. Cookies not saved.");
    }
}

async function cookieFrameEvaluate(frame){
    const FRAME_TIMEOUT = 5000;
    return Promise.race([
        frame.evaluate(() => {
          console.log("Trace 4: Printing in browser console");
          return window.origin;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout occurred')), FRAME_TIMEOUT))
    ]);
}

// Function to recursively iterate through frames and save the cookies
async function getFrameCookiesRecursive(frame, browser, websiteUrl, connection) {
    let frameCookies, frameOrigin;

    try{
        //console.log("Trace 1: Getting the cookies");
        frameCookies = await frame.page().cookies();
        //console.log("Trace 2: Got the cookies");
        if(frame){ 
            if(!frame.isDetached()){
                //console.log("Trace 3: Passed the two verifications, about to evalute. (In cookies function)");
                try{
                    frameOrigin = await cookieFrameEvaluate(frame);
                } catch(error){ console.log("Error in CookieFrameEvaluate: " + error); }
                
           } else { console.log("Trace 5: Cannot get frame origin because of lazy frame ----------------------"); }
        } else { console.log("Trace 6: Frame is null -----------------");}

        //console.log("Trace 7: Got the frameOrigin");
    } catch(error){ console.log("Error getting frame cookie information"); }
    try{
        await databaseAPI.saveCookies(crawlID, browser, websiteUrl, "cookies", frameOrigin, frameCookies, connection);
        //console.log("Trace 8: Added to DB");
    } catch(error){ console.log("Error with saving the cookies of the page to the database"); console.log(error);} 

    const childFrames = frame.childFrames();
    for (const childFrame of childFrames) {
        //console.log("Trace 9: About to do a recursive call");
        await getFrameCookiesRecursive(childFrame, browser, websiteUrl, connection);
    }
}

async function LocalStorageFrameEvaluate(frame){
    const FRAME_TIMEOUT = 5000;
    return Promise.race([
        frame.evaluate(() => {            
            //console.log("Trace 11: Printing in browser console");
            const origin = window.origin; // stuck here
            const localStorageData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                localStorageData[key] = value;
            }
            return [localStorageData, origin];
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout occurred')), FRAME_TIMEOUT))
    ]);
}

async function getLocalStorageRecursive(page, browser, websiteUrl, frame, connection){
    let values, localStorage, frameOrigin;
    try{ 
        if(frame){
            if(!frame.isDetached()){
                //console.log("Trace 10: Passed the two verifications, about to evalute. (In localStorage function)");
                try{
                    values = await LocalStorageFrameEvaluate(frame);
                } catch(error){ console.log("Error in LocalStorageFrameEvaluate: " + error); }

                localStorage = values[0];
                frameOrigin = values[1];

        } else {console.log("Trace 12: Cannot get frame origin because of lazy frame ----------------------");}
    } else {console.log("Trace 13: Frame is null -----------------");}

    } catch(error){ console.log("Error fetching the local storage of a frame. "); return; }
    
    try{
        await databaseAPI.saveLocalStorage(crawlID, browser, websiteUrl, "localStorage", frameOrigin, localStorage, connection);
    } catch(error){ console.log("Error with saving the localStorage of the page to the database"); }

    const childFrames = await frame.childFrames();
    for (const childFrame of childFrames) {
      await getLocalStorageRecursive(page, browser, websiteUrl, childFrame, connection);
    }
}


async function getLocalStorage(page, browser, websiteUrl, connection){
    const mainFrame = await page.mainFrame();
    await getLocalStorageRecursive(page, browser, websiteUrl, mainFrame, connection)
}


async function crawl(browser, resultPath, urlList, vantagePoint, 
                    connection = null, processID = 1, test = false, device = 'linux'){
    
    let browserInstance, pages, page;

    try{ 
        browserInstance = await createBrowserInstance.createBrowserInstance(browser, vantagePoint, device);
    } catch{ return; } // Exit if fail to create browser instance

    try{ // Closes BrowserInstance in case of an unhandled error

        /* This gets rid of the about::blank page at startup. */
        // pages = await browserInstance.pages();
        // page = pages[0];
        // await page.close();

        for(let websiteUrl of urlList){
            page = await browserInstance.newPage();
            
            console.log(`${processID} (${browser}): ${websiteUrl}`);
            const siteName = await selectWebsites.getSiteNames(websiteUrl);
            
            if(! test){
                if(browser == 'Google Chrome' || browser == 'Brave'){
                    await getResponses(page, browser, websiteUrl, connection);
                }
            }

            //page.on('console', msg => console.log('PAGE LOG:', msg.text()));

              try{
                await page.goto(websiteUrl, { timeout: 10000, waitUntil: "load", } );
                console.log("Trace 14: Page loaded");
            } catch(error){
                if (error instanceof puppeteer.TimeoutError) {
                    console.log(`${processID} (${browser}): TimeoutError -> ${websiteUrl}`);
                } else{ console.log(`${processID} (${browser}): Error visiting webpage -> ${websiteUrl}`);}
                await page.close();
                continue;
            }                
            
            await getScreenshot(page, resultPath, siteName);

            if(! test){
                console.log("Trace 15: Waiting for HTML");
                await getHTML(page, resultPath, siteName);
                console.log("Trace 16: Waiting for cookies");
                await getCookies(page, browser, websiteUrl, connection);
                console.log("Trace 17: Waiting for localstorage");
                await getLocalStorage(page, browser, websiteUrl, connection);
                console.log("Trace 18: Everything worked, onto the next page!");
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
    const device = args[5]

    const websiteList = websiteListString.split(','); // Convert back to an array

    // Linux SetUp
    let XVFB = null;
    if(device == 'linux'){
        XVFB = await startXvfb();
        console.log("XVFB connected");
    }

    // Test the parameters
    await testCrawler(path, browser, vantagePoint, processID, device);

    // Set up Database connection
    const connection = new Client({
        user: 'postgres',
        password: 'root',
        host: '146.169.40.178',
        database: 'crawlData',
        port: '5432'
    });
    
    await connection.connect();
    console.log("Database connection established")

    // Crawl
    await crawl(browser, path, websiteList, vantagePoint, connection, processID, false, device);

    // Close database connection
    await connection.end();
    console.log("Database connection disconnected")

    // Close XVFB
    if(XVFB) { 
        await stopXvfb(XVFB); 
        console.log("XVFB disconnected");
    }
}

main();
