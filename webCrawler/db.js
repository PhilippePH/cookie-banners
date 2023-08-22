export async function saveCookies (crawlID, browser, websiteURL, storageType, frameURL, cookies, connection) {
  const cookieDataQuery = 'INSERT INTO storageData (crawlID, browser, websiteURL, storageType, frameOrigin, name, value, cookieDomain) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'

  cookies.map(async (item) => {
    const cookieData = [
      crawlID,
      browser,
      websiteURL,
      storageType,
      frameURL,
      item.name,
      item.value,
      item.domain
    ]
    try {
      await connection.query(cookieDataQuery, cookieData)
    } catch (error) {
      console.log(error)
    }
  })
}

export async function saveLocalStorage (crawlID, browser, websiteURL, storageType, frameURL, localStorage, connection) {
  const localStorageDataQuery = 'INSERT INTO storageData (crawlID, browser, websiteURL, storageType, frameOrigin, name, value, cookieDomain) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'

  Object.keys(localStorage).map(async (key) => {
    const value = localStorage[key]
    const localStorageData = [
      crawlID,
      browser,
      websiteURL,
      storageType,
      frameURL,
      key,
      value,
      null
    ]
    
    try {
      await connection.query(localStorageDataQuery, localStorageData)
    } catch (error) {
      console.log(error)
    }
  })
}

export async function saveResponses (crawlID, browser, websiteURL, interceptedResponse, connection) {
  const responseDataQuery = 'INSERT INTO responseData (crawlID, browser, websiteURL, specificURL, contentType, contentLength) VALUES ($1, $2, $3, $4, $5, $6)'
  const responseData = [
    crawlID,
    browser,
    websiteURL,
    interceptedResponse.url(),
    interceptedResponse.headers()['content-type'],
    interceptedResponse.headers()['content-length']
  ]

  try {
    await connection.query(responseDataQuery, responseData)
  } catch (error) {
    console.log(error)
  }
}

export async function saveRequests (crawlID, browser, websiteURL, frameOrigin, requestedUrl, connection) {
  const requestDataQuery = 'INSERT INTO requestData (crawlID, browser, websiteURL, frameOrigin, requestedUrl) VALUES ($1, $2, $3, $4, $5)'
  const requestData = [
    crawlID,
    browser,
    websiteURL,
    frameOrigin,
    requestedUrl
  ]

  try {
    await connection.query(requestDataQuery, requestData)
  } catch (error) {
    console.log(error)
  }
}
