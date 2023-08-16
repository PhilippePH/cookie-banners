from bs4 import BeautifulSoup
import os

"""
- we assume a cookie banner if there is an element / sub-tree on the page that contains less than 5% of the nodes on the page
- that element/subtree contains at least X of the following phrases: cookie, accept all, reject, etc --> add translation in a couple of languages
"""

HTML_DIRECTORY_PATH = "./top250banners/top250html/"
THRESHOLD_TEST_VALUES = [0.01, 0.05, 0.1, 0.15, 0.2]

# Smallest corpus to find hits in all tests
CORPUS_1 = ['agree', 'i agree', 'accept', 'accept all', 'accept cookies',
            'i accept','reject', 'reject all', 'decline', 'cookie preferences',
            'manage cookies',  'preferences', 'learn more',  'more information',
            'privacy policy', 'privacy statement', 'cookie policy','cookie notice',
            'our partners', 'partners',  'third-party', 'similar technologies']

# All relevant words
CORPUS_2 = ['agree', 'i agree','accept', 'accept all', 'accept cookies', 'i accept',
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

CORPUS_TEST_VALUES = [CORPUS_1, CORPUS_2]
CORPUS_NAMES = ["shortCorpus","longCorpus"]

def parseHtmlDir(filename):
        complete_filename = HTML_DIRECTORY_PATH+filename
        html_file = open(complete_filename,'r')
        return BeautifulSoup(html_file, 'html.parser')

def countNodes(element, recordsArr):
    childrenNodeCounter = 0

    if hasattr(element, 'children'):
        for child in element.children:
            returnValues = countNodes(child, recordsArr)
            recordsArr = returnValues[0]
            childrenNodeCounter += returnValues[1]

    recordsArr.append([element, childrenNodeCounter])
    return (recordsArr, childrenNodeCounter)

def keepSmallNodes(recordsArr, totNodes, threshold):
    numberThreshold =  threshold * totNodes

    for i in range(len(recordsArr)):
        if recordsArr[i][1] > numberThreshold:
            recordsArr.pop(i)
            
    return recordsArr     


def findBanner(recordsArr, corpus):
    bestMatch = []
    maxLength = 0
    for values in recordsArr:
        element = values[0]
        text = element.text
        words_found = []

        for word in corpus:
            if word in text:
                words_found.append(word)

        if len(words_found) > maxLength:
            bestMatch = words_found

    return bestMatch # return the best match


def main():
    iterableDir = os.fsencode(HTML_DIRECTORY_PATH)
    for file in os.listdir(iterableDir):
        # Parsing the current file
        filename = os.fsdecode(file)
        try:
            soup = parseHtmlDir(filename)
        except:
            print("Could not parse file " + filename)

        # Get the node count per element
        returnValues = countNodes(soup.html, [])
        recordsArr = returnValues[0]
        totNodes = returnValues[1]

        
        for corpusIndex in range(len(CORPUS_TEST_VALUES)):
            for threshold in THRESHOLD_TEST_VALUES:
                # Get small nodes
                recordsArr = keepSmallNodes(recordsArr, totNodes, threshold)

                # Search the small nodes until find the cookie banner
                result = findBanner(recordsArr, CORPUS_TEST_VALUES[corpusIndex])
                found = (len(result) > 0)
                # Add the result to the result file --> write filename, true/false, the words that were found
                filePath = HTML_DIRECTORY_PATH+'bannerIdentificationResults.txt'
                with open(filePath, 'a') as file:
                    result_str = '/'.join(result)  # Convert the list to a /-separated string (commas used to separate columns)
                    file.write(filename + "," + CORPUS_NAMES[corpusIndex] + "," + str(threshold) + "," + str(found) + "," + result_str + "\n")


if __name__ == '__main__':
    main()