import { createWriteStream } from 'fs'

export async function saveSuccessfulWebsites (websiteUrl, resultPath, browser) {
  const file = createWriteStream(`${resultPath}/${browser}_successfulURLs.txt`, { flags: 'a' })
  const file2 = createWriteStream(`./webCrawler/websiteSelection/successfulWebsites/${browser}Successful.txt`, { flags: 'a' })

  file.on('error', function (err) {
    console.log(err)
  })

  file.write(websiteUrl + '\n')
  file.end()

  file2.on('error', function (err) {
    console.log(err)
  })

  file2.write(websiteUrl + '\n')
  file2.end()
}

export async function saveTimedoutWebsites (websiteUrl, resultPath, browser) {
  const file = createWriteStream(`${resultPath}/${browser}_timedoutURLs.txt`, { flags: 'a' })

  file.on('error', function (err) {
    console.log(err)
  })

  file.write(websiteUrl + '\n')
  file.end()

  const file2 = createWriteStream(`webCrawler/websiteSelection/timeouts/${browser}Timeout.txt`, { flags: 'a' })

  file2.on('error', function (err) {
    console.log(err)
  })
  file2.write(websiteUrl + '\n')
  file2.end()
}