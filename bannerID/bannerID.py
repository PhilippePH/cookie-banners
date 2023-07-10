from bs4 import BeautifulSoup
import os
import re
# Question: Should we have something detecting the language and droping sites not in english?

# Identifier word selection comes from "Exploring the Cookieverse: A Multi-Perspective Analysis of Web Cookies"
# Capitalization does not matter
IDENTIFIER_WORDS = ["cookies", "privacy", "policy", "consent", "accept", 
                    "agree", "personalized", "legitimate interest"]
POSITIVE_CSS_WORDS = ["z-index", "position: fixed"]
NEGATIVE_CSS_WORDS = ["display: none", "visibility: hidden"]
OTHER_WORD_IDEAS = ["gdpr", "onetrust"]

directory = os.fsencode("html_files/7_html_files")

# Function to check if an element has positive z-index or fixed position
def has_positive_z_index_or_fixed_position(element):
    style = element.get('style', '')
    if 'z-index' in style and int(element['style'].split('z-index:')[1].split(';')[0].strip()) > 0:
        return True
    if 'position' in style and element['style'].split('position:')[1].split(';')[0].strip() == 'fixed':
        return True
    return False

def find_banner(element):
    if isinstance(element, str):
        # Handle NavigableString objects
        element = element.parent
    
    if element is None:
        return False
    
    if(has_positive_z_index_or_fixed_position(element)):
        return True
    
    else:
        return find_banner(element.parent)


for file in os.listdir(directory):
    filename = os.fsdecode(file)
    complete_filename = "html_files/7_html_files/"+filename
    html_file = open(complete_filename,'r')
    soup = BeautifulSoup(html_file, 'html.parser')

    # STEP 1: FIND WHERE THE IDENTIFIER WORDS ARE, AND ACCESS ITS PARENT
    for word in IDENTIFIER_WORDS:
        pattern = r'\b' + re.escape(word) + r'\b'
        element_with_keyword = soup.find_all(string=re.compile(pattern, re.IGNORECASE))

        for elem in element_with_keyword:
            # STEP 2: FIND THE FIRST ELEMENT (SELF, OR PARENT, ...) WITH A Z-INDEX OR FIXED POSITION
            if(find_banner(elem)):
                print("Found a cookie banner!")