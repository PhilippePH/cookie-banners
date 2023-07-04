const fs = require("fs");
const { parse } = require("csv-parse");

async function CSVtoArray(){
  return new Promise((resolve, reject) => {
    var myURLs = [];
    fs.createReadStream("./top-1m.csv")
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

module.exports = {getFirstURLs};