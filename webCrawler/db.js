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

async function saveCookies(crawlID, browser, URL, storageType, frameURL, cookies, connection){
  const cookieDataQuery = 'INSERT INTO storage_data (crawlID, browser, websiteURL, storageType, frameURL, name, value, cookieDomain) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'; 
  
  const promises = cookies.map((item) => {
    const cookieData = [
          crawlID,
          browser,
          URL,
          storageType,
          frameURL,
          item.name,
          item.value,
          item.domain,
          ];

        return new Promise((resolve, reject) => {
        connection.query(cookieDataQuery, cookieData, (error, results) => {
          if (error) { reject( new Error() ); }
          else{ resolve(); }  
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
        if (error) { reject( new Error() ); }
        else{ resolve(); }  
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
          if (error) { reject( new Error() ); }
          else{ resolve(); }  
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