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


async function testCrawler(browserList, vantagePoint){
    resultPath = await createResultFolder(browserList, vantagePoint, true);

    // Tests bot detection + proxy (IP)
    await crawl(browserList, resultPath, ["https://bot.sannysoft.com", 
                "https://www.whatismyipaddress.com"], vantagePoint, null, true);
}


/* Note to self: I think we'll run this file for one browser at a time, so prob would be good to change the name of BrowserList and to remove the loops*/
async function createResultFolder(browserList, vantagePoint, test = false){
    let date= new Date();

    // Saving the data to OneDrive, which doesn't allow some chars (":","/") in filename.
    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
        hour12: false,
        hourCycle: 'h23'
      };
      const formattedDate = date.toLocaleString('en-GB', options);
      const formattedDateWithoutColons = formattedDate.replace(/:/g, '-');
    
    let path = `/Users/philippe/Library/CloudStorage/OneDrive-Personal/cookie-banners-results/${formattedDateWithoutColons}`; 
    if(test){
        path = `/Users/philippe/Library/CloudStorage/OneDrive-Personal/cookie-banners-results/test/${formattedDateWithoutColons}`; 
    }
    await fs.mkdir(path);
    
    path = path+`/${vantagePoint}`; 
    await fs.mkdir(path);

    for(let browser of browserList){
        let newPath = path+`/${browser}`;
        await fs.mkdir(newPath)

        // TBD
        let screenshotPath = newPath + "/screenshots";
        await fs.mkdir(screenshotPath)

        if(! test){
            let HTMLPath = newPath + "/htmlFiles";
            await fs.mkdir(HTMLPath)
        }
    }
    return path; // probably return "new path" once confirmed we only do 1 browser
}


async function getResponses(page, browser, URL, connection){
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
    const client = await page.target().createCDPSession();
    const cookies = (await client.send('Storage.getCookies'));
    try{
        await databaseAPI.saveCookies(crawlID, browser, URL, "cookies", cookies, connection)
    } catch(error){ console.log("Error with saving the cookies of the page to the database"); 
    console.log(error); }
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
    } catch(error){ console.log("Error fetching the local storage of a frame"); }
    
    try{
        await databaseAPI.saveLocalStorage(crawlID, browser, URL, "localStorage", frame.url(), localStorage, connection) // NOTE TO SELF: using frame.url() because frame.origin() does not seem to exist
    } catch(error){ console.log("Error with saving the localStorage of the page to the database"); 
    console.log(error); }

    const childFrames = frame.childFrames();
    for (const childFrame of childFrames) {
      await getLocalStorageRecursive(page, browser, URL, childFrame);
    }
}


async function getLocalStorage(page, browser, URL){
    const mainFrame = await page.mainFrame();
    await getLocalStorageRecursive(page, browser, URL, mainFrame)
}


async function crawl(browserList, resultPath, URL_list, vantagePoint, connection = null, test = false){
    for(let browser of browserList){
        // MAYBE REMOVE LATER
        resultPath = resultPath+"/"+browser;

        let browserInstance, pages, page;
        try{ 
            browserInstance = await createBrowserInstance.createBrowserInstance(browser, vantagePoint);
        } catch{
            return; // Exit if fail to create browser instance
        }

        try{ // Closes BrowserInstance in case of an unhandled error
            
            // This gets rid of the about::blank page
            pages = await browserInstance.pages();
            page = pages[0];
        
            // Loop through URLs
            for(let URL of URL_list){
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
                        page = await browserInstance.newPage();
                    } else{ console.log("Error visiting webpage:", URL); }
                    continue;
                }                
                
                await getScreenshot(page, resultPath, siteName);

                if(! test){
                    await getHTML(page, resultPath, siteName);
                    await getCookies(page, browser, URL, connection);
                    await getLocalStorage(page, browser, URL, connection);
                }
            }
        } catch(error){ // Here to ensure the BrowserInstance closes in case of an error
            console.log(error);
            await page.close();
            await browserInstance.close();
            console.log("BrowserInstance closed in error handling.")
            return;
        }

        await page.close();
        await browserInstance.close();
        console.log(browser + " instance closed.")
    }
}


async function main(){
    // Eventually get args passed into main
    let browserList = ['Google Chrome'] ;
    let vantagePoint = ['UK'];
    let NUM_URLS = 100;
    
    // Test the parameters
    await testCrawler(browserList, vantagePoint);

    // Set up result folder for crawl
    let resultPath = await createResultFolder(browserList, vantagePoint);
    
    // Get websites list
    // const URL_list = await selectWebsites.getFirstURLs(NUM_URLS);
    const URL_list = ['https://www.nytimes.com'];

    // Set up Database connection
    await databaseAPI.establishConnection(connection); 
    
    // Crawl
    await crawl(browserList, resultPath, URL_list, vantagePoint, connection);

    // Close database connection
    await databaseAPI.endConnection(connection);
}

main();