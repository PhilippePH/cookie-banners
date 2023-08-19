import sys
import bannerID
import calculateAccuracy

def getDirectory(browser, trainFlag):
    if trainFlag:
        return "./top250banners/"+browser+"/"
    else:
        print("NEED TO DEFINE WHERE THE REAL FILES WILL BE")
        exit

def main():
    args = sys.argv
    browser = args[1]
    trainFlag = args[2]
    path = args[3]

    if path == '0':
        directory = getDirectory(browser, trainFlag)
        results_path = bannerID.main(directory)
        path = results_path
    
    calculateAccuracy.main(path, browser)

if __name__ == '__main__':
    main()
# bannerID/top250banners/Google Chrome/bannerIdentificationResults.txt