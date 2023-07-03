const selectWebsites = require('./websiteSelection');
const createBrowser = require('./browser');
const databaseAPI = require('./db');
const puppeteer = require("puppeteer-core"); // tbd if we use this one for non-Chrome?????????????????????????
const puppeteer_extra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const mysql = require('mysql2');


// register `puppeteer-extra` plugins.
puppeteer_extra.use(StealthPlugin()); // allows to pass all tests on SannySoft, even if not *actually* in headfull mode

const crawlID = Date.now();
const NUM_URLS = 5;
// const browser_list = ['Brave'] ;
const browser_list = ['Firefox'] ; // --> FOR FIREFOX, with my settings, it is possible some request never get answered (hence load failing) --> ex.: A request for a font never resolves, which leads to the load event never being fired. This leads to puppeteer throwing a timeout error.

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
    // '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    // '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Firefox.app/Contents/MacOS/firefox',
    // '/Applications/Firefox Nightly.app/Contents/MacOS/firefox' // nightly
    // '/Applications/Ghostery Private Browser.app/Contents/MacOS/Ghostery',
    // '/Applications/DuckDuckGo.app/Contents/MacOS/DuckDuckGo', // add it to browser list when ready
];

const userDir = [
    '/Users/philippe/Library/Application Support/BraveSoftware/Brave-Browser/Default' 
//     '/Users/philippe/Documents/code/cookie-banners/userDataProfile',
//     // '/Users/philippe/Library/Application Support/Google/Chrome/Profile 4', // Found at : chrome://version/
//     // '/Library/Application Support/Google/Chrome',
//     // '/Library/Application Support/Mozilla'
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
    const URL_list = ["https://www.facebook.com/"];
    
    for(let j = 0; j < browser_list.length; j++){
        console.log(executable_path[j]);
        let browserInstance;
        
        if(browser_list[j] == 'Chrome'){ // Uses stealth plugin
            browserInstance = await puppeteer_extra.launch({
                headless: false,
                executablePath: executable_path[j],
                // userDataDir: userDir[j],

                args: [
                    '--start-maximized', // browser takes whole screen. 
                    // '--user-data-dir = /Users/philippe/Documents/code/cookie-banners/userDataProfile',
                    // --proxy-server = x.x.x.x:xxxx // this can be used to specify the IP address
                ]

                // unsure what that would do:
                //ignoreDefaultArgs: ['--enable-automation'],
                // args: ['--disable-blink-features=AutomationControlled'],
            });
        }
        /* THIS WORKS -- CRAWL + PROFILE */
        else if(browser_list[j] == 'Brave'){ // Uses stealth plugin
            console.log("Using brave settings");
            browserInstance = await puppeteer_extra.launch({
                headless: false,
                executablePath: executable_path[j],
                userDataDir: '/Users/philippe/Library/Application Support/BraveSoftware/Brave-Browser', // Found at : brave://version/ (take parent directory)
                args: [ '--start-maximized' ] // browser takes whole screen. 
            });
        }
        else if(browser_list[j] == 'Firefox'){ // Does not use stealth plugin
            browserInstance = await puppeteer.launch({
                headless: false,
                product: 'firefox',
                executablePath: executable_path[j],
                userDataDir: '/Users/philippe/Library/Application Support/Firefox/Profiles/sh5n5qfy.default', // found at about:profiles
                // ** NOTE THAT STILL NEEDS TO ADD CORRECT SETTINGS IN THAT PROFILE

                
                // defaultViewport: null,
                // args: ['--no-sandbox', '--start-maximized'],
                // args: [
                //     '--wait-for-browser' // https://github.com/puppeteer/puppeteer/issues/5958 -- unclear what it does though..
                //     ],
                // ignoreDefaultArgs: ['--enable-automation'],
                // extraPrefsFirefox: {
                //     'marionette': true,
                // }
            });
        }
        // else{

        // }
        
        // const page = await browserInstance.newPage();
        const pages = await browserInstance.pages();
        const page = pages[0];

        // loop through URLs
        for(let i = 0; i < URL_list.length; i++){
            let URL = URL_list[i];
            console.log(URL);
            try{
                
                /* HTTP Requests Intercept -- the data (currently) gathered doesn't look very interesting (limited information).
                Would probably need to collect more granular data. 

                // Prepare intercepts
                await page.setRequestInterception(true);
                page.on('request', interceptedRequest => {
                if (!interceptedRequest.isInterceptResolutionHandled()){
                    console.log("Intercepting request");
                    // console.log(interceptedRequest);
                    
                    const requestDataQuery = 'INSERT INTO request_data (crawlID, browser, url, request) VALUES (?, ?, ?, ?)';
                    const requestData = [
                        crawlID,
                        browser_list[j],
                        URL,
                        interceptedRequest
                        ];
                    
                        connection.query(requestDataQuery, requestData, (error, results) => {
                        if (error) {
                            console.error('Error inserting data: ', error);
                        } else {
                            console.log('Request headers inserted successfully!');
                        }
                        });
                    interceptedRequest.continue();
                  }
                });
                */


                await page.goto(URL,
                    {
                    timeout: 10000,
                    waitUntil: "domcontentloaded", // either domcontentloaded,networkidle0, networkidle2 -- domcontentloaded seems to be too quick, not all banners appear
                }
                );
                // await page.screenshot({path: "./screenshots/"+i+"on"+j+".png"});
                // await page.waitForNetworkIdle();
                // Downloads the HTML of the website
                const html_contents = await page.content()
                const HTMLDataQuery = 'INSERT INTO html_data (crawlID, browser, url, html) VALUES (?, ?, ?, ?)';
                const htmlData = [
                    crawlID,
                    browser_list[j],
                    URL,
                    html_contents
                ]
                connection.query(HTMLDataQuery, htmlData, (error, results) => {
                    if (error) {
                        console.error('Error inserting data: ', error);
                    } else {
                        console.log('HTML inserted successfully!');
                    }
                    });

                // Downloads the cookies of the website --> eventually put that in a different function99
                let pageCookies = await page.cookies();
                
                const cookieDataQuery = 'INSERT INTO cookie_data (crawlID, browser, URL, name, value, domain, path, expires, size, httpOnly, secure, session, sameSite, sameParty, sourceScheme, sourcePort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                  
                for(let i = 0; i < pageCookies.length; i++){ // later on see if we can do a "batch add" and add all the lines at once (assuming its faster to do only 1 query)
                    const cookieData = [
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
                
                    connection.query(cookieDataQuery, cookieData, (error, results) => {
                    if (error) {
                        console.error('Error inserting data: ', error);
                    } else {
                        console.log('Cookies inserted successfully!');
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