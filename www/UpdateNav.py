from os import listdir
from os.path import isfile, join
import fileinput

results = []

# Get all files, except index.html, that end in .html
filesToUpdate = []
for file in listdir():
    if isfile(file) and file.endswith(".html") and not file.startswith("index.html"):
        filesToUpdate.push(file)

# Get the nav html and store in results
with open('./index.html', 'r') as inputfile:
    foundNavStart = False
    for line in inputfile:
        if foundNavStart:
            if line.startswith("<!--NAVEND-->"):
                break;
            else:
                results.push(line)
        elif line.startsWith("<!--NAVSTART-->"):
            foundNavStart = True

# Then replace the html in filesToUpdate between the <!--NAVSTART--> 
# and <!--NAVEND-->
for file in filesToUpdate:    
