import csv

# The ground truth values has already filtered out the values that we do NOT want to consider in the accuracy test
# Removed sites that had not loaded, that were not in english, and a few others that were manually remvoed (see top250websites file for reasons.)
# It contains websites with, and without cookie banners as well as the prediction of each browser
pathGroundValues = "top250banners/top250(50)banners_allBrowsers.csv"
Ground_Domain = 0
Ground_BannerPresent = 1
browserColumns = {"Brave": 2, "Firefox": 3, "Ghostery": 4, "Google Chrome": 5}

def getGroundTruth(browser):
    data = []

    with open(pathGroundValues, 'r', newline='\n') as csvfile:
        csv_reader = csv.reader(csvfile)
        for row in csv_reader:
            # Skipping rows for which there are no predictions
            if row[browserColumns[browser]]=="Yes" or row[browserColumns[browser]]=="No":
                # Keeping domain, and the prediction (saves True if prediction is Yes, false if it is No)
                data.append([row[Ground_Domain], (row[browserColumns[browser]]=="Yes")]) # selecting the correct browser column to assess the accuracy of the tools for said browser
    
    return data

def getResults(pathResults):
    results = []

    with open(pathResults, 'r') as txtfile:
        for line in txtfile:
            columns = line.strip().split(",")
            if len(columns) == 3:
                columns.append("_")
            results.append(columns)
    
    return results

def compareValues(trueData, results):
    trueDataDomain = 0
    trueDataBanner = 1
    Results_Domain = 0
    Results_BannerFound = 3
    
    for resultRow in results:
        # Get the right row with sitename
        sitename = (resultRow[Results_Domain].split("."))[0] #removing .html --> will be of format sitename_tld

        for trueDataRow in trueData:
            if sitename == trueDataRow[trueDataDomain]: # format must be sitename_tld
                boolValue = (resultRow[Results_BannerFound]=="True")

                # Append if the result was correct
                resultRow.append(boolValue==trueDataRow[trueDataBanner])
    return results

def evaluatePerformance(appendedResults):
    
    appendedResults_Domain= 0
    appendedResults_Corpus = 1
    appendedResults_Threshold = 2
    appendedResults_BannerFound = 3
    appendedResults_WordsFound = 4
    appendedResults_CorrectnessOfPrediction = 5
    

    # key = hyperparamValues, values = [correctlyPredicted, uncorrectlyPredicted, falsePositive, falseNegative]
    performance = {}  

    for row in appendedResults:
        # For websites which don't have a match
        if len(row) != 6:
            continue

        dictKey = row[appendedResults_Corpus] + "--" + row[appendedResults_Threshold]
        
        prediction = (row[appendedResults_BannerFound] == "True")
        CorrectnessOfPrediction = row[appendedResults_CorrectnessOfPrediction]

        # If predictions were correct
        if CorrectnessOfPrediction:
            if performance.get(dictKey):
                performance[dictKey][0] += 1 # Adding to existant key
            else:
                performance[dictKey] = [1,0,0,0] # Initialising dict
        
        # If predicitions were wrong
        else:
            # Check if false negative or false positive (check the prediction, if it is labelled "True" then false positive)
            # FALSE POSITIVE
            if prediction:
                if performance.get(dictKey):
                    performance[dictKey][1] += 1 # Adding to existant key
                    performance[dictKey][2] += 1 # Add to false positive
                else:
                    performance[dictKey] = [0,1,1,0] # Initialising dict
            # FALSE NEGATIVE
            else:
                if performance.get(dictKey):
                    performance[dictKey][1] += 1 # Adding to existant key
                    performance[dictKey][3] += 1 # Add to false negative
                else:
                    print("HEY")
                    performance[dictKey] = [0,1,0,1] # Initialising dict
        
        # Print the line result
        bannerPresence = "HAS"
        printCorrectness = "accurate"
        if CorrectnessOfPrediction:
            if not prediction:
                bannerPresence = "HAS NOT"
        else:
            printCorrectness = "NOT accurate"
            if prediction:
                bannerPresence = "HAS NOT"

        # if not Correctness: # printing only incorrect predictions
        if not CorrectnessOfPrediction:
            print(f"[The prediction was {printCorrectness}. Algorithm {dictKey} predicted {prediction}.] : {row[appendedResults_Domain]} {bannerPresence} a banner. Words found: {row[appendedResults_WordsFound]}")

    for dictKey in performance.keys():
        res = performance[dictKey]
        percentageCorrect = res[0]/(res[0]+res[1])
        print(f"{dictKey}: {round(percentageCorrect * 100, 2)} % correct predictions ({res[0]} well predicted out of {res[0]+res[1]}). {res[2]} false positives, and {res[3]} false negatives")


def main(results_path, browser):
    trueData = getGroundTruth(browser) # Open ground truth. Get list of [url:bannerPresent] (bannerPresent: t/f)
    results = getResults(results_path) # Open results

    # Compare ground truth to results. Append to the results a column to say if correct or not.
    appendedResults = compareValues(trueData, results)

    # PER PAIR OF HYPERPARAM (corpus<->threshold):
    evaluatePerformance(appendedResults)

if __name__ == '__main__':
    main()