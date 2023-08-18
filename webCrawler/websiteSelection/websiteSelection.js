import {createReadStream} from 'fs';
// import {parse} from "csv-parse";

export async function TXTtoArray(path){
  /* Read in a TXT file at path path.
    Modifies URL format to "https://www.sitename.tld"
    Returns the array of URLs. */

    return new Promise((resolve, reject) => {
      let myURLs = [];
      createReadStream(path, 'utf8')
        .on("data", function (chunk) {
          // Split the chunk into lines and process each line
          const lines = chunk.split('\n');
          lines.forEach(line => {
            const parts = line.split(',');
            if (parts.length === 2) { // Ensure the line is of form ID, sitename
              const siteName = parts[1].trim(); // Get sitename
              if (siteName !== "") { // Exclude empty site names
                myURLs.push("https://www." + siteName);
              }
            }
          });
        })
        .on("end", function () {
          resolve(myURLs);
        })
        .on("error", function (error) {
          console.log(error.message);
          reject(error);
        });
    });
}  

async function getTimedOutUrls(browser){
  // Exclude websites that have timed out more than 3 times.
  let path;
  if(browser == 'Firefox'){ path = 'webCrawler/websiteSelection/timeouts/FirefoxTimeout.txt';}
  else if(browser == 'Ghostery') {path = 'webCrawler/websiteSelection/timeouts/GhosteryTimeout.txt';}
  else if (browser == 'Brave') {path = 'webCrawler/websiteSelection/timeouts/BraveTimeout.txt'; }
  else if (browser == 'Google Chrome') {path = 'webCrawler/websiteSelection/timeouts/Google ChromeTimeout.txt';}
  
  return new Promise((resolve, reject) => {
    let myURLs = {};
    createReadStream(path, 'utf8')
      .on("data", function (chunk) {
        // Split the chunk into lines and process each line
        const lines = chunk.split('\n');
        lines.forEach(line => {
            if (siteName !== "") { // Exclude empty site names
              let value = myURLs[siteName];
              myURLs[siteName] = value + 1;
          }
        });
      })
      .on("end", function () {
        // keep only those that timedout less than 3 times
        let lessthan3 = [];
        for (const key of Object.keys(myURLs)) { 
          if( myURLs[key] < 3 ) { lessthan3.push(key); }
        }
        resolve(lessthan3); 
      })
      .on("error", function (error) {
        console.log(error.message);
        reject(error);
      });
    });
}

export async function getURLs(totalNumber, startNumber, browser, path){
  let data = await TXTtoArray(path);

  let newUrls = data.slice(Number(startNumber),Number(totalNumber));
  let timeouts = await getTimedOutUrls(browser);
  newUrls.push(timeouts);
  return newUrls
}

export async function getSiteNames(url){
  /* Takes a single input and returns the name of the site
  Following the format of the (modified) top-1m tranco list 
  https://www.SITENAME.com
  */
  const nameArray = await url.split(".");
  const excludeFirstTerm = nameArray.slice(1);
  const nameValue = excludeFirstTerm.join("_");

  return nameValue;
}