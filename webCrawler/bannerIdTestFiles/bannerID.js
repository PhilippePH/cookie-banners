/*
Step 1. Get all terminal nodes
Step 2. Filter terminal nodes --> keep only those with at least one word match
Step 3. Get the x-th parent of the terminal nodes
Step 4. Analyse from the x-th parent down, recursively, for all children
Step 5. Choose the sub-tree that has the maximum number of hits
Step 6. Call isVisible on the most prolific child (as well as the others in the tree)
*/

export async function ALLINONE (page, wordCorpus, maxNumParents, maxNumChildren) {
  const returnValue = await page.evaluate((wordCorpus, maxNumParents) => {
    const wordCopursArray = wordCorpus.split(',')

    // STEP 1. GET ALL THE TERMINAL NODES
    const allElements = document.querySelectorAll('*')
    const terminalNodes = []

    // Filter out elements with children
    for (const element of allElements) {
      if (element.children.length === 0) {
        terminalNodes.push(element)
      }
    }

    console.log(terminalNodes)

    // STEP 2. FILTER THE TERMINAL NODES
    const filteredNodes = []

    for (const nodeElement of terminalNodes) {
      // STEP 2.1: COMPARE THE VALUES TO THE WORD CORPUS
      // Get the text of the Node (if any)
      const text = nodeElement.textContent.trim() // this should return an empty string if no text is found. it should not throw an error

      if (text.length > 0) {
        const wordsArray = text.split(/\s+/)

        // Check if any word from the corpus is in the text
        const matchingWords = wordCopursArray.filter(corpusWord =>
          wordsArray.some(nodeWord => nodeWord.toLowerCase() === corpusWord) // THIS ONLY CHECK 1-WORD SEARCH TERMS
        )

        if (matchingWords.length > 0) {
          filteredNodes.push(nodeElement)
        }
      }
    }
    // console.log(`There are ${counter} terminal nodes.`)
    // console.log(`They have been filtered down to a shortlist of ${filteredNodes.length} nodes.`)

    // STEP 3. GET THE PARENTS
    const subTreesParents = []
    for (const nodeElement of filteredNodes) {
      let parent
      for (let i = 0; i < maxNumParents; i++) { // getting the i-th parent
        parent = nodeElement.parentElement
      }
      subTreesParents.push(parent)
    }

    // STEP 4. ANALYSE THE SUBTREES
    let maxNumHits = 0
    let maxWordHits
    // let bannerElement
    let subTree

    for (const parent of subTreesParents) {
      // STEP 4.1: Get the list of parent and all children
      const loopThroughSubTree = [parent]

      // THIS USED TO BE RECURSIVE, BUT I DON'T THINK I CAN DO THIS HERE??????????????????????????????????????????
      for (const child of parent.children) {
        loopThroughSubTree.push(child)

        for (const child2 of child.children) {
          loopThroughSubTree.push(child2)

          for (const child3 of child2.children) {
            loopThroughSubTree.push(child3)

            for (const child4 of child3.children) {
              loopThroughSubTree.push(child4)

              for (const child5 of child4.children) {
                loopThroughSubTree.push(child5)
              }
            }
          }
        }
      }

      const wordHits = new Set()
      for (const nodeElement of loopThroughSubTree) {
        // STEP 4.2: COMPARE THE VALUES TO THE WORD CORPUS
        // Get the text of the Node (if any)
        const text = nodeElement.textContent.trim() // this should return an empty string if no text is found. it should not throw an error

        if (text.length > 0) {
          const wordsArray = text.split(/\s+/)

          // Check if any word from the corpus is in the text
          const matchingWords = wordCopursArray.filter(corpusWord =>
            wordsArray.some(nodeWord => nodeWord.toLowerCase() === corpusWord) // THIS ONLY CHECK 1-WORD SEARCH TERMS
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
        }
      }
      console.log(wordHits.size)
      // STEP 4.3: UPDATE THE BEST CANDIDATE IF FOUND
      if (wordHits.size > maxNumHits) {
        maxNumHits = wordHits.size
        maxWordHits = [...wordHits]
        //  bannerElement = parent
        subTree = loopThroughSubTree
      }
    }

    // console.log(`Best candidate has ${maxNumHits} matches: ${maxWordHits}`)

    if (Number(maxNumHits) > 0) {
      const subTreeInfo = subTree.map(nodeElement => {
        const classAttribute = nodeElement.getAttribute('class')
        return classAttribute ? { class: classAttribute.split(' ').join('.') } : null // joins multi word class names with . to form a valid one for puppeteer to search with
      })
        .filter(Boolean) // remove null values

      console.log(subTreeInfo)
      return [subTreeInfo, maxWordHits]
    } else {
      console.log('There are not banners on the page.')
      return null
    }
  }, wordCorpus, maxNumParents)

  // BACK IN BROWSER CONTEXT
  // STEP 5. SEE IF THE BEST CANDIDATE IS VISIBLE
  if (returnValue == null) {
    console.log('No banners were found on the page.')
    return null
  }

  // Unpack non-null return values
  const subTree = returnValue[0]
  const wordMatches = returnValue[1]
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
