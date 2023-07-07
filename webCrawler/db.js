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


function saveCookies(crawlID, browser, URL, pageCookies, connection){
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
  
      connection.query(cookieDataQuery, cookieData, (error, results) => {
      if (error) {
          console.error('Error inserting data: ', error);
      }
      
      });
  }
}

function saveRequests(crawlID, browser, URL, interceptedRequest, connection){
  const requestDataQuery = 'INSERT INTO request_data (crawlID, browser, url, specific_url, method, referer, cookie, postData) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const requestData = [
      crawlID,
      browser,
      URL,
      interceptedRequest.url(),
      interceptedRequest.method(),
      interceptedRequest.headers()['referer'],
      interceptedRequest.headers()['cookie'],
      interceptedRequest.postData()
      ];

      connection.query(requestDataQuery, requestData, (error, results) => {
      if (error) {
          console.error('Error inserting data: ', error);
      }
      });
}


module.exports = {
  saveCookies,
  saveHTML,
  saveRequests,
  endConnection,
  establishConnection
  };