const fs = require("fs");
const { parse } = require("csv-parse");

async function CSVtoArray(){
  return new Promise((resolve, reject) => {
    var myURLs = [];
    fs.createReadStream("./webCrawler/top-1m.csv")
      .pipe(parse({ delimiter: ","}))
      .on("data", function (row) {
        // console.log(row[1]);
        myURLs.push("https://"+row[1]);
        // console.log(myURLs);
      })
      .on("end", function () {
        console.log("finished");
        resolve(myURLs);
      })
      .on("error", function (error) {
        console.log(error.message);
        reject(error);
      });
    });
  }

async function getFirstURLs(number){
  let data = await CSVtoArray();
  // console.log(data);
  // console.log(data.slice(0, number+1));
  return data.slice(0,number+1);
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