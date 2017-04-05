from os import listdir
from os.path import isfile, join
import fileinput

navUpdates = []
headerUpdates = [] # TODO

# Get all files, except index.html, that end in .html
filesToUpdate = []
for file in listdir():
    if isfile(file) and file.endswith(".html") and not file.startswith("index.html"):
        filesToUpdate.append(file)
        print('Found file: {0}'.format(file))

# Get the nav html and store in navUpdates
with open('./index.html', 'r') as inputfile:
    foundNavStart = False
    for line in inputfile:
        if foundNavStart:
            if "<!--NAVEND-->" in line:
                print("found navend!")
                break;
            else:
                navUpdates.append(line)
        elif "<!--NAVSTART-->" in line:
            foundNavStart = True
            print("found navstart!")
    print("Updated html:")
    print(navUpdates)

# Then replace the html in filesToUpdate between the <!--NAVSTART--> 
# and <!--NAVEND-->
for file in filesToUpdate:
    filelines = []
    print("in file {0}".format(file))
    with open(file, 'r+') as inputfile:
        navStart = False
        for line in inputfile:
            if navStart:
                if ("<!--NAVEND-->") in line:
                    filelines.append(line)
                    print("found navend!")
                    navStart = False
            else:
                if "<!--NAVSTART-->" in line:
                    print("found navstart")
                    navStart = True
                    filelines.append(line)
                    filelines += navUpdates
                else:
                    filelines.append(line)

    with open(file, 'w') as inputfile:
        for line in filelines:
            inputfile.write(line);
