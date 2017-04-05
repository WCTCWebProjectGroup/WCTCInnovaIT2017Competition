from os import listdir
from os.path import isfile, join
import fileinput
import os
import sys

if len(sys.argv) < 1:
    print("Missing path!")
    sys.exit()

filename = sys.argv[1]

updates = []
# Get the nav html and store in updates
with open('./index.html', 'r') as inputfile:
    foundMain = False
    for line in inputfile:
        if foundMain:
            if "</main>" in line:
                print("found main end!")
                foundMain = False
                updates.append(line)
        elif "<main>" in line:
            foundMain = True
            updates.append(line)
            print("found main!")
        else:
            updates.append(line)
    print("Updated html:")
    print(updates)

with open(filename, 'w') as inputfile:
    for line in updates:
        inputfile.write(line);
