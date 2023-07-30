async function saveCookies(crawlID, browser, websiteURL, storageType, frameURL, cookies, connection){
  console.log("Trace 19 (in db.js file): Entered the save cookie function");
  const cookieDataQuery = 'INSERT INTO storageData (crawlID, browser, websiteURL, storageType, frameOrigin, name, value, cookieDomain) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';

  cookies.map(async (item)  => {
    const cookieData = [
          crawlID,
          browser,
          websiteURL,
          storageType,
          frameURL,
          item.name,
          item.value,
          item.domain,
          ];
    try{
        await connection.query(cookieDataQuery, cookieData); 
    } catch(error){console.log(error);}
  })
  console.log("Trace 20 (in db.js file): Exiting the save cookie function");
}


async function saveLocalStorage(crawlID, browser, websiteURL, storageType, frameURL, localStorage, connection){
  console.log("Trace 21 (in db.js file): Entered the save cookie function");
  const localStorageDataQuery = 'INSERT INTO storageData (crawlID, browser, websiteURL, storageType, frameOrigin, name, value, cookieDomain) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';

  Object.keys(localStorage).map(async (key) => {
    const value = localStorage[key];
    const localStorageData = [
          crawlID,
          browser,
          websiteURL,
          storageType,
          frameURL,
          key,
          value,
          null,
          ];
      
    try{
      await connection.query(localStorageDataQuery, localStorageData);
    } catch(error) {console.log(error);}
  })
  console.log("Trace 20 (in db.js file): Exiting the save cookie function");
}

async function saveResponses(crawlID, browser, websiteURL, interceptedResponse, connection){
  const responseDataQuery = 'INSERT INTO response_data (crawlID, browser, websiteURL, specificURL, contentType, contentLength) VALUES ($1, $2, $3, $4, $5, $6)';
  const responseData = [
      crawlID,
      browser,
      websiteURL,
      interceptedResponse.url(),
      interceptedResponse.headers()['content-type'],
      interceptedResponse.headers()['content-length']
      ];

  try{
    await connection.query(responseDataQuery, responseData);
  } catch(error){console.log(error);}
}


module.exports = {
  saveCookies,
  saveResponses,
  saveLocalStorage
  };