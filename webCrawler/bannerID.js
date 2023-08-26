// import { addCookieBannerDataToDB } from "./db"
import { match } from 'assert'
import { createWriteStream } from 'fs'

/*
Step 1. Get all terminal nodes
Step 2. Filter terminal nodes --> keep only those with at least one word match
Step 3. Get the x-th parent of the terminal nodes
Step 4. Analyse from the x-th parent down, recursively, for all children
Step 5. Choose the sub-tree that has the maximum number of hits
Step 6. Call isVisible on the most prolific child (as well as the others in the tree)
*/

async function getTerminalNodes (page) {
  const terminalNodes = await page.$x('//*[not(child::*)]')
  console.log("Terminal Nodes:", terminalNodes.length, "that look like", terminalNodes[0])
  return terminalNodes
  // const allElements = document.querySelectorAll('*')
  // const terminalNodes = []

  // // Filter out elements with children
  // for (const element of allElements) {
  //   console.log(element)
  //   if (element.children.length === 0) {
  //     terminalNodes.push(element)
  //   }
  // }

  // return terminalNodes
}

// Checks if a node has at least 1 word match. Returns candidates {node, numMatch, the matched words}
async function assessCorpus (element, wordCorpus) {
  // Get the text of the Node (if any)
  const textNotTrimmed = await element.evaluate(element => element.textContent);
  const text = textNotTrimmed.trim() // this should return an empty string if no text is found. it should not throw an error
  
  if (text.length > 0) {
    // const wordCorpusArray = wordCorpus.split(',')
    const wordsArray = text.split(/\s+/)

    // Check if any word from the corpus is in the text
    const matchingWords = wordCorpus.filter(corpusWord =>
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
    console.log("Assess Corpus Element Matching Words", matchingWords)
    return matchingWords
  }
  return [] // is returning an empty array the thing to do here?
}

async function filterTerminalNodes (terminalNodes, wordCorpus) {
  const shortlist = []

  for (const node of terminalNodes) {
    console.log(node)
    const matches = await assessCorpus(node, wordCorpus)
    if (matches.length > 0) {
      shortlist.push(node)
    }
  }
  return shortlist
}

async function getParents (page, filteredNodes, maxNumParents, maxNumChildren) {
  let parents
  for (const nodeElement of filteredNodes) {
    console.log("Node element", nodeElement)
    let element = nodeElement
    for (let i = 0; i < maxNumParents; i++) { // getting the i-th parent
      const subTree = await createSubTree(page, element)

      // Ensure the total size of the subTree being created does not become too big
      console.log("Subtree Length:", subTree.length)
      if (subTree.length > maxNumChildren) {
        break
      }
      // Get the parent element using XPath
      console.log("Element", element)
      element = await element.$x('..'); // Double period (..) selects the parent
      console.log("Element's parent", element)
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

  console.log("Word Hits:", wordHits)

  for (const child of element.children) {
    const newResults = await evaluateElement(page, child, wordCorpus) // this recursive call ensures we visit all the children in the sub-tree
    newResults[0].forEach(wordHits.add, wordHits)
    elementsToRemove.push(...newResults[1])
  }

  // if the element in the subTree has NO matches, remove it from the subTree being considered as a banner. this will help removing "random" elements that are included in the subtree
  if (results.length === 0) {
    console.log("Blacklisted this element.")
    elementsToRemove.push(element)
  }

  return [results, elementsToRemove]
}

async function createSubTree (page, element, elementsToRemoveFromSubTree = null) {
  const subTree = []
  console.log("Element", element)
  const children = await page.evaluate(element => { return Array.from(element.children) }, element)
  console.log("Those are supposed to be my children:", children)
  for (const child of children) {
    const results = await createSubTree(page, child, elementsToRemoveFromSubTree)
    subTree.push(...results)
  }

  if (elementsToRemoveFromSubTree) {
    // Don't add self if in blaclist
    for (const blacklisted of elementsToRemoveFromSubTree) {
      if (element === blacklisted) { 
        console.log("Found a blacklisted element, am not adding it")
        return subTree 
      }
    }
  }

  subTree.push(element)
  return subTree
}

// This is to launch the recursive search for all parents in the shortlist
async function selectBannerElement (page, subTreesParents, wordCorpus) {
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
      console.log(`Found a better match! ${numHits} versus ${maxNumHits} (${wordHits} vs ${maxWordHits})` )
      maxNumHits = wordHits.length
      maxWordHits = wordHits
      subTreeParent = parent
      elementsToRemoveFromSubTree = elementsToRemove
    }
  }

  // Once the subtree has been selected, create the subtree structure and remove any elements in the blacklist
  console.log("ELEMENTS TO REMOVE", elementsToRemoveFromSubTree)
  const subTree = await createSubTree(page, subTreeParent, elementsToRemoveFromSubTree)

  return [subTree, maxNumHits, maxWordHits]
}

async function checkBannerVisibility (page, subTree, maxWordHits) {  
    // Get the visibility of elements.
    const visibleArray = []

    for (const element of subTree) {
      // if (nodeInfo.class === null) { continue }
      try {
        // const elementHandle = await page.$(`.${nodeInfo.class}`)
        const isVisible = await element.isVisible()
        visibleArray.push(isVisible)
      } catch (error) { console.log(error) }
    }

    if (visibleArray.length === 0) {
      console.log("Could not evaluate visibility")
      return null
    }
  
    console.log('Is element visible?', visibleArray)
  
    const trueCount = visibleArray.filter(value => value === true).length
    const falseCount = visibleArray.length - trueCount
  
    console.log('Final decision: ', trueCount > falseCount)
  
    return [trueCount > falseCount, trueCount, falseCount]
  }

async function saveCookieBannerData (browser, websiteUrl, subTree, maxNumHits, maxWordHits, visibility) {
  const file = createWriteStream(`/Users/philippe/Documents/code/cookie-banners/webCrawler/bannerIdTestFiles/${browser}_bannerInfo.txt`, { flags: 'a' })

  file.on('error', function (err) {
    console.log(err)
  })

  if (maxNumHits === 0)  {
    file.write(`${websiteUrl} --> No cookie banner has been found on the page.\n`)
  } else if (maxNumHits < 2) {
      file.write(`${websiteUrl} --> No cookie banner has been found on the page. Only found words ${maxWordHits}.\n`)
  } else {
    if (visibility === null) {
      file.write(`${websiteUrl} --> Cannot assess visibility of cookie banner. Banner Info: ${maxWordHits}.\n`)
    } else {
      const subtreeLength = subTree.length
      const visibilityDecision = visibility[0]
      
      file.write(`${websiteUrl} --> Is visible? ${visibilityDecision} (${visibility[1]}/${visibility[1]+visibility[2]}). Banner Info: ${maxWordHits}. Analysed ${subtreeLength} elements. \n`)
      file.end()

      const file2 = createWriteStream(`/Users/philippe/Documents/code/cookie-banners/webCrawler/bannerIdTestFiles/${browser}_bannerDecisions.txt`, { flags: 'a' })

      file2.on('error', function (err) {
        console.log(err)
      })
      file2.write(`${websiteUrl} ${visibilityDecision}\n`)
      file2.end()
    }
  }
  file.end()
}

export async function determineCookieBannerState (page, wordCorpus, maxNumParents, maxNumChildren, websiteUrl, browser, connection, crawlID) {
  // STEP 1. GET ALL THE TERMINAL NODES
  const terminalNodes = await getTerminalNodes(page)

  // STEP 2. FILTER THE TERMINAL NODES BY COMAPRING THEM WITH THE CORPUS
  const filteredNodes = await filterTerminalNodes(terminalNodes, wordCorpus)

  // STEP 3. GET THE PARENTS
  const subTreesParents = await getParents(page, filteredNodes, maxNumParents, maxNumChildren)

  // STEP 4. ANALYSE THE SUBTREES FROM THE PARENTS
  const results = await selectBannerElement(subTreesParents, wordCorpus)
  const subTree = results[0]
  const maxNumHits = results[1]
  const maxWordHits = results[2]

  // If no banner has been found, return
  if (maxNumHits < 2) {
    console.log('No banners were found on the page.')
    await saveCookieBannerData(browser, websiteUrl, subTree, maxNumHits, maxWordHits, null)
    // await addCookieBannerDataToDB(browser, websiteUrl, connection, crawlID, null, cookieBannerInfo)
  } else {
    console.log('The following words were found:', maxWordHits)
    
    // STEP 6. SEE IF THE BEST CANDIDATE IS VISIBLE
    const visibility = await checkBannerVisibility(page, subTree)
    
    await saveCookieBannerData(browser, websiteUrl, maxNumHits, maxWordHits, visibility)
    // await addCookieBannerDataToDB(browser, websiteUrl, connection, crawlID, visibility, cookieBannerInfo)
  }
}
