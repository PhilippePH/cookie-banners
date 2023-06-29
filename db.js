const mysql = require('mysql2');

// const connection = mysql.createConnection({
//   host: '127.0.0.1',
//   user: 'root',
//   password: 'I@mastrongpsswd',
//   database: 'CrawlData',
// });

async function establishConnection(connection){
  connection.connect(function(err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  
    console.log('Connected to the MySQL server.');
  });
}

async function endConnection(connection){
  connection.end(function(err) {
      if (err) {
        return console.log('error:' + err.message);
      }
      console.log('Close the database connection.');
    });
}

async function saveCookies(URL, cookies){
  const insertDataQuery = 'INSERT INTO cookie_data (name, value, domain, path, expires, size, httpOnly, secure, session, sameSite, sameParty, sourceScheme, sourcePort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

  for(let i = 0; i < cookies.length; i++){ // later on see if we can do a "batch add" and add all the lines at once (assuming its faster to do only 1 query)
    const data = [
      URL,
      cookies[i].name,
      cookies[i].value,
      cookies[i].domain,
      cookies[i].path, 
      cookies[i].expires, 
      cookies[i].size, 
      cookies[i].httpOnly, 
      cookies[i].secure, 
      cookies[i].session, 
      cookies[i].sameSite, 
      cookies[i].sameParty, 
      cookies[i].sourceScheme, 
      cookies[i].sourcePort
    ];

    connection.query(insertDataQuery, data, (error, results) => {
      if (error) {
        console.error('Error inserting data: ', error);
      } else {
        console.log('Data inserted successfully!');
      }
    });
  }
}


module.exports = {
    establishConnection,
    endConnection,
  };