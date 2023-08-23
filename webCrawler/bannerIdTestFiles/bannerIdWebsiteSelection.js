import { createReadStream } from 'fs'

export async function TXTtoArray (path) {
  /* Read in a TXT file at path path.
    Modifies URL format to "https://www.sitename.tld"
    Returns the array of URLs. */

  return new Promise((resolve, reject) => {
    const myURLs = []
    createReadStream(path, 'utf8')
      .on('data', function (chunk) {
        // Split the chunk into lines and process each line
        const lines = chunk.split('\n')
        lines.forEach(line => {
          const parts = line.split(',')
          if (parts.length === 2) { // Ensure the line is of form ID, sitename
            const siteName = parts[1].trim() // Get sitename
            if (siteName !== '') { // Exclude empty site names
              myURLs.push('https://www.' + siteName)
            }
          }
        })
      })
      .on('end', function () {
        resolve(myURLs)
      })
      .on('error', function (error) {
        console.log(error.message)
        reject(error)
      })
  })
}

export async function getURLs (totalNumber, startNumber, browser, path) {
  const data = await TXTtoArray(path)
  const newUrls = data.slice(Number(startNumber), Number(totalNumber))
  return newUrls
}

export async function getSiteNames (url) {
  /* Takes a single input and returns the name of the site
  Following the format of the (modified) top-1m tranco list
  https://www.SITENAME.com
  */
  const nameArray = await url.split('.')
  const excludeFirstTerm = nameArray.slice(1)
  const nameValue = excludeFirstTerm.join('_')

  return nameValue
}
