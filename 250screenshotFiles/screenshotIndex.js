import {getSiteNames} from './websiteSelection/websiteSelection.js';
import {createBrowserInstance} from "./browser.js";
import {saveCookies, saveResponses, saveRequests, saveLocalStorage} from "./db.js";
import {createWriteStream} from 'fs';
// import { Frame } from 'puppeteer-core';
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

async function getScreenshot(page, resultPath, siteName){
    try{ // Screenshot 
        await page.screenshot({
            path: resultPath + `/screenshots/${siteName}.jpeg`,
            fullPage: true,
            type: "jpeg",
            quality: 50,
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

async function crawl(browser, resultPath, urlList, vantagePoint, 
                    connection = null, processID = 1, test = false, device = 'linux'){
    
    let browserInstance, page;
    browserInstance = await startBrowserInstance(browser, vantagePoint, device);

    try{ // Closes BrowserInstance in case of an unhandled error

        let urlCounter = 0;
        
        for(let websiteUrl of urlList){
            SUCCESS_BOOL = true;
            urlCounter++;

            // Test that browser instance is still active
            try{
                page = await browserInstance.newPage();
            } catch(error){
                console.log(error)                
                console.log("Browser instance was closed somehow. Starting a new one.")
                browserInstance = await startBrowserInstance(browser, vantagePoint, device);
                page = await browserInstance.newPage();
            }

            console.log(`\n${processID} (${browser}): (${urlCounter}) ${websiteUrl}`);
            const siteName = await getSiteNames(websiteUrl);
            
            
            try{
                console.log(`   ${processID} (${browser}) : Loading new page ${websiteUrl}`);
                await page.goto( websiteUrl, { timeout: 30000, waitUntil:'load'} );
                console.log(`   ${processID} (${browser}) ${websiteUrl}: Page loaded`);
                LOADED_COUNTER++;
            } catch(error){
                // if (error instanceof TimeoutError) { // for some reason, this stopped working at one point.. I tried fixing the imports, but can't find the issue
                if (error.name == "TimeoutError"){
                    console.log(`** ${processID} (${browser}): TimeoutError -> ${websiteUrl}`);
                    TIMEOUT_COUNTER++;
                    SUCCESS_BOOL = false;
                } else{ 
                    console.log(`** ${processID} (${browser}): ${error.name} visiting webpage -> ${websiteUrl} (${error.message})`);
                    OTHER_ERROR_COUNTER++;
                    SUCCESS_BOOL = false;
                }
                console.log(`** ${processID} (${browser}) closing page.`)
                try{
                    await page.close();
                    // also tried restarting the browser, but that didn't fix the issue etiher....
                } catch(error) {console.log(` ** ${processID} (${browser}): Error trying to close the page after error with webpage ${websiteUrl}`)}
                console.log(`** ${processID} (${browser}) Webpage closed.`);
                continue;
            }           

            // Waiting 5 seconds before taking the screenshot
            await Promise.race([
                new Promise((resolve,_) => setTimeout(() => resolve(), 5000))
            ]);

            await getScreenshot(page, resultPath, siteName); //screenshot for top 250
            console.log(`   ${processID} (${browser}) ${websiteUrl}: Getting HTML`);
            await getHTML(page, resultPath, siteName);
 
            console.log(`   ${processID} (${browser}) ${websiteUrl}: Page closed`);
            await page.close();

            if(SUCCESS_BOOL && !test) { 
                console.log(`   ${processID} (${browser}) ${websiteUrl}: Adding to successful website`);
                FULLY_SUCCESS_WEBSITES++;
            }
        }
    } catch(error){ // Here to ensure the BrowserInstance closes in case of an error
        console.log(error);
        await page.close();
        await browserInstance.close();
        console.log(`** ${processID} (${browser}): BrowserInstance closed in error handling.`)
        return;
    }

    await browserInstance.close();
    console.log(`   ${processID} (${browser}) instance closed.`)
}

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
    
    // Crawl
    try{
        await crawl(browser, path, websiteList, vantagePoint, null, processID, false, device);
    } catch(error){
        console.log("Error in the crawl function");
        console.log(error);
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