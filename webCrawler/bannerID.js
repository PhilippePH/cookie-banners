const WORD_CORPUS = [];

async function getTerminalNodes(page){
    const terminalNodes = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        const terminalNodes = [];
    
        // Filter out elements with children
        for (const element of allElements) {
          if (element.children.length === 0) {
            terminalNodes.push(element);
          }
        }
    
        return terminalNodes;
      });
    return terminalNodes;
}

// Checks if a node has at least 1 word match. Returns candidates {node, numMatch, the matched words}
async function assessCorpus(page, element, WORD_CORPUS){

    // Get the text of the Node (if any)
    let text = await page.evaluate(function(nodeElement) {
        return nodeElement.textContent.trim(); // this should return an empty string if no text is found. it should not throw an error
    }, element);
    
    if(text.length > 0){
        const wordsArray = text.split(/\s+/); 

        // Check if any word from the corpus is in the text
        const matchingWords = WORD_CORPUS.filter(corpusWord =>
            wordsArray.some(nodeWord => nodeWord.toLowerCase() === corpusWord) // THIS ONLY CHECK 1-WORD SEARCH TERMS
        );

        return matchingWords;
    }
    return []; // is returning an empty array the thing to do here?
}

async function filterTerminalNodes(terminalNodes){
    console.log(`There are ${terminalNodes.length} terminal nodes.`);

    let shortlist = [];
    for(node of terminalNodes){
        let matches = assessCorpus(node);
        if(matches.length > 0){
            shortlist.push(node);
        }
    }
    console.log(`They have been filtered down to a shortlist of ${shortlist.length} nodes.`);
    return shortlist;
}

async function getsubTrees(shortlist){
    for(node of shortlist){
        let parent = await page.evaluate(function(nodeElement) {
            return nodeElement.parentElement.parentElement.parentElement.parentElement.parentElement; // improve this, with a flexible threshold.
          }, node);
    }
}


// This is to rercusively loop through all the children of the parent
async function getBannerElement(element){
    let results = await getCandidates(page, parent);
    for(const child of parent.children){
        new_results = getBannerElement(child); // this recursive call ensures we visit all the children in the sub-tree
        results.append(new_results)
    }
}

// This is to launch the recursive search for all parents in the shortlist
async function selectBannerElement(shortlist){
    for(const parent of shortlist){
        getBannerElement(parent)
    }

    // Select the banner with the maximum number of words hits
    // If there is an equality, select the Parent with the minimum number of children (to ensure we don't have an extra div lying around)

    // Return the "best child" of this winner-parent, i.e. the one with the most word matches. isVisible will be called on this child as we are certain it is part of the banner.
}


// HERE I SHOULD ACTUALLY LOOP THROUGH ALL THE CHILDREN TO SEE IF THE RESULTS DIFFER
async function isBannerVisible(bannerElement){
    // TBD
    // Convert the raw HTML element to an ElementHandle
    const elementHandle = await page.evaluateHandle(function(element){
        return element
    }, bannerElement);

    // Check if the element is visible
    const isVisible = await elementHandle.isVisible();
    console.log('Is element visible?', isVisible);
    return isVisible;
}


async function identifyBanner(page, wordCorpus, cutoff = 5){
    const terminalNodes = await getTerminalNodes(page);
    const subTrees = await getsubTrees(terminalNodes);
    const candidateBanners = await getCandidates(page, terminalNodes);
    const bannerElement = await getBannerElement(candidateBanners);
    const bannerVisible = await isBannerVisible(bannerElement);
}