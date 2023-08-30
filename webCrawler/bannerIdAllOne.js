import { createWriteStream } from 'fs'
import { addCookieBannerDataToDB } from "./db.js"

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

    let maxNumHits = 0
    let maxWordHits
    let subTree

    for (const element of allElements) {
      if (element.tagName === 'HTML') { continue }

      const loopThroughSubTree = [element]
      let childrenCounter = (element.children).length
      // let reachedTerminalNode = true
      let skipBool = false

      for (const child of element.children) {
        // I am making the number of children and reaching a terminal node a requirement for the specific children of this parent.
        // If none of the children satisfy the requirements, then none will be added. 
        
        childrenCounter += (child.children).length
        if (childrenCounter > maxNumChildren) { skipBool = true; break }

        for (const child2 of child.children) {
          childrenCounter += (child2.children).length
          if (childrenCounter > maxNumChildren) { skipBool = true; break }

          for (const child3 of child2.children) {
            childrenCounter += (child3.children).length
            if (childrenCounter > maxNumChildren) { skipBool = true; break }

            for (const child4 of child3.children) {
              childrenCounter += (child4.children).length
              if (childrenCounter > maxNumChildren) { skipBool = true; break }

              for (const child5 of child4.children) {
                childrenCounter += (child5.children).length
                if (childrenCounter > maxNumChildren) { skipBool = true; break }

                if ((child5.children).length !== 0) {
                  skipBool = true // if haven't reached the end
                  break
                }

                if (childrenCounter > maxNumChildren) { 
                  skipBool = true
                  break 
                }
              loopThroughSubTree.push(child5)
              }
              if (skipBool) { break }
              loopThroughSubTree.push(child4)
            }
            if (skipBool) { break }
            loopThroughSubTree.push(child3)
          }
          if (skipBool) { break }
          loopThroughSubTree.push(child2)
        }
        if (skipBool) { break }
        loopThroughSubTree.push(child)
      }

      if (skipBool) { continue } // ignore that element

      const wordHits = new Set()
      for (const nodeElement of loopThroughSubTree) {
        // STEP 4.2: COMPARE THE VALUES TO THE WORD CORPUS
        // Get the text of the Node (if any)
        const text = nodeElement.textContent.trim() // this should return an empty string if no text is found. it should not throw an error

        if (text && text.length > 0) {
          // const wordCorpusArray = wordCorpus.split(',')
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
            matchingWords.forEach(wordHits.add, wordHits)
          } else { // if the element in the subTree has NO matches, remove it from the subTree being considered as a banner. this will help removing "random" elements that are included in the subtree
            const index = loopThroughSubTree.indexOf(nodeElement)
            if (index > -1) { // only splice array when item is found
              loopThroughSubTree.splice(index, 1) // 2nd parameter means remove one item only
            }
          }
        } else {
          // remove from subtree if has no text
          const index = loopThroughSubTree.indexOf(nodeElement)
            if (index > -1) { // only splice array when item is found
              loopThroughSubTree.splice(index, 1) // 2nd parameter means remove one item only
            }
        }
      }
      
      // STEP 4.3: UPDATE THE BEST CANDIDATE IF FOUND (either more word hits, or same number but smaller subtree)
      if (wordHits.size > 0) {
        if (wordHits.size > maxNumHits || (wordHits.size === maxNumHits && loopThroughSubTree.length < subTree.length )) {
          console.log(`!_!: Found a better match. Used to be ${maxNumHits} hits vs now ${wordHits.size}. The new words '${[...wordHits]}' will replace '${maxWordHits}'`)
          maxNumHits = wordHits.size
          maxWordHits = [...wordHits]
          subTree = loopThroughSubTree
        }
      }  
    }

    if (Number(maxNumHits) > 0) {
      // Otherwise, return the banner
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
      return [subTreeInfo, maxWordHits]
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
    const percentageVisibility = +(100 * (trueCount / (trueCount + falseCount))).toFixed(2)
  
    // let decision = 'present-visible'
    // if (trueCount < falseCount) {
    //   decision = 'present-invisible'
    // }
    // console.log('Final decision: ', trueCount > falseCount)
  
    // return [decision, trueCount, falseCount]

    return [trueCount > falseCount, percentageVisibility]
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
    // await saveCookieBannerData(browser, websiteUrl, cookieBannerInfo, null, 1, resultPath)
    await addCookieBannerDataToDB(browser, websiteUrl, connection, crawlID, false, null, null, null, null, false, 1)
  } else if (cookieBannerInfo[1].length < 2 || cookieBannerInfo[0].length < 2) {
    console.log(`No banners were found on the page (less than 2 words founds (${cookieBannerInfo[1]}), or less than 2 elements in subtree (${cookieBannerInfo[0].length})).`)
    // await saveCookieBannerData(browser, websiteUrl, cookieBannerInfo, null, 2, resultPath)
    await addCookieBannerDataToDB(browser, websiteUrl, connection, crawlID, false, cookieBannerInfo[1], cookieBannerInfo[0].length, null, null, false, 2)
  } else {
    // await new Promise((resolve) => setTimeout(resolve, 1000))
    const visibilityResults = await checkBannerVisibility(cookieBannerInfo, frame)
    const visibility = visibilityResults[0]
    const percentageVisibility = visibilityResults[1]
    // await saveCookieBannerData(browser, websiteUrl, cookieBannerInfo, visibility, 3, resultPath)
    await addCookieBannerDataToDB(browser, websiteUrl, connection, crawlID, true, cookieBannerInfo[1], cookieBannerInfo[0].length, visibility, percentageVisibility, visibility, 3)
  }
}
