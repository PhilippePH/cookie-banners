"""
Simple word counter to analyze the word frequency in top-20 cookie banners
"""
import os
import pandas as pd

# https://nlp.stanford.edu/IR-book/html/htmledition/dropping-common-terms-stop-words-1.html
# https://stackoverflow.com/questions/41011521/count-frequency-of-word-in-text-file-in-python
# and high frequency words returned by previous itterations that can't be used to identify banners
IGNORE_WORDS = ['a', 'also', 'an', 'and', 'at','are','any', 'as',
                'be', 'but', 'by',
                'can',
                'has',
                'for','from',
                'in', 'into', 'is', 'its', 'if',
                'of','out', 'on', 'our','or',
                'the', 'them','then','their','to','too','that','these','this',
                'us', 'use',
                'we','when', 'was', 'were', 'will', 'with',
                'you','your',
                ]
ALLOWED_EXPRESSIONS = ['learn more', 'accept all', 'reject all', 'cookie settings', 'cookie preferences', 'more options', 'cookie policy', 'privacy policy', 'manage cookies', 'privacy statement']

path = "bannerID/top20banners/train_files"
directory = os.fsencode(path)

def find_word_count():
    df = pd.DataFrame(columns=['word','numFiles','totalWordCount'])

    for file in os.listdir(directory):
        filename = os.fsdecode(file)
        print(filename)
        complete_filename = path+'/'+filename
        
        with open(complete_filename, "r") as file:
            # add a column to df, with default value = 0 (all words so far have frequency of 0)
            df[filename] = 0
            previous_word = None

            for line in file:
                words = line.split()  # Split line into a list of words
                for search_term in words:
                    if previous_word:
                        if (previous_word+" "+search_term) in ALLOWED_EXPRESSIONS:
                            words.append(previous_word+" "+search_term)

                    if len(search_term) <= 1:
                        continue

                    # remove first or last char if it isn't alpha
                    while not search_term[0].isalpha():
                        search_term = search_term[1:]
                        if len(search_term) <= 1:
                            break
                    
                    if len(search_term) <= 1:
                        continue
                    
                    while not search_term[-1].isalpha():
                        search_term = search_term[:-1]
                        if len(search_term) <= 1:
                            break
                    
                    if len(search_term) <= 1:
                        continue
                    
                    search_term = search_term.lower() # remove any uppercase
                    if search_term in IGNORE_WORDS: # WE SHOULD HAVE TWO WORD COMBINATIONS "MORE" is bad "FIND MORE" is ok
                        continue

                    # Check if the term is found in the dataframe, if found increment
                    if search_term in df['word'].values:      

                        # Get its row index      
                        row_index = df.index[df['word'] == search_term][0]

                        # If first occurence of the word in a new file
                        if df.at[row_index, filename] == 0:
                            df.at[row_index, filename] = 1
                            df.at[row_index, 'numFiles'] += 1
                            df.at[row_index, 'totalWordCount'] += 1
                    
                        else:
                            df.at[row_index, filename] = 1
                            df.at[row_index, 'totalWordCount'] += 1
                    
                    else:
                        # If word not found, add a new row with it and set initial values
                        # new_row = pd.Series([0] * len(df.columns))
                        # new_row[0] = search_term
                        # new_row[1] = 1
                        # new_row[2] = 1
                        # new_row[len(df.columns)] = 1
                        # df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)

                        new_row = pd.Series({'word': search_term, 'numFiles': 1, 'totalWordCount': 1, filename:1})
                        # new_row = pd.concat([new_row, pd.Series([0] * (len(df.columns) - len(new_row)))], ignore_index=True)
                        df = pd.concat([df, new_row.to_frame().T], ignore_index=True)
                    
                    previous_word = search_term

    df.to_csv('bannerID/top20banners/results.csv')

find_word_count()

    

    