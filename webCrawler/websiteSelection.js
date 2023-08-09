import {createReadStream} from 'fs';
import {parse} from "csv-parse";

export async function TXTtoArray(path){
  /* Read in a TXT file at path path.
    Modifies URL format to "https://www.sitename.tld"
    Returns the array of URLs. */

    return new Promise((resolve, reject) => {
      let myURLs = [];
      createReadStream(path, 'utf8') // Open the file in UTF-8 encoding
        .on("data", function (chunk) {
          // Split the chunk into lines and process each line
          const lines = chunk.split('\n');
          lines.forEach(line => {
            if (line.trim() !== "") { // Exclude empty lines
              myURLs.push(line.trim());
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

export async function getFirstURLs(number, path){
  let data = await TXTtoArray(path);

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