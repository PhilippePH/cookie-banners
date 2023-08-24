import { addCookieBannerDataToDB } from "./db"

/*
Step 1. Get all terminal nodes
Step 2. Filter terminal nodes --> keep only those with at least one word match
Step 3. Get the x-th parent of the terminal nodes
Step 4. Analyse from the x-th parent down, recursively, for all children
Step 5. Choose the sub-tree that has the maximum number of hits
Step 6. Call isVisible on the most prolific child (as well as the others in the tree)
*/

async function getTerminalNodes () {
  const allElements = document.querySelectorAll('*')
  const terminalNodes = []

  // Filter out elements with children
  for (const element of allElements) {
    console.log(element)
    if (element.children.length === 0) {
      terminalNodes.push(element)
    }
  }

  return terminalNodes
}

// Checks if a node has at least 1 word match. Returns candidates {node, numMatch, the matched words}
async function assessCorpus (element, wordCorpus) {
  // Get the text of the Node (if any)
  const text = element.textContent.trim() // this should return an empty string if no text is found. it should not throw an error

  if (text.length > 0) {
    const wordCopursArray = wordCorpus.split(',')
    const wordsArray = text.split(/\s+/)

    // Check if any word from the corpus is in the text
    const matchingWords = wordCopursArray.filter(corpusWord =>
      wordsArray.some((nodeWord, index) => {
        const normalizedNodeWord = nodeWord.toLowerCase()

        // Check for 1-word match
        if (normalizedNodeWord === corpusWord) {
          return true
        }

        // Check for 2-word match using subsequent words
        if (index < wordsArray.length - 1) {
          const normalizedNextWord = wordsArray[index + 1].toLowerCase()
          const twoWordMatch = normalizedNodeWord + ' ' + normalizedNextWord
          return twoWordMatch === corpusWord
        }

        return false
      })
    )
    return matchingWords
  }
  return [] // is returning an empty array the thing to do here?
}

async function filterTerminalNodes (terminalNodes, wordCorpus) {
  const shortlist = []

  for (const node of terminalNodes) {
    const matches = await assessCorpus(node, wordCorpus)
    if (matches.length > 0) {
      shortlist.push(node)
    }
  }
  return shortlist
}

async function getParents (filteredNodes, maxNumParents, maxNumChildren) {
  let parents
  for (const nodeElement of filteredNodes) {
    let element = nodeElement
    for (let i = 0; i < maxNumParents; i++) { // getting the i-th parent
      const subTree = await createSubTree(element)

      // Ensure the total size of the subTree being created does not become too big
      if (subTree.length > maxNumChildren) {
        break
      }
      element = element.parentElement
    }
    parents.push(element)
  }
  return parents
}

async function evaluateElement (page, element, wordCorpus) {
  const elementsToRemove = []
  const wordHits = new Set()
  const results = await assessCorpus(element, wordCorpus)
  results.forEach(wordHits.add, wordHits)

  for (const child of element.children) {
    const newResults = await evaluateElement(page, child, wordCorpus) // this recursive call ensures we visit all the children in the sub-tree
    newResults[0].forEach(wordHits.add, wordHits)
    elementsToRemove.push(...newResults[1])
  }

  // if the element in the subTree has NO matches, remove it from the subTree being considered as a banner. this will help removing "random" elements that are included in the subtree
  if (results.length === 0) {
    elementsToRemove.push(element)
  }

  return [results, elementsToRemove]
}

async function createSubTree (element, elementsToRemoveFromSubTree) {
  const subTree = []
  for (const child of element.children) {
    const results = await createSubTree(child, elementsToRemoveFromSubTree)
    subTree.push(...results)
  }
  // Don't add self if in blaclist
  for (const blacklisted of elementsToRemoveFromSubTree) {
    if (element === blacklisted) { return subTree }
  }

  subTree.push(element)
  return subTree
}

// This is to launch the recursive search for all parents in the shortlist
async function selectBannerElement (subTreesParents, wordCorpus) {
  let maxNumHits = 0
  let maxWordHits
  let subTreeParent
  let elementsToRemoveFromSubTree

  // Select the best banner candidate based on word hits, (ADD: and minimising children)
  for (const parent of subTreesParents) {
    const results = await evaluateElement(page, parent, wordCorpus)
    const wordHits = results[0]
    const elementsToRemove = results[1]

    if (wordHits.length > maxNumHits) {
      maxNumHits = wordHits.length
      maxWordHits = wordHits
      subTreeParent = parent
      elementsToRemoveFromSubTree = elementsToRemove
    }
  }
  // console.log(`Best candidate has ${maxNumHits} matches: ${maxWordHits}`)

  // Once the subtree has been selected, create the subtree structure and remove any elements in the blacklist
  const subTree = await createSubTree(subTreeParent, elementsToRemoveFromSubTree)

  return [subTree, maxNumHits, maxWordHits]
}

export async function evaluatePage (page, wordCorpus, maxNumParents, maxNumChildren) {
  const returnValue = await page.evaluate(async (wordCorpus, maxNumParents) => {
    // STEP 1. GET ALL THE TERMINAL NODES
    const terminalNodes = await getTerminalNodes()

    // STEP 2. FILTER THE TERMINAL NODES BY COMAPRING THEM WITH THE CORPUS
    const filteredNodes = await filterTerminalNodes(terminalNodes, wordCorpus)

    // STEP 3. GET THE PARENTS
    const subTreesParents = await getParents(filteredNodes, maxNumParents, maxNumChildren)

    // STEP 4. ANALYSE THE SUBTREES FROM THE PARENTS
    const results = await selectBannerElement(subTreesParents, wordCorpus)
    const subTree = results[0]
    const maxNumHits = results[1]
    const maxWordHits = results[2]

    // STEP 5. PREPARE RETURN VALUE (Null if no banner found)
    if (Number(maxNumHits) > 0) {
      // Get the class attribute of each element in the subtre
      const subTreeInfo = subTree.map(nodeElement => {
        const classAttribute = nodeElement.getAttribute('class')
        return classAttribute ? { class: classAttribute.split(' ').join('.') } : null // joins multi word class names with . to form a valid one for puppeteer to search with
      })
        .filter(Boolean) // remove null values
      return [subTreeInfo, maxWordHits]
    } else {
      console.log('There are not banners on the page.')
      return null
    }
  }, wordCorpus, maxNumParents)

  return returnValue
}

async function checkBannerVisibility (page, cookieBannerInfo) {
// STEP 6. SEE IF THE BEST CANDIDATE IS VISIBLE
  // Unpack non-null return values
  const subTree = cookieBannerInfo[0]
  const wordMatches = cookieBannerInfo[1]
  console.log('The following words were found:', wordMatches)

  // Get the visibility of elements.
  const visibleArray = []
  for (const nodeInfo of subTree) {
    if (nodeInfo.class == null) { continue }

    try {
      const elementHandle = await page.$(`.${nodeInfo.class}`)
      const isVisible = await elementHandle.isVisible()
      visibleArray.push(isVisible)
    } catch (error) { }
  }

  console.log('Is element visible?', visibleArray)

  const trueCount = visibleArray.filter(value => value === true).length
  const falseCount = visibleArray.length - trueCount

  console.log('Final decision: ', trueCount > falseCount)

  return trueCount > falseCount
}

async function saveCookieBannerData (browser, websiteUrl, bannerInfo, visibility) {
  const file = createWriteStream(`/Users/philippe/Documents/code/cookie-banners/webCrawler/bannerIdTestFiles/${browser}_timedoutURLs.txt`, { flags: 'a' })

  file.on('error', function (err) {
    console.log(err)
  })

  file.write(`${websiteUrl} --> Is visible? ${visibility}. Banner Info: ${bannerInfo} \n`)
  file.end()
}

export async function determineCookieBannerState (page, wordCorpus, maxNumParents, maxNumChildren, websiteUrl, browser, connection, crawlID) {
  await page.exposeFunction('getTerminalNodes', getTerminalNodes)
  await page.exposeFunction('filterTerminalNodes', filterTerminalNodes)
  await page.exposeFunction('getParents', getParents)
  await page.exposeFunction('selectBannerElement', selectBannerElement)

  const cookieBannerInfo = await evaluatePage(page, wordCorpus, maxNumParents, maxNumChildren)
  
  // If no banner has been found, return
  if (cookieBannerInfo === null) {
    console.log('No banners were found on the page.')
    await saveCookieBannerData(browser, websiteUrl, bannerInfo, null)
    await addCookieBannerDataToDB(browser, websiteUrl, connection, crawlID, null, cookieBannerInfo)
  }
  const visibility = await checkBannerVisibility(page, cookieBannerInfo)
  await saveCookieBannerData(browser, websiteUrl, bannerInfo, visibility)
  await addCookieBannerDataToDB(browser, websiteUrl, connection, crawlID, visibility, cookieBannerInfo)
}
