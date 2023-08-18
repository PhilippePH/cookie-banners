import {getSiteNames} from './websiteSelection.js';
import {createBrowserInstance} from "./browser.js";
import {saveCookies, saveResponses, saveRequests, saveLocalStorage} from "./db.js";
import {createWriteStream} from 'fs';
import { Frame } from 'puppeteer-core';
import xvfb from 'xvfb';
import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { exit } from 'process';

let LOADED_COUNTER = 0;
let TIMEOUT_COUNTER = 0;
let OTHER_ERROR_COUNTER = 0;
let COOKIE_TIMEOUT_COUNTER = 0;
let LOCALSTORAGE_TIMEOUT_COUNTER = 0;
let FULLY_SUCCESS_WEBSITES = 0;
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
                "https://www.whatismyip.com","https://www.showmyip.com", "https://whatismyipaddress.com"], 
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

            if(interceptedRequest.frame() instanceof Frame) {
                frames.push(interceptedRequest.frame());
            }
        })
    } catch(error){ console.log("Error collecting requests."); console.log(error);}

    return [frames, requestedURL];
}

async function addRequestToDb(requestData, browser, websiteUrl, connection){
    let framesObjects = requestData[0]; // THIS IS EMPTY
    let requestedURL = requestData[1];
    console.log(requestData[0]);
    
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
    // Downloads the HTML of the website and saves it to a file
    try{
        const HTML_TIMEOUT = 5000;
        const htmlContent =  await Promise.race([        
                await page.content(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout occurred')), HTML_TIMEOUT))
        ]);
        const fileName = resultPath+`/htmlFiles/${siteName}.html`;
        fs.writeFile(fileName, htmlContent);
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
    const FRAME_TIMEOUT = 5000;
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
                    console.log("      **** Error in CookieFrameEvaluate" ); 
                    throw new Error;
                }
                
           } else { console.log("      **** Cannot get frame origin because of lazy frame in cookies"); throw new Error; }
        } else { console.log("    **** Frame is null in cookies"); throw new Error;}
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
    const FRAME_TIMEOUT = 5000;
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
                    console.log("      **** Error in LocalStorageFrameEvaluate"); 
                    throw new Error; 
                }

                localStorage = values[0];
                frameOrigin = values[1];

            } else {console.log("      **** Cannot get frame origin because of lazy frame in local storage"); throw new Error; }
        } else {console.log("      **** Frame is null in localstorage"); throw new Error; }

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

async function startBrowserInstance(browser, vantagePoint, device){
    let BI;
    try{ 
        BI =  await createBrowserInstance(browser, vantagePoint, device);
    } catch(error){ 
        console.log("Error starting browser " + browser);
        console.log(error); 
        exit; 
    } // Exit if fail to create browser instance
    return BI;
}

async function saveSuccessfulWebsites(websiteUrl, resultPath, browser){
    var file = createWriteStream(`${resultPath}/${browser}_successfulURLs.txt`, {flags:'a'});
  
    file.on('error', function(err) { console.log(err); return; });
    file.write(websiteUrl + '\n');
    file.end();
}

async function saveUnsuccessfulWebsites(unsucessfullWebsites, resultPath, browser){
    var file = createWriteStream(`${resultPath}/${browser}_unsuccessfulURLs.txt`);
  
    file.on('error', function(err) { console.log(err); return; });
    for(let i = 0; i < unsucessfullWebsites.length; i++){
        file.write(unsucessfullWebsites[i] + '\n');
    }
    file.end();
}


async function crawl(browser, resultPath, urlList, vantagePoint, 
                    connection = null, processID = 1, test = false, device = 'linux'){
    
    let unsucessfullWebsites = [];
    let browserInstance, page;
    browserInstance = await startBrowserInstance(browser, vantagePoint, device);

    try{ // Closes BrowserInstance in case of an unhandled error

        let urlCounter = 0;
        
        for(let websiteUrl of urlList){
            SUCCESS_BOOL = true;
            urlCounter++;
            unsucessfullWebsites.push(websiteUrl);

            // Test that browser instance is still active
            try{
                page = await browserInstance.newPage();
            } catch(error){
                console.log(error)                
                console.log("Browser instance was closed somehow. Starting a new one.")
                browserInstance = startBrowserInstance(browser, vantagePoint, device);
                page = await browserInstance.newPage();
            }

            console.log(`\n${processID} (${browser}): (${urlCounter}) ${websiteUrl}`);
            const siteName = await getSiteNames(websiteUrl);
            
            let requestData;
            if(! test){
                try{
                    console.log(`   ${processID} (${browser}) ${websiteUrl}: Getting Requests`);
                    requestData = await getRequests(page);
                    console.log(`   ${processID} (${browser}) ${websiteUrl}: Getting Responses`);
                    await getResponses(page, browser, websiteUrl, connection);    
                } catch(error){
                    console.log(`${processID} (${browser}) ${websiteUrl}: An error happened when getting responses and requests.`);
                    console.log(error)
                }
            }

            try{
                console.log(`   ${processID} (${browser}) : Loading new page ${websiteUrl}`);
                await page.goto(websiteUrl, { timeout: 5000, waitUntil:'load'});
                console.log(`   ${processID} (${browser}) ${websiteUrl}: Page loaded`);
                LOADED_COUNTER++;
            } catch(error){
                // if (error instanceof TimeoutError) { // for some reason, this stopped working at one point.. I tried fixing the imports, but can't find the issue
                if (error.name == "TimeoutError"){
                    console.log(`** ${processID} (${browser}): TimeoutError -> ${websiteUrl}`);
                    TIMEOUT_COUNTER++;
                    SUCCESS_BOOL = false;
                } else{ 
                    console.log(`** ${processID} (${browser}): Error visiting webpage -> ${websiteUrl}`);
                    console.log("Double check none are timeouts");
                    console.log(error.name);
                    console.log(error.message);
                    OTHER_ERROR_COUNTER++;
                    SUCCESS_BOOL = false;
                }
                try{
                    console.log(`** ${processID} (${browser}) closing webpage.`)
                    await page.close();
                } catch(error) {console.log(` ** ${processID} (${browser}): Error trying to close the page after error with webpage ${websiteUrl}`)}
                continue;
            }           

            if (test){
                await getScreenshot(page, resultPath, siteName); //screenshot for top 250
            }
            else{
                console.log(`   ${processID} (${browser}) ${websiteUrl}: Getting HTML`);
                await getHTML(page, resultPath, siteName);
                console.log(`   ${processID} (${browser}) ${websiteUrl}: Getting Cookies`);
                await getCookies(page, browser, websiteUrl, connection);
                console.log(`   ${processID} (${browser}) ${websiteUrl}: Getting Localstorage`);
                await getLocalStorage(page, browser, websiteUrl, connection);
                console.log(`   ${processID} (${browser}) ${websiteUrl}: Adding requests to DB`);
                await addRequestToDb(requestData, browser, websiteUrl, connection);
            } 
 
            console.log(`   ${processID} (${browser}) ${websiteUrl}: Page closed`);
            await page.close();

            if(SUCCESS_BOOL && !test) { 
                console.log(`   ${processID} (${browser}) ${websiteUrl}: Adding to successful website`);
                await saveSuccessfulWebsites(websiteUrl, resultPath, browser);
                FULLY_SUCCESS_WEBSITES++;
                unsucessfullWebsites.pop(); // Removing from that array since this website was successful. 
            }
        }
    } catch(error){ // Here to ensure the BrowserInstance closes in case of an error
        console.log(error);
        await page.close();
        await browserInstance.close();
        console.log(`** ${processID} (${browser}): BrowserInstance closed in error handling.`)
        return;
    }

    if(!test){
        saveUnsuccessfulWebsites(unsucessfullWebsites, resultPath, browser);
    }
    await browserInstance.close();
    console.log(`   ${processID} (${browser}) instance closed.`)
}

// export async function callableMain(args){
//     // Accessing individual arguments
//     const path = args[0];
//     const vantagePoint = args[1];
//     const browser = args[2];
//     const websiteList = args[3];
//     const processID = args[4];
//     const device = args[5]

//     // Linux SetUp
//     let XVFB = null;
//     if(device == 'linux'){
//         XVFB = await startXvfb();
//         console.log("XVFB connected");
//     }

//     // Test the parameters
//     try{
//         await testCrawler(path, browser, vantagePoint, processID, device);
//     } catch(error){
//         console.log("Error in the testCrawler.");
//         console.log(error);
//     }

//     //Reseting counters after the tests
//     LOADED_COUNTER = 0;
//     TIMEOUT_COUNTER = 0;
//     OTHER_ERROR_COUNTER = 0;
//     COOKIE_TIMEOUT_COUNTER = 0;
//     LOCALSTORAGE_TIMEOUT_COUNTER = 0;
//     FULLY_SUCCESS_WEBSITES = 0;
//     SUCCESS_BOOL = true;
//     STORAGE_BOOL = true;
//     COOKIE_BOOL  = true;


//     // Set up Database connection
//     const connection = new pg.Client({
//         user: 'postgres',
//         password: 'I@mastrongpsswd',
//         host: '146.169.40.178',
//         database: 'crawlData',
//         port: '5432'
//     });
    
//     await connection.connect();
//     console.log("Database connection established")

//     // Crawl
//     try{
//         await crawl(browser, path, websiteList, vantagePoint, connection, processID, false, device);
//     } catch(error){
//         console.log("Error in the crawl function");
//         console.log(error);
//     }

//     // Close database connection
//     await connection.end();    // NOTE: SOMETIMES DATABASE DISCONNECTS BEFORE EVERY REQUEST HAS BEEN ADDED TO THE DB
//     console.log("Database connection disconnected")

//     // Close XVFB
//     if(XVFB) { 
//         await stopXvfb(XVFB); 
//         console.log("XVFB disconnected");
//     }

//     console.log(
//         "LOADED COUNTER : " + LOADED_COUNTER + "\n" +
//         "TIMEOUT COUNTER : " + TIMEOUT_COUNTER + "\n" +
//         "OTHER ERROR COUNTER : " + OTHER_ERROR_COUNTER + "\n" +
//         "COOKIE TIMEOUT COUNTER : " + COOKIE_TIMEOUT_COUNTER + "\n" +
//         "LOCALSTORAGE TIMEOUT COUNTER : " + LOCALSTORAGE_TIMEOUT_COUNTER + "\n" + 
//         "NUMBER OF SUCCESSFUL WEBSITES : " + FULLY_SUCCESS_WEBSITES +"\n"
//     );
// }


async function CLImain(){
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
    try{
        await testCrawler(path, browser, vantagePoint, processID, device);
    } catch(error){
        console.log("Error in the testCrawler.");
        console.log(error);
    }

    //Reseting counters after the tests
    LOADED_COUNTER = 0;
    TIMEOUT_COUNTER = 0;
    OTHER_ERROR_COUNTER = 0;
    COOKIE_TIMEOUT_COUNTER = 0;
    LOCALSTORAGE_TIMEOUT_COUNTER = 0;
    FULLY_SUCCESS_WEBSITES = 0;
    SUCCESS_BOOL = true;
    STORAGE_BOOL = true;
    COOKIE_BOOL  = true;


    // Set up Database connection
    const connection = new pg.Client({
        user: 'postgres',
        password: 'I@mastrongpsswd',
        host: '127.0.0.1',
        database: 'crawlingData',
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
    await connection.end();
    console.log("Database connection disconnected")

    // Close XVFB
    if(XVFB) { 
        await stopXvfb(XVFB); 
        console.log("XVFB disconnected");
    }

    console.log(
        "BROWSER : " + browser + " IS DONE \n" +
        "LOADED COUNTER : " + LOADED_COUNTER + "\n" +
        "TIMEOUT COUNTER : " + TIMEOUT_COUNTER + "\n" +
        "OTHER ERROR COUNTER : " + OTHER_ERROR_COUNTER + "\n" +
        "COOKIE TIMEOUT COUNTER : " + COOKIE_TIMEOUT_COUNTER + "\n" +
        "LOCALSTORAGE TIMEOUT COUNTER : " + LOCALSTORAGE_TIMEOUT_COUNTER + "\n" + 
        "NUMBER OF SUCCESSFUL WEBSITES : " + FULLY_SUCCESS_WEBSITES +"\n"
    );
}
CLImain()