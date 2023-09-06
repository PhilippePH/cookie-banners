# List of input file names
input_files = ['./UK/BraveSuccessful.txt', './UK/GhosterySuccessful.txt', './UK/Google ChromeSuccessful.txt', './UK/FirefoxSuccessful.txt']

# Initialize a list to store the URLs from each file
url_lists = []

# Read and store the URLs from each input file
for file_name in input_files:
    with open(file_name, 'r') as file:
        urls = set(line.strip() for line in file if line.strip())
        url_lists.append(urls)

# Find the intersection of URLs
common_urls = set.intersection(*url_lists)

# Output file name
output_file = './UK/successfulIntersection.txt'

# Write the common URLs to the output file
with open(output_file, 'w') as file:
    for url in common_urls:
        file.write(url + '\n')