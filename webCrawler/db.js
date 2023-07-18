const mysql = require('mysql2');

async function establishConnection(connection){
  return new Promise((resolve, reject) => {
    connection.connect(function(err) {
      if (err) {
        return console.error('error: ' + err.message);
      }
      else{
        console.log('Connected to the MySQL server.');
        resolve();
      }
    });
  });
}

async function endConnection(connection){
  return new Promise((resolve, reject) => {
    connection.end(function(err) {
      if (err) {
        return console.log('error:' + err.message);
      } else{
      console.log('Close the database connection.');
      resolve();
      }
    });
  });
}

async function saveCookies(crawlID, browser, URL, storageType, cookies, connection){
  const cookieDataQuery = 'INSERT INTO storage_data (crawlID, browser, websiteURL, storageType, frameURL, name, value, cookieDomain) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'; 
  // for(let i = 0; i < cookies.length; i++){ // later on see if we can do a "batch add" and add all the lines at once (assuming its faster to do only 1 query)
  
  if (!Array.isArray(cookies.cookies)) {
    console.error('Invalid cookies data:', cookies.cookies);
    return; // or throw an error if desired
  }

  const promises = cookies.cookies.map((cookie) => {
      const cookieData = [
          crawlID,
          browser,
          URL,
          storageType,
          null,
          cookie.name,
          cookie.value,
          cookie.domain,
          ];

        return new Promise((resolve, reject) => {
        connection.query(cookieDataQuery, cookieData, (error, results) => {
        if (error) {
            console.error('Error inserting data: ', error);
            reject();
        } else{
          resolve();
        }
        });
      });
  });
  await Promise.all(promises);
}


async function saveLocalStorage(crawlID, browser, URL, storageType, frameURL, localStorage, connection){
  const localStorageDataQuery = 'INSERT INTO storage_data (crawlID, browser, websiteURL, storageType, frameURL, name, value, cookieDomain) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

  const promises = Object.keys(localStorage).map((key) => {
    const value = localStorage[key];
    const localStorageData = [
          crawlID,
          browser,
          URL,
          storageType,
          frameURL,
          key,
          value,
          null,
          ];
          
      return new Promise((resolve, reject) => {
        connection.query(localStorageDataQuery, localStorageData, (error, results) => {
        if (error) {
            console.error('Error inserting data: ', error);
            reject();
        }
        else{
          resolve();
        }  
        });
      });
  });
  await Promise.all(promises);
}

async function saveResponses(crawlID, browser, URL, interceptedResponse, connection){
  const responseDataQuery = 'INSERT INTO response_data (crawlID, browser, url, specific_url, content_type, content_length) VALUES (?, ?, ?, ?, ?, ?)';
  const responseData = [
      crawlID,
      browser,
      URL,
      interceptedResponse.url(),
      interceptedResponse.headers()['content-type'],
      interceptedResponse.headers()['content-length']
      ];

      return new Promise((resolve, reject) => {
        connection.query(responseDataQuery, responseData, (error, results) => {
          if (error) {
              console.error('Error inserting HTTP responses in the database. Error message: \n ', error);
              // reject();
          }
          else{
            resolve();
          }
        });
      });
}


module.exports = {
  saveCookies,
  saveResponses,
  endConnection,
  establishConnection,
  saveLocalStorage
  };