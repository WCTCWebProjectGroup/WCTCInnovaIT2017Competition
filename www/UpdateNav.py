from os import listdir
from os.path import isfile, join
import fileinput

updates = []

# Get all files, except index.html, that end in .html
filesToUpdate = []
for file in listdir():
    if isfile(file) and file.endswith(".html") and not file.startswith("index.html"):
        filesToUpdate.push(file)

# Get the nav html and store in updates
with open('./index.html', 'r') as inputfile:
    foundNavStart = False
    for line in inputfile:
        if foundNavStart:
            if line.startswith("<!--NAVEND-->"):
                break;
            else:
                updates.push(line)
        elif line.startsWith("<!--NAVSTART-->"):
            foundNavStart = True

# Then replace the html in filesToUpdate between the <!--NAVSTART--> 
# and <!--NAVEND-->
for file in filesToUpdate:
    filelines = []
    with open(file, 'r+') as inputfile:
        navStart = False
        for line in inputfile:
            if navStart:
                if line.startsWith("<!--NAVEND-->")
                    navStart = False
                continue
            else
                if line.startsWith("<!--NAVSTART-->")
                    navStart = True
                    filelines = filelines + updates
                else
                    filelines.push(line)

        inputfile.truncate()
        for line in filelines
            file.write(line);
