async function saveCookies(crawlID, browser, URL, storageType, frameURL, cookies, connection){
  const cookieDataQuery = 'INSERT INTO storageData (crawlID, browser, websiteURL, storageType, frameOrigin, name, value, cookieDomain) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';

  cookies.map(async (item)  => {
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
        await  connection.query(cookieDataQuery, cookieData); 
  })
}


async function saveLocalStorage(crawlID, browser, URL, storageType, frameURL, localStorage, connection){
  const localStorageDataQuery = 'INSERT INTO storageData (crawlID, browser, websiteURL, storageType, frameOrigin, name, value, cookieDomain) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';

  Object.keys(localStorage).map(async (key) => {
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
          
      await connection.query(localStorageDataQuery, localStorageData);
  })
}

async function saveResponses(crawlID, browser, URL, interceptedResponse, connection){
  const responseDataQuery = 'INSERT INTO response_data (crawlID, browser, websiteURL, specificURL, contentType, contentLength) VALUES ($1, $2, $3, $4, $5, $6)';
  const responseData = [
      crawlID,
      browser,
      URL,
      interceptedResponse.url(),
      interceptedResponse.headers()['content-type'],
      interceptedResponse.headers()['content-length']
      ];

  await connection.query(responseDataQuery, responseData);
}


module.exports = {
  saveCookies,
  saveResponses,
  saveLocalStorage
  };