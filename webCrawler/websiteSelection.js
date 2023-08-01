const fs = require("fs");
const { parse } = require("csv-parse");

async function randomiseURLs(path){
  /* This function breaks down the input into three thirds.
      The values within each thirds are shuffled.
      They are then put back into one list, with a value from the first third,
      second third and third third being added in order (and so on).
    
      This outputs a txt file with one URL on each line. */

    let myURLs = await CSVtoArray(path);
    
    let thirdLength = myURLs.length / 3;
    
    let firstThird = myURLs.slice(0, thirdLength);
    let secondThird = myURLs.slice(thirdLength + 1, thirdLength * 2);
    let thirdThird = myURLs.slice(thirdLength * 2 + 1, myURLs.length);

    
}

// randomiseURLs("./webCrawler/top-1m.csv");

async function CSVtoArray(path){
  /* Read in a CSV file at path path.
    Modifies URL format to "https://www.sitename.tld"
    Returns the array of URLs. */

  return new Promise((resolve, reject) => {
    let myURLs = [];
    fs.createReadStream(path)
      .pipe(parse({ delimiter: ","}))
      .on("data", function (row) {
        myURLs.push("https://www."+row[1]);
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

async function getFirstURLs(number, path){
  let data = await CSVtoArray(path);

  return data.slice(0,Number(number));
}

async function getSiteNames(url){
  /* Takes a single input and returns the name of the site
  Following the format of the (modified) top-1m tranco list 
  https://www.SITENAME.com
  */
  const nameArray = await url.split(".");
  return nameArray[1];
}

module.exports = {getFirstURLs, getSiteNames};