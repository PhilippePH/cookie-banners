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



async function crawl(browserList, resultPath){
    try{
        // 1) Set up database connection
        databaseAPI.establishConnection(connection); 

        // 2) Create URL List
        // const URL_list = await selectWebsites.getFirstURLs(NUM_URLS);
        const URL_list = ["https://bot.sannysoft.com/"]

        // 3) Loop through browsers
        for(let browser of browserList){
            // MAYBE REMOVE LATER
            resultPath = resultPath+"/"+browser;

            let browserInstance;
            // let incognitoContext;
            try{ 
                browserInstance = await createBrowserInstance.createBrowserInstance(browser);
                // incognitoContext = await browserInstance.createIncognitoBrowserContext();
            } catch{
                databaseAPI.endConnection(connection);
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

                    try{
                        if(browser == 'Google Chrome' || browser == 'Brave'){
                            // Prepare intercepts
                            await page.setRequestInterception(true);
                            await page.on('request', interceptedRequest => {
                            if (!interceptedRequest.isInterceptResolutionHandled()){
                                databaseAPI.saveRequests(crawlID, browser, URL, interceptedRequest, connection)
                                interceptedRequest.continue();
                            }
                            });
                        }
                    } catch(error){ console.log("Error collecting HTTP headers"); }
                    
                    try{   
                        await page.goto(URL,{
                            timeout: 10000,
                            waitUntil: "load", 
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
                    try{ // Screenshot 
                        await page.screenshot({
                            path: resultPath + `/screenshots/${siteName}.jpeg`,
                            type: "jpeg",
                            quality: 50,
                        });
                    } catch(error){ console.log("Error with the screenshot"); }
                    try{
                        // Downloads the HTML of the website and saves it to a file
                        const htmlContent = await page.content();
                        const fileName = resultPath+`/htmlFiles/${siteName}.html`;
                        const writeFileAsync = promisify(fs.writeFile);
                        writeFileAsync(fileName, htmlContent); // I REMOVED THE ASYNC HERE....
                    } catch(error){ console.log("Error with saving the HTML of the page to a file"); }

                    try{
                        // Downloads the cookies of the website --> eventually put that in a different function99
                        let pageCookies = await page.cookies();
                        databaseAPI.saveCookies(crawlID, browser, URL, pageCookies, connection)
                    } catch(error){ console.log("Error with saving the cookies of the page to the database"); }

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
    
        databaseAPI.endConnection(connection);
    
    } catch(error){ // Here to ensure the DatabaseConnection closes in case of an error
        console.log(error);
        databaseAPI.endConnection(connection);
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