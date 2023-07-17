const mysql = require('mysql2');

function establishConnection(connection){
  connection.connect(function(err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  
    console.log('Connected to the MySQL server.');
  });
}

function endConnection(connection){
  connection.end(function(err) {
      if (err) {
        return console.log('error:' + err.message);
      }
      console.log('Close the database connection.');
    });
}

/* 
function saveHTML(crawlID, browser, URL, html_contents, connection){
  const HTMLDataQuery = 'INSERT INTO html_data (crawlID, browser, url, html) VALUES (?, ?, ?, ?)';
  const htmlData = [
      crawlID,
      browser,
      URL,
      html_contents
  ]
  connection.query(HTMLDataQuery, htmlData, (error, results) => {
      if (error) {
          console.error('Error inserting data: ', error);
      }
      });
  }
*/ 


function saveCookies(crawlID, browser, websiteURL, storageType, frameURL, cookieDomain, key, value, connection){
  const cookieDataQuery = 'INSERT INTO cookie_data (crawlID, browser, websiteURL, storageType, frameURL, cookieDomain, key, value) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                  
  for(let i = 0; i < pageCookies.length; i++){ // later on see if we can do a "batch add" and add all the lines at once (assuming its faster to do only 1 query)
      const cookieData = [
          crawlID,
          browser,
          websiteURL,
          storageType,
          frameURL,
          cookieDomain,
          key,
          value
          ];
  
      connection.query(cookieDataQuery, cookieData, (error, results) => {
      if (error) {
          console.error('Error inserting data: ', error);
      }
      
      });
  }
}

function saveResponses(crawlID, browser, URL, interceptedResponse, connection){
  const responseDataQuery = 'INSERT INTO response_data (crawlID, browser, url, specific_url, content_type, content_length) VALUES (?, ?, ?, ?, ?, ?)';
  const responseData = [
      crawlID,
      browser,
      URL,
      interceptedResponse.url(),
      interceptedResponse.headers()['content-type'],
      interceptedResponse.headers()['content-length']
      ];

      connection.query(responseDataQuery, responseData, (error, results) => {
      if (error) {
          console.error('Error inserting data: ', error);
      }
      });
}


module.exports = {
  saveCookies,
  // saveHTML,
  saveResponses,
  endConnection,
  establishConnection
  };