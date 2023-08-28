import { createWriteStream } from 'fs'

// import { addCookieBannerDataToDB } from "./db"

/*
Step 1. Get all terminal nodes
Step 2. Filter terminal nodes --> keep only those with at least one word match
Step 3. Get the x-th parent of the terminal nodes
Step 4. Analyse from the x-th parent down, recursively, for all children
Step 5. Choose the sub-tree that has the maximum number of hits
Step 6. Call isVisible on the most prolific child (as well as the others in the tree)
*/

export async function ALLINONE (frame, wordCorpus, maxNumChildren) {
  const returnValue = await frame.evaluate((wordCorpus, maxNumChildren) => {
    const allElements = document.querySelectorAll('*')

    let WordsFound = []
    let subTree = []

    for (const element of allElements) {
      if (element.tagName === 'HTML') { continue }

      const text = element.textContent.trim() // this should return an empty string if no text is found. it should not throw an error

      if (text && text.length > 0) {
        const wordsArray = text.split(/\s+/)

        // Check if any word from the corpus is in the text
        const matchingWords = wordCorpus.filter(corpusWord =>
          wordsArray.some((nodeWord, index) => {
            const normalizedNodeWord = nodeWord.toLowerCase()

            // Check for 1-word match
            if (normalizedNodeWord === corpusWord) {
              // console.log(corpusWord)
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

        if (matchingWords.length > 0) {
          matchingWords.forEach(word => WordsFound.push(word))
          subTree.push(element)
        }
      }
    }
    if (WordsFound.length > 0) {
      const subTreeInfo = subTree.map(nodeElement => {
        const classAttribute = nodeElement.getAttribute('class')
        const idAttribute = nodeElement.getAttribute('id')
        if (classAttribute) {
          return { class: classAttribute.split(' ').join('.'), id: idAttribute }
        } else if (idAttribute) {
          return { class: null, id: idAttribute }
        } else {
          return null
        }
      })
        .filter(Boolean) // remove null values
      return [subTreeInfo, WordsFound]
    } else {
      return null // No banner on the page
    }
  }, wordCorpus, maxNumChildren)
  return [returnValue, frame]
}

async function checkBannerVisibility (cookieBannerInfo, frame) {
  // STEP 6. SEE IF THE BEST CANDIDATE IS VISIBLE
    // Unpack non-null return values
    const subTree = cookieBannerInfo[0]
    const wordMatches = cookieBannerInfo[1]
    console.log('The following words were found:', wordMatches)
    // console.log('Sub Tree: ', subTree)
    // console.log('Frame', frame)
  
    // Get the visibility of elements.
    const visibleArray = []

    for (const nodeInfo of subTree) {
      if (nodeInfo.class !== null) { 
        try {
          const elementHandle = await frame.$(`.${nodeInfo.class}`)
          const isVisible = await elementHandle.isVisible()
          visibleArray.push(isVisible)
        } catch (error) { console.log("Error accessing element handle's visibility -- classname") }
      } else if (nodeInfo.id !== null) {
        try {
          const elementHandle = await frame.$(`#${nodeInfo.class}`)
          const isVisible = await elementHandle.isVisible()
          visibleArray.push(isVisible)
        } catch (error) { console.log("Error accessing element handle's visibility -- id") }
      }
    }

    if (visibleArray.length === 0) {
      console.log("Could not evaluate visibility")
      return null
    }
  
    // console.log('Is element visible?', visibleArray)
  
    const trueCount = visibleArray.filter(value => value === true).length
    const falseCount = visibleArray.length - trueCount
  
    let decision = 'present-visible'
    if (trueCount < falseCount) {
      decision = 'present-invisible'
    }
    // console.log('Final decision: ', trueCount > falseCount)
  
    return [decision, trueCount, falseCount]
  }
  
  async function saveCookieBannerData (browser, websiteUrl, cookieBannerInfo, visibility, type, resultPath) {
    const file = createWriteStream(`${resultPath}/${browser}_bannerInfo.txt`, { flags: 'a' })
    file.on('error', function (err) {
      console.log(err)
    })

    const file2 = createWriteStream(`${resultPath}/${browser}_bannerDecisions.txt`, { flags: 'a' })
    file2.on('error', function (err) {
      console.log(err)
    })

    if (type === 1)  {
      file.write(`${websiteUrl} --> No cookie banner has been found on the page.\n`)
      file2.write(`${websiteUrl},noBanner\n`)
    } else if (type === 2) {
      const wordMatches = cookieBannerInfo[1]
      if (wordMatches.length < 2) {
        file.write(`${websiteUrl} --> No cookie banner has been found on the page. Only found words ${wordMatches} in ${cookieBannerInfo[0].length} elements.\n`)
        const file2 = createWriteStream(`${resultPath}/${browser}_bannerDecisions.txt`, { flags: 'a' })
        file2.on('error', function (err) {
          console.log(err)
        })
        file2.write(`${websiteUrl},noBanner\n`)
      } 
    } else if (type === 3) {
      const wordMatches = cookieBannerInfo[1]
      if (visibility === null) {
        file.write(`${websiteUrl} --> Cannot assess visibility of cookie banner. Banner Info: ${wordMatches}.\n`)
        file.end()

        file2.write(`${websiteUrl},present-NA\n`)
      } else {
      const subtreeLength = cookieBannerInfo[0].length
      // const wordMatches = cookieBannerInfo[1]
      const visibilityDecision = visibility[0]
      
      file.write(`${websiteUrl} --> Is visible? ${visibilityDecision} (${visibility[1]}/${visibility[1]+visibility[2]}). Banner Info: ${wordMatches}. Analysed ${subtreeLength} elements. \n`)
      file.end()

      file2.write(`${websiteUrl},${visibilityDecision}\n`)
    }
  }
  file.end()
  file2.end()
}


async function findBannerFrameRecursive (frame, wordCorpus, maxNumChildren) {
  let bestCookieBannerCandidate

  try {
    bestCookieBannerCandidate = await ALLINONE(frame, wordCorpus, maxNumChildren)
  } catch (error) { console.log(error )}

  // If returned Null, or only less than 2 elements in subtree, or less than 2 words matches --> see if another frame can do better
  if (bestCookieBannerCandidate[0] === null || bestCookieBannerCandidate[0][0].length < 2 || bestCookieBannerCandidate[0][1].length < 2) {
    const childFrames = frame.childFrames()
    console.log("Checking frames for banner")
    for (const childFrame of childFrames) {
      
      let childCandidate = await findBannerFrameRecursive(childFrame, wordCorpus, maxNumChildren)
      console.log("Frame candidate:", childCandidate)
      if (childCandidate[0] === null) { continue }

      if (bestCookieBannerCandidate[0] === null) {
        bestCookieBannerCandidate = childCandidate
      }

      if (childCandidate[0][1].length > bestCookieBannerCandidate[0][1].length) {
        console.log(`From frame: Found a better match. Used to be ${bestCookieBannerCandidate[0][1].length} hits vs now ${childCandidate[0][1].length}. The new words '${[childCandidate[0][1]]}' will replace '${bestCookieBannerCandidate[0][1]}'`)
        bestCookieBannerCandidate = childCandidate
      }
    }
  }
  return bestCookieBannerCandidate
}

async function accessAllFrames (page, wordCorpus, maxNumChildren) {
  const topFrame = await page.mainFrame()
  return await findBannerFrameRecursive(topFrame, wordCorpus, maxNumChildren)
}


export async function allInDetermineCookieBannerState (page, wordCorpus, maxNumParents, maxNumChildren, websiteUrl, browser, connection, crawlID, resultPath) {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  
  const results = await accessAllFrames(page, wordCorpus, maxNumChildren)
  const cookieBannerInfo = results[0]
  const frame = results[1]

  // If no banner has been found, or if less than 3 words have been found.
  if (cookieBannerInfo === null) {
    console.log('No banners were found on the page (no words).')
    await saveCookieBannerData(browser, websiteUrl, cookieBannerInfo, null, 1, resultPath)
  } else if (cookieBannerInfo[1].length < 2 || cookieBannerInfo[0].length < 2) {
    console.log(`No banners were found on the page (less than 2 words founds (${cookieBannerInfo[1]}), or less than 2 elements in subtree (${cookieBannerInfo[0].length})).`)
    await saveCookieBannerData(browser, websiteUrl, cookieBannerInfo, null, 2, resultPath)
  } else {
    // await new Promise((resolve) => setTimeout(resolve, 1000))
    const visibility = await checkBannerVisibility(cookieBannerInfo, frame)
    await saveCookieBannerData(browser, websiteUrl, cookieBannerInfo, visibility, 3, resultPath)
  }
}
