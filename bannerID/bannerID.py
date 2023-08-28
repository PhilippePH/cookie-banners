from bs4 import BeautifulSoup
import os

"""
- we assume a cookie banner if there is an element / sub-tree on the page that contains less than 5% of the nodes on the page
- that element/subtree contains at least X of the following phrases: cookie, accept all, reject, etc --> add translation in a couple of languages
"""

# Must be in descending values because no copies of array are being made. 
# THRESHOLD_TEST_VALUES = [1, 0.5, 0.25, 0.10, 0.05, 0.01]
THRESHOLD_TEST_VALUES = [0.0001]
# THRESHOLD_TEST_VALUES = [0.01, 0.005, 0.001, 0.0001]

# Smallest corpus to find hits in all tests
# ADDED COOKIE AND COOKIES AS WORDS.. THEY SHOULD'VE BEEN THERE ALREADY
CORPUS_1 = [ 'cookie', 'cookies', 'agree', 'i agree', 'accept', 'accept all', 'accept cookies',
            'i accept','reject', 'reject all', 'decline', 'cookie preferences',
            'manage cookies',  'preferences', 'learn more',  'more information',
            'privacy policy', 'privacy statement', 'cookie policy','cookie notice',
            'our partners', 'partners',  'third-party']

# All relevant words
# After doing some tests, "Ok" leads to way too many false positives. Removed to give corpus 2 a figthing chance
CORPUS_2 = ['cookie', 'cookies','agree', 'i agree','accept', 'accept all', 'accept cookies', 'i accept',
            'allow all', 'enable all', 'got it', 'allow cookies', 'reject',
            'reject all', 'decline', 'mandatory only', 'required only', 'not accept',
            'disable all', 'disagree', 'decline cookies', 'decline all',
            'mandatory', 'optional cookies', 'essential cookies',
            'non-essential cookies','strictly necessary', 'necessary cookies',
            'required', 'essential', 'non-essential',  'cookie preferences',
            'manage cookies',  'preferences', 'cookies options','consent manager',
            'customize cookies', 'cookie options', 'cookies settings', 'manage settings',
            'manage preferences', 'more options', 'learn more',  'more information',
            'show purposes', 'further information', 'more options', 'privacy policy',
            'privacy statement', 'cookie policy','cookie notice', 'our partners',
            'partners', 'third party', 'vendors', 'similar technologies',
            'other technologies']

CORPUS_3 = ['cookie', 'cookies', 'accept', 'reject', 'policy']
CORPUS_4 = ['accept', 'reject', 'policy', 'agree', 'consent']
CORPUS_5 = ['agree', 'i agree', 'accept', 'accept all', 'accept cookies',
            'i accept','reject', 'reject all', 'decline', 'cookie preferences',
            'manage cookies', 'preferences', 'learn more', 'more information',
            'privacy policy', 'privacy statement', 'cookie policy', 'cookie notice', 'third-party']
CORPUS_6 = ['agree', 'i agree','accept', 'accept all', 'accept cookies', 'i accept',
            'ok','allow all', 'enable all', 'got it', 'allow cookies', 'reject',
            'reject all', 'decline', 'mandatory only', 'required only', 'not accept',
            'disable all', 'disagree', 'decline cookies', 'decline all',
            'mandatory', 'optional cookies', 'essential cookies',
            'non-essential cookies','strictly necessary', 'necessary cookies',
            'required', 'essential', 'non-essential',  'cookie preferences',
            'manage cookies',  'preferences', 'cookies options','consent manager',
            'customize cookies', 'cookie options', 'cookies settings', 'manage settings',
            'manage preferences', 'more options', 'learn more',  'more information',
            'show purposes', 'further information', 'more options', 'privacy policy',
            'privacy statement', 'cookie policy','cookie notice', 'our partners',
            'partners', 'third party', 'vendors', 'similar technologies',
            'other technologies']
CORPUS_7 = ['cookies', 'privacy', 'policy', 'consent', 'accept', 'agree', 'personalized', 'legitimate interest']

CORPUS_TEST_VALUES = [CORPUS_1,CORPUS_4, CORPUS_2, CORPUS_5, CORPUS_3, CORPUS_4,CORPUS_7]
CORPUS_NAMES = ["shortCorpus","shortCorpus_nocookie","longCorpus","longCorpus_nocookie","shortestCorpus","shortestCorpus_nocookie","exploringTheCookieVerseCorpus"]


def parseHtmlDir(html_directory_path, filename):
        complete_filename = html_directory_path+filename
        html_file = open(complete_filename,'r')
        return BeautifulSoup(html_file, 'html.parser')

def countNodes(element, recordsArr):
    childrenNodeCounter = 1 #counting self

    if hasattr(element, 'children'):
        for child in element.children:
            returnValues = countNodes(child, recordsArr)
            recordsArr = returnValues[0]
            childrenNodeCounter += returnValues[1]

    recordsArr.append([element, childrenNodeCounter])

    return (recordsArr, childrenNodeCounter)

def keepSmallNodes(recordsArr, totNodes, threshold):
    numberThreshold =  max(1, threshold * totNodes)
    i = 0 

    while i < len(recordsArr):
        if recordsArr[i][1] > numberThreshold: #if more child nodes than threshold, remove it
            recordsArr.pop(i)
            continue
        i += 1
    return recordsArr #return only the elements that are lower than the threshold 


def findBanner(recordsArr, corpus):
    bestMatch = []
    elem = None
    maxLength = 0

    for values in recordsArr:
        element = values[0]
        words_found = []

        if not hasattr(element, 'text'):
            continue
        text = element.text

        for word in corpus:
            if word in text:
                words_found.append(word)

        if len(words_found) > maxLength:
            elem = element
            bestMatch = words_found

    return (elem, bestMatch) # return the best match

def isBannerHidden(element):
    # print(element)
    # Check element characteristic, though might need to move around.
    # Check children
    # Check 1 or 2 above?
    # If a hidden if found return True
    return False



def main(directory_path):
    html_directory_path = directory_path + "htmlFiles/"
    filePath = directory_path+'bannerIdentificationResults.txt'

    #Clear results of previous run
    with open(filePath, 'w') as file:
        file.write("")

    iterableDir = os.fsencode(html_directory_path)
    for file in os.listdir(iterableDir):
        # Parsing the current file
        filename = os.fsdecode(file)

        try:
            soup = parseHtmlDir(html_directory_path, filename)
        except:
            print("Could not parse file " + filename)

        # Get the node count per element
        returnValues = countNodes(soup.html, [])
        recordsArr = returnValues[0]
        totNodes = returnValues[1]
        
        for threshold in THRESHOLD_TEST_VALUES:
            # Get small nodes
            # RecordsArr gets modified in the function (the = is just to make it clear)
            # Ensure that the threshold loops from largest to smallest values
            recordsArr = keepSmallNodes(recordsArr, totNodes, threshold)
            
            for corpusIndex in range(len(CORPUS_TEST_VALUES)):
                # Search the small nodes until find the cookie banner
                element, result = findBanner(recordsArr, CORPUS_TEST_VALUES[corpusIndex])
                found = (len(result) > 0)

                # Check if the banner has been hidden
                if found:
                    hidden = isBannerHidden(element) 

                # Add the result to the result file --> write filename, true/false, the words that were found
                with open(filePath, 'a') as file:
                    result_str = '/'.join(result)  # Convert the list to a /-separated string (commas used to separate columns)
                    file.write(filename + "," + CORPUS_NAMES[corpusIndex] + "," + str(threshold) + "," + str(found) + "," + result_str + "\n")
    return filePath



if __name__ == '__main__':
    main()