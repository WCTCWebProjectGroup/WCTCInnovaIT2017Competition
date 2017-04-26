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
                    test.fileEntries.push(fileEntry);
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

    document.getElementById("uploadImage").addEventListener("change", function (evt) {
        function readURL(input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();
                
                reader.onload = function (e) {
                    document.getElementById("blah").setAttribute('src', e.target.result);
                }
                
                reader.readAsDataURL(input.files[0]);
                test.PerformFileOperation(test.FileOperationsEnum.SAVE, "testPhoto.png", input.files[0])
                    .then(function (e) {
                        console.log("then: " + e.fileEntry);
                        document.getElementById("blah2").src = window.URL.createObjectURL(e.blob);
                    });
            }
        }

        readURL(evt.srcElement);
    });

    document.getElementById("loadSavedImage").addEventListener("click", function (evt) {
        var filename = document.getElementById("loadSavedImageName").value;
        test.PerformFileOperation(test.FileOperationsEnum.READ, filename, false)
        .then(function (e) {
            console.log("then: " + e);
            document.getElementById("savedImage").src = window.URL.createObjectURL(e);
        });
    })
};

common.initialize.push(init);