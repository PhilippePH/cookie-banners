import { TXTtoArray } from '../websiteSelection.js'

const browser = 'Brave'

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
  console.log(resultsArr)
  const resultsSet = new Set(resultsArr)

  console.log(`${resultsSet.size} successful websites for ${browser}`)
}
main()
