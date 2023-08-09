import {createReadStream} from 'fs';
import {parse} from "csv-parse";

export async function CSVtoArray(path){
  /* Read in a CSV file at path path.
    Modifies URL format to "https://www.sitename.tld"
    Returns the array of URLs. */

  return new Promise((resolve, reject) => {
    let myURLs = [];
    createReadStream(path)
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

export async function getFirstURLs(number, path){
  let data = await CSVtoArray(path);

  return data.slice(0,Number(number));
}

export async function getSiteNames(url){
  /* Takes a single input and returns the name of the site
  Following the format of the (modified) top-1m tranco list 
  https://www.SITENAME.com
  */
  const nameArray = await url.split(".");
  return nameArray[1];
}