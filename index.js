const selectWebsites = require('./websiteSelection');
const createBrowser = require('./browser');
const databaseAPI = require('./db');
const puppeteer = require("puppeteer-core"); 
const puppeteer_extra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const mysql = require('mysql2');

// register `puppeteer-extra` plugins (only for chromium)
puppeteer_extra.use(StealthPlugin()); // allows to pass all tests on SannySoft, even if not in headfull mode

// Default values
let browserList = ['Firefox'] ;
let NUM_URLS = 1;

/* // Treat input for browser list and num_url (if no input, use default values)
var argv = require('minimist')(process.argv.slice(2));
console.log(argv);

// Create browser list
const browser_list = argv ; */

const crawlID = Date.now();

const executablePaths = {
    'Google Chrome' : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'Brave' : '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    'Firefox' : '/Applications/Firefox.app/Contents/MacOS/firefox',
    'Ghostery' : '/Applications/Ghostery Private Browser.app/Contents/MacOS/Ghostery',
    'DuckDuckGo' : '/Applications/DuckDuckGo.app/Contents/MacOS/DuckDuckGo'
};

const userProfiles = {
    'Google Chrome' : '',
    'Brave' : '/Users/philippe/Library/Application Support/BraveSoftware/Brave-Browser',
    'Firefox' : '/Users/philippe/Library/Application Support/Firefox/Profiles/sh5n5qfy.default',
    'Ghostery' : '',
    'DuckDuckGo' : ''
};

// Connection to the database server
const dbConnection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'I@mastrongpsswd',
    database: 'CrawlData',
  });

async function crawl(browserList){
    // 1) Set up database connection
    dbConnection.connect(function(err) {
        if (err) {
          return console.error('error: ' + err.message);
        }
        console.log('Connected to the MySQL server.');
      });

    // 2) Create URL List
    // const URL_list = await selectWebsites.getFirstURLs(NUM_URLS);
    const URL_list = ['https://facebook.com'];
    
    for(let browser of browserList){
        console.log("Browser: " + browser + ". At path: " + executablePaths[browser]);
        let browserInstance;
        
        if(browser == 'Google Chrome'){
            // Uses puppeteer_extra (stealth plugin)
            browserInstance = await puppeteer_extra.launch({ 
                headless: false,
                executablePath: executablePaths[browser],
                args: [ '--start-maximized' ]
                // unsure what that would do:
                //ignoreDefaultArgs: ['--enable-automation'],
                // args: ['--disable-blink-features=AutomationControlled'
                // '--user-data-dir = /Users/philippe/Documents/code/cookie-banners/userDataProfile',
                // --proxy-server = x.x.x.x:xxxx] // this can be used to specify the IP address
            });
        }
        else if(browser == 'Brave'){
            // Uses puppeteer_extra (stealth plugin)
            browserInstance = await puppeteer_extra.launch({
                headless: false,
                executablePath: executablePaths[browser],
                userDataDir: userProfiles[browser], // Found at : brave://version/ (take parent directory)
                args: [ '--start-maximized' ]
            });
        }
        else if(browser == 'Firefox'){ 
            // Does not use stealth plugin
            browserInstance = await puppeteer.launch({
                headless: false,
                product: 'firefox',
                executablePath: executablePaths[browser],
                userDataDir: userProfiles[browser], // found at about:profiles
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
        else if(browser == 'Ghostery'){ 
            // Does not use stealth plugin
            browserInstance = await puppeteer.launch({
                headless: false,
                executablePath: executablePaths[browser],
                userDataDir: userProfiles[browser], // found at about:profiles
                // ** NOTE THAT STILL NEEDS TO ADD CORRECT SETTINGS IN THAT PROFILE
            });
        }
        else if(browser == 'DuckDuckGo'){}

        // This gets rid of the about::blank page
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
                    browser,
                    URL,
                    html_contents
                ]
                dbConnection.query(HTMLDataQuery, htmlData, (error, results) => {
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
                        browser,
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
                
                    dbConnection.query(cookieDataQuery, cookieData, (error, results) => {
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
    dbConnection.end(function(err) {
        if (err) {
          return console.log('error:' + err.message);
        }
        console.log('Close the database connection.');
      });
}

crawl(browserList);