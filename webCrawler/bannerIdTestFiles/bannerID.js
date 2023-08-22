/*
Step 1. Get all terminal nodes
Step 2. Filter terminal nodes --> keep only those with at least one word match
Step 3. Get the x-th parent of the terminal nodes
Step 4. Analyse from the x-th parent down, recursively, for all children
Step 5. Choose the sub-tree that has the maximum number of hits
Step 6. Call isVisible on the most prolific child (as well as the others in the tree)
*/

async function getTerminalNodes(page){
    let terminalNodes = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        console.log(allElements);
        let terminalNodes = [];
    
        // Filter out elements with children
        for (const element of allElements) {
            console.log(element)
            if (element.children.length === 0) {
                console.log("TRUE")
                terminalNodes.push(element);
            }
        }
    
        console.log("terminal nodesinside ", terminalNodes);
        return terminalNodes;
      });
    
    console.log("Terminal nodes:", terminalNodes);
    return terminalNodes;
}

// Checks if a node has at least 1 word match. Returns candidates {node, numMatch, the matched words}
async function assessCorpus(page, element, wordCorpus){

    // Get the text of the Node (if any)
    let text = await page.evaluate(function(nodeElement) {
        return nodeElement.textContent.trim(); // this should return an empty string if no text is found. it should not throw an error
    }, element);
    
    if(text.length > 0){
        const wordsArray = text.split(/\s+/); 

        // Check if any word from the corpus is in the text
        const matchingWords = wordCorpus.filter(corpusWord =>
            wordsArray.some(nodeWord => nodeWord.toLowerCase() === corpusWord) // THIS ONLY CHECK 1-WORD SEARCH TERMS
        );

        return matchingWords;
    }
    return []; // is returning an empty array the thing to do here?
}

async function filterTerminalNodes(page, wordCorpus){
    let counter = 0;
    let shortlist = [];

    const terminalNodes = await getTerminalNodes(page);
    for (const node of terminalNodes) {
        counter ++;
        let matches = await assessCorpus(page, node, wordCorpus);
        if(matches.length > 0){
            shortlist.push(node);
        }
    }
    console.log(`There are ${counter} terminal nodes.`);
    console.log(`They have been filtered down to a shortlist of ${shortlist.length} nodes.`);
    return shortlist;
}


// HERE ADD A LIMIT ON NUMBER OF CHILDREN
async function getsubTrees(page, wordCorpus, maxNumParents, maxNumChildren){
    let parents = [];
    const filteredNodes = await filterTerminalNodes(page, wordCorpus); 
    for (const node of filteredNodes) {
        // Get the subTree parents
        let parent = await page.evaluate(function(nodeElement) {
                let parent;
                for(let i = 0; i < maxNumParents; i++){
                    parent = nodeElement.parentElement;
                }
                return parent;
          }, node);
        parents.push(parent)
    }
    return parents;
}


// This is to rercusively loop through all the children of the parent
async function getBannerElement(page, element, wordCorpus){
    let results = await assessCorpus(page, element, wordCorpus);
    for(const child of element.children){
        let newResults = await getBannerElement(page, child, wordCorpus); // this recursive call ensures we visit all the children in the sub-tree
        results.push(...newResults); // adds each value of new result as a value in result (rather than adding it as an array)
    }
    return results;
}

// This is to launch the recursive search for all parents in the shortlist
async function selectBannerElement(page, wordCorpus, maxNumParents, maxNumChildren){
    let maxNumHits = 0;
    let maxWordHits;
    let bannerElement;

    // Select the best banner candidate based on word hits, (ADD: and minimising children)
    let subTreesParents = await getsubTrees(page, wordCorpus, maxNumParents, maxNumChildren);
    for (const parent of subTreesParents){
       let wordHits = await getBannerElement(page, parent, wordCorpus);
        if(wordHits.length > maxNumHits){
            maxNumHits = wordHits.length;
            maxWordHits = wordHits;
            bannerElement = parent;
        }
    }
    console.log(`Best candidate has ${maxNumHits} matches: ${maxWordHits}`);
    return bannerElement;
}

async function recursiveIsBannerVisible(page, wordCorpus, parentCutoff, childrenCutoff){
    let visibleArray = [];
    let element = await selectBannerElement(page, wordCorpus, parentCutoff, childrenCutoff);
    for (const child of element.children){
        let results = await recursiveIsBannerVisible(child);
        visibleArray.push(...results);
    } 

    const elementHandle = await page.evaluateHandle(function(element){
        return element
    }, element);

    // Check if the element is visible
    const isVisible = await elementHandle.isVisible();
    visibleArray.push(isVisible);

    return visibleArray;
}


// HERE I SHOULD ACTUALLY LOOP THROUGH ALL THE CHILDREN TO SEE IF THE RESULTS DIFFER
export async function isBannerVisible(page, wordCorpus, parentCutoff = 5, childrenCutoff=20){
    const visibleArray = await recursiveIsBannerVisible(page, wordCorpus, parentCutoff, childrenCutoff);
    
    console.log('Is element visible?', visibleArray);

    const trueCount = visibleArray.filter(value => value === true).length;
    const falseCount = visibleArray.length - trueCount;
  
    console.log("Final decision: ", trueCount > falseCount ? true : false);

    return trueCount > falseCount ? true : false;
}
