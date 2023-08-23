import { createReadStream } from 'fs'

const browser = 'Firefox'

 async function TXTtoArray (path) {
  return new Promise((resolve, reject) => {
    const myURLs = []
    createReadStream(path, 'utf8')
      .on('data', function (chunk) {
        // Split the chunk into lines and process each line
        const lines = chunk.split('\n')
        lines.forEach(line => {
          if (line !== '') { // Exclude empty site names
            myURLs.push(line)
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


async function main () {
  let path
  if (browser === 'Firefox') {
    path = './FirefoxSuccessful.txt'
  } else if (browser === 'Ghostery') {
    path = './GhosterySuccessful.txt'
  } else if (browser === 'Brave') {
    path = './BraveSuccessful.txt'
  } else if (browser === 'Google Chrome') {
    path = './Google ChromeSuccessful.txt'
  }

  const resultsArr = await TXTtoArray(path)
  const resultsSet = new Set(resultsArr)

  console.log(`${resultsSet.size} successful websites for ${browser}`)
}
main()
