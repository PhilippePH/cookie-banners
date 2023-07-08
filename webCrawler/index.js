const selectWebsites = require('./websiteSelection');
const createBrowserInstance = require('./browser');
const databaseAPI = require('./db');
const mysql = require('mysql2');
const fs = require('fs');
const { promisify } = require('util');

let browserList = ['Firefox'] ;
let NUM_URLS = 100;
const crawlID = Date.now();

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'I@mastrongpsswd',
    database: 'CrawlData',
  });

async function crawl(browserList){
    // 1) Set up database connection
    databaseAPI.establishConnection(connection); 

    // 2) Create URL List
    const URL_list = await selectWebsites.getFirstURLs(NUM_URLS);
    // const URL_list = ["https://www.ebay.com", "https://nytimes.com"]
    // 3) Loop through browsers
    for(let browser of browserList){
        const browserInstance = await createBrowserInstance.createBrowserInstance(browser);
        
        // This gets rid of the about::blank page
        const pages = await browserInstance.pages();
        const page = pages[0];

        // Loop through URLs
        for(let URL of URL_list){
            console.log(URL);

            try{
                if(browser == 'Google Chrome' || browser == 'Brave'){
                    // Prepare intercepts
                    await page.setRequestInterception(true);
                    await page.on('request', interceptedRequest => {
                    if (!interceptedRequest.isInterceptResolutionHandled()){
                        // console.log('Request headers:', interceptedRequest.headers());
                        databaseAPI.saveRequests(crawlID, browser, URL, interceptedRequest, connection)
                        interceptedRequest.continue();
                    }
                    });
                }
            } catch(error){
                console.log("Error collecting HTTP headers");
                // console.log(error);
            }
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
                console.log("Error visiting webpage:", URL);
                // console.log(error);
            }

            // Calculate page load time
            // To DO

            try{
                // Screenshot
                const siteName = await selectWebsites.getSiteNames(URL);
                await page.screenshot({
                    path: './webCrawler/screenshots/'+browser+'_'+siteName+'.jpeg',
                    type: "jpeg",
                    quality: 50,
                });
            } catch(error){
                console.log("Error with the screenshot");
            }
            try{
                // Downloads the HTML of the website and saves it to a file
                const htmlContent = await page.content();
                const fileName = `html_files/${browser}_${siteName}.html`;
                const writeFileAsync = promisify(fs.writeFile);
                await writeFileAsync(fileName, htmlContent);
            } catch(error){
                console.log("Error with saving the HTML of the page to a file");
            }
            try{
                // Downloads the cookies of the website --> eventually put that in a different function99
                let pageCookies = await page.cookies();
                databaseAPI.saveCookies(crawlID, browser, URL, pageCookies, connection)
            } catch(error){
                console.log("Error with saving the cookies of the page to the database");
            }
        } // Loop for all URLs
    await browserInstance.close();
    } // Loop for all browsers
    databaseAPI.endConnection(connection);
}
crawl(browserList);