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

export async function ALLINONE (page, wordCorpus, maxNumParents, maxNumChildren) {
  const returnValue = await page.evaluate((wordCorpus, maxNumParents, maxNumChildren) => {
    // STEP 1. GET ALL THE TERMINAL NODES
    const allElements = document.querySelectorAll('*')
    const terminalNodes = []

    // Filter out elements with children
    for (const element of allElements) {
      if (element.children.length === 0) {
        terminalNodes.push(element)
      }
    }

    // STEP 2. FILTER THE TERMINAL NODES
    const filteredNodes = []

    for (const nodeElement of terminalNodes) {
      // STEP 2.1: COMPARE THE VALUES TO THE WORD CORPUS
      // Get the text of the Node (if any)
      const text = nodeElement.textContent.trim() // this should return an empty string if no text is found. it should not throw an error

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

        if (matchingWords.length > 0) {
          filteredNodes.push(nodeElement)
        }
      }
    }

    // STEP 3. GET THE PARENTS
    const subTreesParents = []
    
    for (const nodeElement of filteredNodes) {
      const parents = []
      let getParentOf = nodeElement
      for (let i = 0; i < maxNumParents; i++) { // getting up to the i-th parent
        getParentOf = getParentOf.parentElement
        if (getParentOf === null) {
          break // i.e. no parents were found, thus stop the loop and don't push it
        }
        parents.push(getParentOf)
      }
      subTreesParents.push([nodeElement, parents])
    }

    // STEP 4. ANALYSE THE SUBTREES
    let maxNumHits = 0
    let maxWordHits
    let subTree

    for (const values of subTreesParents) {
      const wordHitElement = values[0]
      const parents = values[1]
      // STEP 4.1: Get the list of parent and all children
      const loopThroughSubTree = [wordHitElement]

      for (const parent of parents) {
        // THIS USED TO BE RECURSIVE, BUT I DON'T THINK I CAN DO THIS NICELY FULLY ITERABLY
        for (const child of parent.children) {
          // I am making the number of children and reaching a terminal node a requirement for the specific children of this parent.
          // If none of the children satisfy the requirements, then none will be added. 
          let childrenCounter = 0
          let reachedTerminalNode = true
          childrenCounter += (child.children).length
          for (const child2 of child.children) {
            childrenCounter += (child2.children).length
            for (const child3 of child2.children) {
              childrenCounter += (child3.children).length
              for (const child4 of child3.children) {
                childrenCounter += (child4.children).length
                for (const child5 of child4.children) {
                  childrenCounter += (child5.children).length
                  if ((child5.children).length !== 0) {
                    reachedTerminalNode = false
                  }

                  if (reachedTerminalNode && childrenCounter <= maxNumChildren) {
                  loopThroughSubTree.push(child5)
                  }
                }
                if (reachedTerminalNode && childrenCounter <= maxNumChildren) {
                  loopThroughSubTree.push(child4)
                }
              }
              if (reachedTerminalNode && childrenCounter <= maxNumChildren) {
                loopThroughSubTree.push(child3)
              }
            }
            if (reachedTerminalNode && childrenCounter <= maxNumChildren) {
              loopThroughSubTree.push(child2)
            }
          }
          if (reachedTerminalNode && childrenCounter <= maxNumChildren) {
            loopThroughSubTree.push(child)
          }
        }
      }

      const wordHits = new Set()
      for (const nodeElement of loopThroughSubTree) {
        // STEP 4.2: COMPARE THE VALUES TO THE WORD CORPUS
        // Get the text of the Node (if any)
        const text = nodeElement.textContent.trim() // this should return an empty string if no text is found. it should not throw an error
        
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

          if (matchingWords.length > 0) {
            // Set, so only unique values will be added.
            // This is to encourage matching different words, rather than the same over and over again (like a script setting 500 "cookies")
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
      if (wordHits.size > maxNumHits || (wordHits.size === maxNumHits && loopThroughSubTree.length < subTree.length )) {
        console.log(`Found a better match. Used to be ${maxNumHits} hits vs now ${wordHits.size}. The new words '${[...wordHits]}' will replace '${maxWordHits}'`)
        maxNumHits = wordHits.size
        maxWordHits = [...wordHits]
        subTree = loopThroughSubTree
      }
    }

    if (Number(maxNumHits) > 0) {
      const subTreeInfo = subTree.map(nodeElement => {
        const classAttribute = nodeElement.getAttribute('class')
        return classAttribute ? { class: classAttribute.split(' ').join('.') } : null // joins multi word class names with . to form a valid one for puppeteer to search with
      })
        .filter(Boolean) // remove null values
      return [subTreeInfo, maxWordHits]
    } else {
      return null // No banner on the page
    }
  }, wordCorpus, maxNumParents, maxNumChildren)
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
      if (nodeInfo.class === null) { continue }
  
      try {
        const elementHandle = await page.$(`.${nodeInfo.class}`)
        const isVisible = await elementHandle.isVisible()
        visibleArray.push(isVisible)
      } catch (error) { console.log("Error accessing element handle's visibility") }
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
  
  async function saveCookieBannerData (browser, websiteUrl, cookieBannerInfo, visibility, type, resultPath) {
    const file = createWriteStream(`${resultPath}/${browser}_bannerInfo.txt`, { flags: 'a' })
  
    file.on('error', function (err) {
      console.log(err)
    })

    if (type === 1)  {
      file.write(`${websiteUrl} --> No cookie banner has been found on the page.\n`)
      file.end()
    } else if (type === 2) {
      const wordMatches = cookieBannerInfo[1]
      if (wordMatches.length < 2) {
        file.write(`${websiteUrl} --> No cookie banner has been found on the page. Only found words ${wordMatches}.\n`)
        const file2 = createWriteStream(`${resultPath}/${browser}_bannerDecisions.txt`, { flags: 'a' })
        file2.on('error', function (err) {
          console.log(err)
        })
        file2.write(`${websiteUrl} nobanner\n`)
        file2.end()
        file.end()
      } 
    } else if (type === 3) {
      const wordMatches = cookieBannerInfo[1]
      if (visibility === null) {
        file.write(`${websiteUrl} --> Cannot assess visibility of cookie banner. Banner Info: ${wordMatches}.\n`)
        file.end()
      } else {
      const subtreeLength = cookieBannerInfo[0].length
      // const wordMatches = cookieBannerInfo[1]
      const visibilityDecision = visibility[0]
      
      file.write(`${websiteUrl} --> Is visible? ${visibilityDecision} (${visibility[1]}/${visibility[1]+visibility[2]}). Banner Info: ${wordMatches}. Analysed ${subtreeLength} elements. \n`)
      file.end()

      const file2 = createWriteStream(`${resultPath}/${browser}_bannerDecisions.txt`, { flags: 'a' })
  
      file2.on('error', function (err) {
        console.log(err)
      })
      file2.write(`${websiteUrl} ${visibilityDecision}\n`)
      file2.end()
    }
  }
}

export async function allInDetermineCookieBannerState (page, wordCorpus, maxNumParents, maxNumChildren, websiteUrl, browser, connection, crawlID, resultPath) {
  const cookieBannerInfo = await ALLINONE(page, wordCorpus, maxNumParents, maxNumChildren)

  // If no banner has been found, or if less than 2 words have been found.
  if (cookieBannerInfo === null) {
    console.log('No banners were found on the page (no words).')
    await saveCookieBannerData(browser, websiteUrl, cookieBannerInfo, null, 1, resultPath)
  } else if (cookieBannerInfo[1].length < 2) {
    console.log('No banners were found on the page (too little words).')
    await saveCookieBannerData(browser, websiteUrl, cookieBannerInfo, null, 2, resultPath)
  } else {
    const visibility = await checkBannerVisibility(page, cookieBannerInfo)
    await saveCookieBannerData(browser, websiteUrl, cookieBannerInfo, visibility, 3, resultPath)
  }
}
