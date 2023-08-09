import {getSiteNames} from './websiteSelection.js';
import {createBrowserInstance} from "./browser.js";
import {saveCookies, saveResponses, saveRequests, saveLocalStorage} from "./db.js";
import {createWriteStream} from 'fs';
import * as puppeteer from 'puppeteer';
import xvfb from 'xvfb';
import pg from 'pg';
import fs from 'fs/promises';

let LOADED_COUNTER = 0;
let TIMEOUT_COUNTER = 0;
let OTHER_ERROR_COUNTER = 0;
let COOKIE_TIMEOUT_COUNTER = 0;
let LOCALSTORAGE_TIMEOUT_COUNTER = 0;
let FULLY_SUCCESS_WEBSITES = [];
let SUCCESS_BOOL = true;
let STORAGE_BOOL = true;
let COOKIE_BOOL  = true;

// CrawlID as a DATETIME (mysql) or TIMESTAMP (postgres)
let crawlID = new Date(new Date().toString().split('GMT')+' UTC').toISOString().split('.')[0];
crawlID = crawlID.replace(/T/g, ' ');

async function startXvfb(){
    const XVFB = new xvfb({
        silent:true,
        xvfb_args: ['-screen', '0', '2800x1800x24'],
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
    let newPath = path + '/screenshots';
    await fs.mkdir(newPath);

    // Tests bot detection + proxy (IP)
    await crawl(browser, path, ["https://bot.sannysoft.com",
                "https://www.whatismyip.com/","https://www.showmyip.com/"], 
                vantagePoint, null, processID, true, device);
}

async function getResponses(page, browser, websiteUrl, connection){
    try{
        await page.on('response', async (interceptedResponse) => {
            try{
                await interceptedResponse;
                await saveResponses(crawlID, browser, websiteUrl, interceptedResponse, connection);
            } catch(error){ console.log("Error adding responses to the database."); }
        })
    } catch(error){ console.log("Error collecting responses."); }
}

async function getRequests(page){
    let frames = [];
    let requestedURL = [];
    try{
        await page.on('request', async (interceptedRequest) => {

            requestedURL.push(interceptedRequest.url());

            if(interceptedRequest.frame() instanceof puppeteer.Frame) {
                frames.push(interceptedRequest.frame());
            }
        })
    } catch(error){ console.log("Error collecting requests."); console.log(error);}

    return [frames, requestedURL];
}

async function addRequestToDb(requestData, browser, websiteUrl, connection){
    let framesObjects = requestData[0];
    let requestedURL = requestData[1];
    
    for(let index = 0; index < framesObjects.length; index++){
        if(! framesObjects[index].isDetached()){ // cannot evaluate a detached frame
            let frameOrigin = await cookieFrameEvaluate(framesObjects[index]);            
            await saveRequests(crawlID, browser, websiteUrl, frameOrigin, requestedURL[index], connection);
        }
    }
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
        fs.writeFile(fileName, htmlContent);
        // const writeFileAsync = promisify(fs.writeFile);
        // writeFileAsync(fileName, htmlContent); // I REMOVED THE ASYNC HERE....
    } catch(error){ console.log("Error with saving the HTML of the page to a file"); }
}

async function getCookies(page, browser, websiteUrl, connection){
    COOKIE_BOOL = true; 
    try{
        const topFrame = await page.mainFrame();
        await getFrameCookiesRecursive(topFrame, browser, websiteUrl, connection);

        if(! COOKIE_BOOL){
            COOKIE_TIMEOUT_COUNTER++;
        }

    } catch(error){ 
        console.log("Error getting top frame. Cookies not saved.");
    }
}

async function cookieFrameEvaluate(frame){
    const FRAME_TIMEOUT = 10000;
    return Promise.race([
        frame.evaluate(() => {
            return window.origin;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout occurred')), FRAME_TIMEOUT))
    ]);
}

// Function to recursively iterate through frames and save the cookies
async function getFrameCookiesRecursive(frame, browser, websiteUrl, connection) {
    let frameCookies, frameOrigin;

    try{
        frameCookies = await frame.page().cookies();
        if(frame){ 
            if(!frame.isDetached()){
                try{
                    frameOrigin = await cookieFrameEvaluate(frame);
                } catch(error){ 
                    console.log("   **** Error in CookieFrameEvaluate: " + error); 
                    throw new Error;
                }
                
           } else { console.log("   **** Cannot get frame origin because of lazy frame in cookies"); throw new Error; }
        } else { console.log("  **** Frame is null in cookies"); throw new Error;}
    } catch(error){ 
        COOKIE_BOOL = false;
        SUCCESS_BOOL = false;
        return; 
    }
    
    try{
        await saveCookies(crawlID, browser, websiteUrl, "cookies", frameOrigin, frameCookies, connection);
    } catch(error){ console.log("Error with saving the cookies of the page to the database");} 

    const childFrames = frame.childFrames();
    for (const childFrame of childFrames) {
        await getFrameCookiesRecursive(childFrame, browser, websiteUrl, connection);
    }
}

async function LocalStorageFrameEvaluate(frame){
    const FRAME_TIMEOUT = 10000;
    return Promise.race([
        frame.evaluate(() => {            
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
                try{
                    values = await LocalStorageFrameEvaluate(frame);
                } catch(error){ 
                    console.log("   **** Error in LocalStorageFrameEvaluate: " + error); 
                    throw new Error; 
                }

                localStorage = values[0];
                frameOrigin = values[1];

            } else {console.log("   **** Cannot get frame origin because of lazy frame in local storage"); throw new Error; }
        } else {console.log("   **** Frame is null in localstorage"); throw new Error; }

    } catch(error){
        STORAGE_BOOL = false;
        SUCCESS_BOOL = false;
        return; 
    }
    
    try{
        await saveLocalStorage(crawlID, browser, websiteUrl, "localStorage", frameOrigin, localStorage, connection);
    } catch(error){ console.log("Error with saving the localStorage of the page to the database"); }

    const childFrames = await frame.childFrames();
    for (const childFrame of childFrames) {
      await getLocalStorageRecursive(page, browser, websiteUrl, childFrame, connection);
    }
}


async function getLocalStorage(page, browser, websiteUrl, connection){
    STORAGE_BOOL = true;
    const mainFrame = await page.mainFrame();
    await getLocalStorageRecursive(page, browser, websiteUrl, mainFrame, connection);
    if(!STORAGE_BOOL){
        LOCALSTORAGE_TIMEOUT_COUNTER++;
    }
}


async function crawl(browser, resultPath, urlList, vantagePoint, 
                    connection = null, processID = 1, test = false, device = 'linux'){
    
    let browserInstance, pages, page;

    try{ 
        browserInstance = await createBrowserInstance(browser, vantagePoint, device);
    } catch(error){ console.log(error); return; } // Exit if fail to create browser instance

    try{ // Closes BrowserInstance in case of an unhandled error

        /* This gets rid of the about::blank page at startup. */
        // pages = await browserInstance.pages();
        // page = pages[0];
        // await page.close();

        let urlCounter = 0;
        
        for(let websiteUrl of urlList){
            SUCCESS_BOOL = true;
            urlCounter++;

            page = await browserInstance.newPage();
            console.log(`\n${processID} (${browser}): (${urlCounter}) ${websiteUrl}`);
            const siteName = await getSiteNames(websiteUrl);
            
            let requestData;
            if(! test){
                requestData = await getRequests(page);
                await getResponses(page, browser, websiteUrl, connection);    
            }

            // page.on('console', msg => console.log('PAGE LOG:', msg.text()));

            try{
                await page.goto(websiteUrl, { timeout: 0});
                console.log("   Page loaded");
                LOADED_COUNTER++;
            } catch(error){
                if (error instanceof puppeteer.TimeoutError) {
                    console.log(`** ${processID} (${browser}): TimeoutError -> ${websiteUrl}`);
                    TIMEOUT_COUNTER++;
                    SUCCESS_BOOL = false;
                } else{ 
                    console.log(`** ${processID} (${browser}): Error visiting webpage -> ${websiteUrl}`);
                    OTHER_ERROR_COUNTER++;
                    SUCCESS_BOOL = false;
                }
                await page.close();
                continue;
            }           
                 
            if(test){await getScreenshot(page, resultPath, siteName);}

            if(! test){
                console.log("   Getting HTML");
                await getHTML(page, resultPath, siteName);
                console.log("   Getting cookies");
                await getCookies(page, browser, websiteUrl, connection);
                console.log("   Getting localstorage");
                await getLocalStorage(page, browser, websiteUrl, connection);
                console.log("   Adding requests to DB");
                await addRequestToDb(requestData, browser, websiteUrl, connection);
            }
            
            // await page.close();

            if(SUCCESS_BOOL) { FULLY_SUCCESS_WEBSITES.push(websiteUrl) ; }
        }
    } catch(error){ // Here to ensure the BrowserInstance closes in case of an error
        console.log(error);
        await page.close();
        await browserInstance.close();
        console.log(`** ${processID} (${browser}): BrowserInstance closed in error handling.`)
        return;
    }

    // await browserInstance.close();
    console.log(`   ${processID} (${browser}) instance closed.`)
}


async function saveSuccessfulWebsites(arr,path){
    var file = createWriteStream(`${path}/successfulURLs.txt`);
  
    file.on('error', function(err) { console.log(err); return; });
    for(let i = 0; i < arr.length; i++){
      await file.write(arr[i] + '\n');
    }
    file.end();
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

    // const websiteList = websiteListString.split(','); // Convert back to an array
    const websiteList = ['https://bot.sannysoft.com/']


    // Linux SetUp
    let XVFB = null;
    if(device == 'linux'){
        XVFB = await startXvfb();
        console.log("XVFB connected");
    }

    // Test the parameters
    // try{
    //     await testCrawler(path, browser, vantagePoint, processID, device);
    // } catch(error){
    //     console.log("Error in the testCrawler.");
    //     console.log(error);
    // }

    //Reseting counters after the tests
    LOADED_COUNTER = 0;
    TIMEOUT_COUNTER = 0;
    OTHER_ERROR_COUNTER = 0;
    COOKIE_TIMEOUT_COUNTER = 0;
    LOCALSTORAGE_TIMEOUT_COUNTER = 0;
    FULLY_SUCCESS_WEBSITES = [];
    SUCCESS_BOOL = true;
    STORAGE_BOOL = true;
    COOKIE_BOOL  = true;


    // Set up Database connection
    const connection = new pg.Client({
        user: 'postgres',
        password: 'I@mastrongpsswd',
        host: '146.169.40.178',
        database: 'crawlData',
        port: '5432'
    });
    
    await connection.connect();
    console.log("Database connection established")

    // Crawl
    try{
        await crawl(browser, path, websiteList, vantagePoint, connection, processID, false, device);
    } catch(error){
        console.log("Error in the crawl function");
        console.log(error);
    }

    // Close database connection
    await connection.end();    // NOTE: SOMETIMES DATABASE DISCONNECTS BEFORE EVERY REQUEST HAS BEEN ADDED TO THE DB
    console.log("Database connection disconnected")

    // Close XVFB
    if(XVFB) { 
        await stopXvfb(XVFB); 
        console.log("XVFB disconnected");
    }

    console.log(
        "LOADED COUNTER : " + LOADED_COUNTER + "\n" +
        "TIMEOUT COUNTER : " + TIMEOUT_COUNTER + "\n" +
        "OTHER ERROR COUNTER : " + OTHER_ERROR_COUNTER + "\n" +
        "COOKIE TIMEOUT COUNTER : " + COOKIE_TIMEOUT_COUNTER + "\n" +
        "LOCALSTORAGE TIMEOUT COUNTER : " + LOCALSTORAGE_TIMEOUT_COUNTER + "\n" + 
        "NUMBER OF SUCCESSFUL WEBSITES : " + FULLY_SUCCESS_WEBSITES.length +"\n" +
        "SUCCESSFUL WEBSITES : " + FULLY_SUCCESS_WEBSITES
    );

    await saveSuccessfulWebsites(FULLY_SUCCESS_WEBSITES, path);
}

main();