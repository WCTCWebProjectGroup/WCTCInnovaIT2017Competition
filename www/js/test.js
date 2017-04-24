function _StoreImage (file) {
    function writeFile(fileEntry, dataObj) {
        // Create a FileWriter object for our FileEntry (log.txt).
        fileEntry.createWriter(function (fileWriter) {

            fileWriter.onwriteend = function() {
                console.log("Successful file write...");
                //readFile(fileEntry);
            };

            fileWriter.onerror = function (e) {
                console.log("Failed file write: " + e.toString());
            };

            // If data object is not passed in,
            // create a new Blob instead.
            if (!dataObj) {
                dataObj = new Blob(['some file data'], { type: file.type });
            }

            fileWriter.write(dataObj);
        });
    }

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {

        console.log('file system open: ' + fs.name);
        fs.root.getFile(file.name, { create: true, exclusive: false }, function (fileEntry) {

            console.log("fileEntry is file?" + fileEntry.isFile.toString());
            // fileEntry.name == 'someFile.txt'
            // fileEntry.fullPath == '/someFile.txt'
            writeFile(fileEntry, null);

        }, onErrorLoadFs);

    }, onErrorLoadFs);

    function onErrorLoadFs (err) {
        console.log(err);
    }
}

// ----- Init Event Listeners ----- //

function init () {
    document.getElementById("saveEditorTextToFile").addEventListener("click", function () {
        var fileText = document.getElementById("testEditor").value;
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
            console.log("File system open: " + fs.name);
            fs.root.getFile("tmp.txt", {create:true,exclusive:false}, function (fileEntry) {
                console.log(fileEntry);
                fileEntry.createWriter(function (fileWriter) {

                fileWriter.onwriteend = function() {
                    console.log("Successful file write...");
                };

                fileWriter.onerror = function (e) {
                    console.log("Failed file write: " + e.toString());
                };

                if (!fileText) {
                    fileText = new Blob(['some file data'], { type: "text/plain" });
                }

                fileWriter.write(fileText);
            });
            }, function (err) {
                console.error(err);
            });
        }, function (err) { 
            console.error(err);
        })
    });

    document.getElementById("readFromFile").addEventListener("click", function () {

    });
};

common.initialize.push(init);