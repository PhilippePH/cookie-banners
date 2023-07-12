"""
Simple word counter to analyze the word frequency in top-20 cookie banners
"""
import os
import pandas as pd
import random

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
                'you','your',]

""" The following are categories of words often found in cookie banners. Two-words
terms are shown first to maximize the number of precise search hits (should exit once found one)
"""
CONSENT = ['agree', 'i agree',
           'accept', 'accept all', 'accept cookies', "i accept",
            'allow all', 'allow cookies',
            'enable all', 
            'ok', 'got it',]
NON_CONSENT = ['rejet', 'reject all',
               'disagree', 'not accept',
               'decline all', 'decline', 'decline cookies',
               'disable all',
               'mandatory only', 'required only', 'essential only']
TYPE_OF_COOKIES = ['essential cookies', 'non-essential cookies',
                   'necessary cookies', 'strictly necessary',
                   'optional cookies',
                   'required', 'essential', 'non-essential', 'mandatory']
SETTINGS = [ 'cookie preferences','manage preferences',
            'cookie settings', 'manage settings', 'cookies settings',
            'manage cookies', 'customize cookies',
            'more options', 'cookie options', 'cookies options',
            'preferences', 'consent manager']
INFORMATION = ['learn more', 'more options', 'show purposes', 'more information',
               'further information',]
POLICY = ['privacy policy', 'privacy statement', 'cookie policy','cookie notice',]
THIRD_PARTY = ['our partners', 'partners', 'vendors', 'third-party', 'third party']
OTHER = ['similar technologies', 'other technologies',]
ALLOWED_EXPRESSIONS = { "consent": CONSENT,
                       "non-consent": NON_CONSENT,
                       "type of cookies":TYPE_OF_COOKIES, 
                       "settings":SETTINGS, 
                       "information":INFORMATION,
                       "policy": POLICY,
                       "third_party":THIRD_PARTY, 
                       "other":OTHER }

path = "bannerID/top20banners/train_files"
directory = os.fsencode(path)

""" Now, the next interesting thing would be to
1) Test how many banners have at least one hit per category
2) See if some words in the category could be removed (too few hits)"""

def clean_word(search_term):
    if len(search_term) <= 1:
        return None
    
    # remove first or last char if it isn't alpha
    while not search_term[0].isalpha():
        search_term = search_term[1:]
        if len(search_term) <= 1:
            return None       
    
    while not search_term[-1].isalpha():
        search_term = search_term[:-1]
        if len(search_term) <= 1:
            return None
    
    search_term = search_term.lower()

    if search_term in IGNORE_WORDS:
        return None

    return search_term                    

def increment_df(df, search_term, filename):
    # Get word's row index      
    row_index = df.index[df['word'] == search_term][0]

    # If first occurence of the word in a new file
    if df.at[row_index, filename] == 0:
        df.at[row_index, filename] = 1
        df.at[row_index, 'numFiles'] += 1
        df.at[row_index, 'totalWordCount'] += 1

    else:
        df.at[row_index, filename] = 1
        df.at[row_index, 'totalWordCount'] += 1
                    
def add_row_to_df(df, search_term, filename):
    new_row = pd.Series({'word': search_term, 'numFiles': 1, 'totalWordCount': 1, filename:1})
    df = pd.concat([df, new_row.to_frame().T], ignore_index=True)

def modify_df(df, search_term, filename):
    # Check if the term is found in the dataframe, if found increment
    if search_term in df['word'].values:      
        increment_df(df, search_term, filename)
    # If not found, add a row to df
    else: 
        add_row_to_df(df, search_term, filename)

def get_word_count(category_name = None, category_words = None):
    df = pd.DataFrame(columns=['word','numFiles','totalWordCount'])
    unique_file_counter = 0

    for file in os.listdir(directory):
        filename = os.fsdecode(file)
        complete_filename = path+'/'+filename
        
        with open(complete_filename, "r") as file:
            # add a column to df, with default value = 0 (all words so far have frequency of 0)
            df[filename] = 0
            previous_word = None
            file_first_hit = True

            for line in file:
                words = line.split()  # Split line into a list of words
                for search_term in words:
                    search_term = clean_word(search_term)
                    if search_term is None:
                        continue
                    
                    if previous_word:
                        if (previous_word+" "+search_term) in category_words:
                            words.append(previous_word+" "+search_term)
                    
                    if category_name:
                        if search_term in category_words: #Only count words in the list given
                            modify_df(df, search_term, filename)

                            if file_first_hit:
                                unique_file_counter += 1
                                file_first_hit = False
                    else:  
                        modify_df(df, search_term, filename)

                    previous_word = search_term

    create_filename = 'bannerID/top20banners/results.csv'

    if category_name:
        create_filename = f'bannerID/top20banners/output_categories/{category_name}.csv'
        success = round(unique_file_counter / 75 * 100, 2) # AS OF JULY 12, THERE ARE 75 TRAINING FILES
        print(f"At least one word of the category {category_name} has been found in {unique_file_counter} files. ({success} %)")

    df.to_csv(create_filename)

for category_name, category_words in ALLOWED_EXPRESSIONS.items():
    get_word_count(category_name, category_words)


"""
def select_testing_files():
    for file in os.listdir(directory):
        if random.randint(0,100) < 20:
            filename = os.fsdecode(file)
            complete_filename = path+'/'+filename
            new_path = "bannerID/top20banners/test_files"
            new_filename = new_path+'/'+filename
            os.rename(complete_filename, new_filename)
"""