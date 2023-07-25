"""
Simple word counter to analyze the word frequency in top-20 cookie banners
"""
import os
import pandas as pd
# import random

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
            # 'ok','allow all', 'enable all',  #--> Found in 2 files or less
            # 'got it', 'allow cookies', #--> Found in 3-5 files, and doesn't reduce covering in training
            ]
NON_CONSENT = ['rejet', 'reject all',
               'decline', 
               # 'mandatory only', 'required only', 'not accept', 'disable all',#--> Found in 2 files or less
               # 'disagree', #--> Found in 2 files or less
               # 'decline cookies', #--> Found in 3-5 files, and doesn't reduce covering in training
               # 'decline all', #--> Found in 6-10 files, and doesn't reduce covering in training
               ]
TYPE_OF_COOKIES = [ # 'mandatory', 'optional cookies', #--> Found in 2 files or less
                    # 'essential cookies','non-essential cookies','strictly necessary',  #--> Found in 3-5 files, and doesn't reduce covering in training
                    # 'necessary cookies', required',  #--> Found in 3-5 files, and doesn't reduce covering in training
                    # 'essential', 'non-essential', #--> Found in 6-10 files, and doesn't reduce covering in training
                    ]
SETTINGS = [ 'cookie preferences', 'manage cookies',  'preferences', 
            # 'cookies options','consent manager', 'customize cookies', 'cookie options', #--> Found in 2 files or less
            # 'cookies settings', 'manage settings', #--> Found in 3-5 files, and doesn't reduce covering in training
            # 'manage preferences', 'more options', #--> Found in 6-10 files, and doesn't reduce covering in training
            ]
INFORMATION = ['learn more',  'more information', 
               #'show purposes' #--> Found in 2 files or less
               # 'further information', #--> Found in 3-5 files, and doesn't reduce covering in training
               # 'more options', #--> Found in 6-10 files, and doesn't reduce covering in training
               ]
POLICY = ['privacy policy', 'privacy statement', 'cookie policy','cookie notice',]
THIRD_PARTY = ['our partners', 'partners',  'third-party', 
               #'third party' #--> Found in 3-5 files, and doesn't reduce covering in training
               # 'vendors',#--> Found in 6-10 files, and doesn't reduce covering in training
               ]
OTHER = ['similar technologies', 
         #'other technologies', #--> Found in 2 files or less
         ]
ALLOWED_EXPRESSIONS = { "consent": CONSENT,
                       "non-consent": NON_CONSENT,
                       "type of cookies":TYPE_OF_COOKIES, 
                       "settings":SETTINGS, 
                       "information":INFORMATION,
                       "policy": POLICY,
                       "third_party":THIRD_PARTY, 
                       "other":OTHER }

path = "bannerID/top250banners/train_files"
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
        df.at[row_index, filename] += 1
        df.at[row_index, 'totalWordCount'] += 1
    return df
                    
def add_row_to_df(df, search_term, filename):
    new_row = pd.Series({'word': search_term, 'numFiles': 1, 'totalWordCount': 1, filename:1})
    df = pd.concat([df, new_row.to_frame().T], ignore_index=True)
    return df

def modify_df(df, search_term, filename):
    # Check if the term is found in the dataframe, if found increment
    if search_term in df['word'].values:      
        df = increment_df(df, search_term, filename)
    # If not found, add a row to df
    else: 
        df = add_row_to_df(df, search_term, filename)

    return df

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
                            df = modify_df(df, search_term, filename)

                            if file_first_hit:
                                unique_file_counter += 1
                                file_first_hit = False
                    else:  
                        df = modify_df(df, search_term, filename)

                    previous_word = search_term

    create_filename = 'bannerID/top250banners/results.csv'

    if category_name:
        create_filename = f'bannerID/top250banners/output_categories/{category_name}.csv'
        success = round(unique_file_counter / 75 * 100, 2) # AS OF JULY 12, THERE ARE 75 TRAINING FILES
        print(f"At least one word of the category {category_name} has been found in {unique_file_counter} files. ({success} %)")

    df.to_csv(create_filename)


def get_category_ALL(ALLOWED_EXPRESSIONS):
    all_words = []
    for category_name, category_words in ALLOWED_EXPRESSIONS.items():
        for word in category_words:
            all_words.append(word)
    get_word_count("All categories", all_words)

get_category_ALL(ALLOWED_EXPRESSIONS)

def get_category_detailed(ALLOWED_EXPRESSIONS):
    for category_name, category_words in ALLOWED_EXPRESSIONS.items():
        get_word_count(category_name, category_words)

get_category_detailed(ALLOWED_EXPRESSIONS)


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