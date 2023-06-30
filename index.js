const selectWebsites = require('./websiteSelection');
const createBrowser = require('./browser');
const databaseAPI = require('./db');
// const puppeteer = require("puppeteer");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const mysql = require('mysql2');


// register `puppeteer-extra` plugins.
puppeteer.use(StealthPlugin()); // allows to pass all tests on SannySoft, even if not *actually* in headfull mode

const crawlID = Date.now();
const NUM_URLS = 5;
const browser_list = ['Chrome', 'Brave', 'Firefox', 'Ghostery'] ;
// const browser_list = ['ddg'] ;

/* NOTE: for Brave: (similar for Ghostery -- need to save the settings)
You need to set/create a profile and point the userDataDir option to it because 
Brave downloads the filter lists the first time it launches and stores those lists in the profile. */

/* NOTE: For Chrome and Brave: the browser app must NOT BE OPEN, otherwise it won't work */

/* TBD: If I use these exec path, I think we need to make sure they use a clean slate everytime..
    Since those are my apps, I think they remember some stuff (like not closing correctly + history) */

/* ISSUE: On every browser, multiple pages are being opened -->> this is due to the stealth plugin (or the use of puppeteer extra), but doesn't do it on the "regular" one
    They are mostly AutomationControlled pages (Firefox/Ghostery) or the dev profile (see below)
    */

/* *****ISSUE: Navigation timeout everytime on Friefox + Ghostery... Something tells me I need to exit differently
    since they maybe don't send the same signal as Chrome / Brave???
    
    Also, the webdriver flag isn't hidden like it is for Chrome+Brave -- from Bot.SannySoft
    
    Actually, even the size of the webpage doesn't follow directions...
    
    Issue persists with Firefox Nightly (using product: firefox) & when using the exec path*/


const executable_path = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Firefox.app/Contents/MacOS/firefox',
    '/Applications/Ghostery Private Browser.app/Contents/MacOS/Ghostery',
    // '/Applications/DuckDuckGo.app/Contents/MacOS/DuckDuckGo', // add it to browser list when ready
];

const userDir = [
    '/Users/philippe/Documents/code/cookie-banners/userDataProfile',
    // '/Users/philippe/Library/Application Support/Google/Chrome/Profile 4',
    // '/Library/Application Support/Google/Chrome',
    // '/Library/Application Support/Mozilla'
];

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'I@mastrongpsswd',
    database: 'CrawlData',
  });

async function crawl(browser_list){
    // set up database connection
    connection.connect(function(err) {
        if (err) {
          return console.error('error: ' + err.message);
        }
      
        console.log('Connected to the MySQL server.');
      });

    // set up URL List
    // const URL_list = await selectWebsites.getFirstURLs(NUM_URLS);
    const URL_list = ["https://bot.sannysoft.com/"];
    
    for(let j = 0; j < browser_list.length; j++){
        console.log(executable_path[j]);
        
        let browserInstance;


        if(browser_list[j] == 'Chrome' || browser_list[j] == 'Brave'){

            browserInstance = await puppeteer.launch({
                headless: false,
                executablePath: executable_path[j],

                // Chrome (Chromium?) specific settings
                // userDataDir: userDir[j],
                args: [
                    '--start-maximized', // browser takes whole screen. 
                    // '--user-data-dir = /Users/philippe/Documents/code/cookie-banners/userDataProfile',
                    // --proxy-server = x.x.x.x:xxxx // this can be used to specify the IP address
                ]
            });
        }

        else{
            browserInstance = await puppeteer.launch({
                headless: false,
                executablePath: executable_path[j],
            });
        }
    
        const page = await browserInstance.newPage();

        // loop through URLs
        for(let i = 0; i < URL_list.length; i++){
            let URL = URL_list[i];
            console.log(URL);
            try{
                await page.goto(URL,{
                    timeout: 10000,
                    waitUntil: "networkidle0", // either domcontentloaded,networkidle0, networkidle2 -- domcontentloaded seems to be too quick, not all banners appear
                });
                
                await page.screenshot({path: "./screenshots/"+i+"on"+j+".png"});
                let pageCookies = await page.cookies();
                // console.log(pageCookies);

                // await databaseAPI.saveCookies(URL, pageCookies);
                // find how to put this in the db.js file and transfer the connection
                const insertDataQuery = 'INSERT INTO cookie_data (crawlID, browser, URL, name, value, domain, path, expires, size, httpOnly, secure, session, sameSite, sameParty, sourceScheme, sourcePort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                  
                for(let i = 0; i < pageCookies.length; i++){ // later on see if we can do a "batch add" and add all the lines at once (assuming its faster to do only 1 query)
                    const data = [
                        crawlID,
                        browser_list[j],
                        URL,
                        pageCookies[i].name,
                        pageCookies[i].value,
                        pageCookies[i].domain,
                        pageCookies[i].path, 
                        pageCookies[i].expires, 
                        pageCookies[i].size, 
                        pageCookies[i].httpOnly, 
                        pageCookies[i].secure, 
                        pageCookies[i].session, 
                        pageCookies[i].sameSite, 
                        pageCookies[i].sameParty, 
                        pageCookies[i].sourceScheme, 
                        pageCookies[i].sourcePort
                        ];
                
                    connection.query(insertDataQuery, data, (error, results) => {
                    if (error) {
                        console.error('Error inserting data: ', error);
                    } else {
                        console.log('Data inserted successfully!');
                    }
                    });
                }
            } catch(error){
                console.log(error);
            }
        }
    
    await browserInstance.close();
    }
    connection.end(function(err) {
        if (err) {
          return console.log('error:' + err.message);
        }
        console.log('Close the database connection.');
      });
}

crawl(browser_list);