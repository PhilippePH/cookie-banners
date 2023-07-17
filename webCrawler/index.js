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


/* Note to self: I think we'll run this file for one browser at a time, so prob would be good to change the name of BrowserList and to remove the loops*/
async function createResultFolder(vantagePoint, browserList){
    let d = new Date();
    let path = `results/${d}`; 
    await fs.mkdir(path);
    path = path+`/${vantagePoint}`; 
    await fs.mkdir(path);
    for(let browser of browserList){
        let newPath = path+`/${browser}`;
        await fs.mkdir(newPath)

        // TBD
        let screenshotPath = newPath + "/screenshots";
        await fs.mkdir(screenshotPath)

        let HTMLPath = newPath + "/htmlFiles";
        await fs.mkdir(HTMLPath)
    }
    return path; // probably return "new path" once confirmed we only do 1 browser
}

async function getResponses(page, browser, URL){
    try{
        await page.on('response', async (interceptedResponse) => {
            await databaseAPI.saveResponses(crawlID, browser, URL, interceptedResponse, connection)
        })
    } catch(error){ console.log("Error collecting HTTP headers"); }
}


async function getScreenshot(page, resultPath, siteName){
    try{ // Screenshot 
        await page.screenshot({
            path: resultPath + `/screenshots/${siteName}.jpeg`,
            type: "jpeg",
            quality: 50,
        });
    } catch(error){ console.log("Error with the screenshot"); }
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

async function getCookies(page, browser, URL){
    const client = await page.target().createCDPSession();
    const cookies = (await client.send('Storage.getCookies'));
    try{
        await databaseAPI.saveCookies(crawlID, browser, URL, "cookies", cookies, connection)
    } catch(error){ console.log("Error with saving the cookies of the page to the database"); }
}

async function getLocalStorageRecursive(page, browser, URL, frame){
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
    } catch(error){ console.log("Error fetching the local storage of a frame"); }
    
    try{
        await databaseAPI.saveLocalStorage(crawlID, browser, URL, "localStorage", frame.url(), localStorage, connection) // NOTE TO SELF: using frame.url() because frame.origin() does not seem to exist
    } catch(error){ console.log("Error with saving the cookies of the page to the database"); }

    const childFrames = frame.childFrames();
    for (const childFrame of childFrames) {
      await getLocalStorageRecursive(page, browser, URL, childFrame);
    }
}

async function getLocalStorage(page, browser, URL){
    const mainFrame = await page.mainFrame();
    await getLocalStorageRecursive(page, browser, URL, mainFrame)
}

async function crawl(browserList, resultPath){
    try{
        // 1) Set up database connection
        await databaseAPI.establishConnection(connection); 

        // 2) Create URL List
        // const URL_list = await selectWebsites.getFirstURLs(NUM_URLS);
        const URL_list = ["https://www.pinterest.com/"]

        // 3) Loop through browsers
        for(let browser of browserList){
            // MAYBE REMOVE LATER
            resultPath = resultPath+"/"+browser;

            let browserInstance;
            try{ 
                browserInstance = await createBrowserInstance.createBrowserInstance(browser);
            } catch{
                await databaseAPI.endConnection(connection);
                process.exit(1);
            }

            
            try{ // Here to ensure the BrowserInstance closes in case of an error
                
                // This gets rid of the about::blank page
                let pages = await browserInstance.pages();
                let page = pages[0];
                // let page = await incognitoContext.newPage();
            
                // Loop through URLs
                for(let URL of URL_list){
                    console.log(URL);
                    const siteName = await selectWebsites.getSiteNames(URL);
                    
                    if(browser == 'Google Chrome' || browser == 'Brave'){
                        await getResponses(page, browser, URL);
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
                            page = await browserInstance.newPage();
                        }
                        else{ console.log("Error visiting webpage:", URL); }
                        continue;
                    }                
                    
                    await getScreenshot(page, resultPath, siteName);
                    await getHTML(page, resultPath, siteName);
                    await getCookies(page, browser, URL);
                    await getLocalStorage(page, browser, URL);
                } // End-loop for all URLs

            await page.close();
            await browserInstance.close();
            console.log(browser + " instance closed.")

            } catch(error){ // Here to ensure the BrowserInstance closes in case of an error
                console.log(error);
                try{
                    await browserInstance.close();
                    console.log("BrowserInstance closed in error handling.")
                } catch(error) { console.log("BrowserInstance has already been closed.") }
            }

        } // End-loop for all browsers
    
        await databaseAPI.endConnection(connection);
    
    } catch(error){ // Here to ensure the DatabaseConnection closes in case of an error
        console.log(error);
        await databaseAPI.endConnection(connection);
    }
}


async function main(){
    // Eventually get args passed into main
    let browserList = ['Google Chrome'] ;
    let vantagePoint = ['UK'];
    let NUM_URLS = 100;
    let resultsPath = await createResultFolder(vantagePoint, browserList);
    // test(browserList, testPath); --> create this that queries SannyBot & checks for IP address and outputs the result in a folder to make sure everything is fine with the crawler.
    await crawl(browserList, resultsPath);
}

main();