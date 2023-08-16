import csv

pathGroundValues = "top250websites.csv"
pathResults = "./top250banners/top250html/bannerIdentificationResults.txt"


def getGroundTruth():
    data = []

    with open(pathGroundValues, 'r', newline='\n') as csvfile:
        csv_reader = csv.reader(csvfile)
        for row in csv_reader:
            data.append([row[0], (row[2]=="Yes")])

    return data

def getResults():
    results = []

    with open(pathResults, 'r') as txtfile:
        for line in txtfile:
            columns = line.strip().split(",")
            if len(columns) == 3:
                columns.append("_")
            results.append(columns)
    
    return results

def compareValues(trueData, results):
    for resultRow in results:
        # Get the right row with sitename
        sitename = (resultRow[0].split("."))[0] #removing .html
        # sitename = (sitename.split("_"))[1] #removing browser_

        for trueDataRow in trueData:
            if sitename == (trueDataRow[0].split("."))[0]:
                boolValue = (resultRow[3]=="True")

                # Append if the result was correct
                resultRow.append(boolValue==trueDataRow[1])
    return results

def evaluatePerformance(appendedResults):
    performance = {}  # key = hyperparamValues, values = [correctlyPredicted, uncorrectlyPredicted, falsePositive, falseNegative]
    for row in appendedResults:

        # For websites which don't have a match
        if len(row) != 6:
            print(row)
            continue
        dictKey = row[1] + "--" + row[2]
        prediction = row[3]
        accuracyOfPrediction = row[5]

        # If predictions were correct
        if accuracyOfPrediction:
            if performance.get(dictKey):
                performance[dictKey][0] += 1 # Adding to existant key
            else:
                performance[dictKey] = [1,0,0,0] # Initialising dict
        
        # If predicitions were wrong
        else:
            # Check if false negative or false positive (check the prediction, if it is labelled "True" then false positive)
            if prediction:
                if performance.get(dictKey):
                    performance[dictKey][1] += 1 # Adding to existant key
                    performance[dictKey][2] += 1 # Add to false positive
                else:
                    performance[dictKey] = [0,1,1,0] # Initialising dict
            else:
                if performance.get(dictKey):
                    performance[dictKey][1] += 1 # Adding to existant key
                    performance[dictKey][3] += 1 # Add to false negative
                else:
                    performance[dictKey] = [0,1,0,1] # Initialising dict

    for dictKey in performance.keys():
        res = performance[dictKey]
        percentageCorrect = res[0]/(res[0]+res[1])
        print(f"{dictKey}: {round(percentageCorrect * 100, 2)} % correct predictions ({res[0]} well predicted out of {res[0]+res[1]}). {res[2]} false positives, and {res[3]} false negatives")


def main():
    # Open ground truth. Get list of [url:bannerPresent] (bannerPresent: t/f)
    trueData = getGroundTruth()

    # Open results
    results = getResults()

    # Compare ground truth to results. Append to the results a column to say if correct or not.
    appendedResults = compareValues(trueData, results)

    # PER PAIR OF HYPERPARAM (corpus<->threshold):
    evaluatePerformance(appendedResults)
    # Get Accuracy
    # Get false positive
    # Get false negative

main()