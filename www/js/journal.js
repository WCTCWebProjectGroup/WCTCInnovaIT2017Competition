var journal = new function () {
    
    this.GetEditorHtml = function () {
        return tinyMCE.activeEditor.getContent();
    }

    this.SetEditorHtml = function (html) {
        return tinyMCE.activeEditor.setContent(html);
    }
}

// ----- Event Listeners ----- //

function _journalInit () {
    // if (document.querySelectorAll("#froala-editor").length > 0) {
    //     $(function() { $("#froala-editor").froalaEditor({
    //         height: 200
    //     }) });
    // }
    common.GetAllTags()
        .then(function (tags) {
            var existingTags = document.getElementById("existingTags");
            if (tags.length > 0) {
                tags.forEach(function (tag) {
                    var optionEl = document.createElement("option");
                    optionEl.innerText = tag.name;
                    optionEl.setAttribute("data-bind", tag.color);
                    existingTags.appendChild(optionEl);
                });

                existingTags.addEventListener("change", function () {
                    var options = document.querySelector("#existingTags option");
                    var selectedTagEl = existingTags.children[existingTags.selectedIndex];

                    document.getElementById("newTagName").value = selectedTagEl.innerText;
                    document.getElementById("newTagColor").value = selectedTagEl.getAttribute("data-bind");
                });
            } else {
                existingTags.style.display = "none";
            }
        });

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

    function updateExistingTags () {

    }

    tinymce.init({
        selector: '#editor',
        setup: function (ed) {
            ed.addButton('mybutton', {
                text: 'Upload Image',
                icon: 'image',
                onclick: function () {
                    document.getElementById("loadSavedImage").click();
                }
            }),
            ed.on('init', function(args) {
                console.debug(args.target.id);

                document.getElementById("loadSavedImage").addEventListener("change", function (evt) {
                    var input = evt.srcElement;
                    var reader = new FileReader();
            
                    reader.onload = function (e) {
                        var initWidth = document.querySelector(".MCard").getBoundingClientRect().width - 30;
                        ed.insertContent('&nbsp;<img src="' + e.target.result + '" width="' + initWidth + 'px">&nbsp;');
                    }
                    
                    reader.readAsDataURL(input.files[0]);
                    test.PerformFileOperation(test.FileOperationsEnum.SAVE, "testPhoto.png", input.files[0])
                        .then(function (e) {
                            console.log("then: " + e.fileEntry);
                        });
                    test.PerformFileOperation(test.FileOperationsEnum.WRITE, evt.srcElement.files[0], null)
                });

                // First determine if creating a new entry or editing an exisiting one
                var urlParams = document.location.search.replace('?', '').split('&');
                var creatingNewEntry = false;
                var editingEntryNumber = -1;
                
                var dateEl = document.getElementById("entryDate");
                var timeEl = document.getElementById("entryTime");
                var entryBody = document.getElementById("froala-editor");
                var entryTagList = document.getElementById("entryTags");
                var addTagBtn = document.getElementById("addTag");
                var existingTagsSelectEl = document.getElementById("existingTags");
                var _db_entry = {};

                var deleteEntryBtn = document.getElementById("deleteEntry");
                var discardChangesBtn = document.getElementById("discardChanges");
                var saveChangesBtn = document.getElementById("saveChanges");
                var shareEntryBtn = document.getElementById("shareEntry");
                var cameraBtn = document.getElementById("takePicture");
                

                if (urlParams[0].split('=')[1] == "true") {
                    // Creating new entry
                    console.log("Creating new entry...");
                    creatingNewEntry = true;

                    // Hide discardChangesBtn
                    deleteEntryBtn.style.display = "none";

                    // Set the date/time to today
                    var today = new Date();
                    today.setDate(today.getDate() - 1);
                    dateEl.value = today.toISOString().slice(0, 10);
                    timeEl.value = today.toTimeString().slice(0, 8);

                } else if (urlParams[0].split('=')[1] == "false") {
                    // Editing existing entry
                    console.log("Updating an existing entry...");
                    
                    editingEntryNumber = Number(urlParams[1].split('=')[1]);
                    console.log("Editing " + editingEntryNumber);

                    common.GetEntryInDB(Number(editingEntryNumber))
                        .then(function (entry) {
                            // Set date/time
                            var cleanDays = new Date(entry.date.toISOString().slice(0, 10));
                            cleanDays.setDate(cleanDays.getDate() - 1);
                            dateEl.value = cleanDays.toISOString().slice(0, 10);
                            // timeEl.value = entry.date.toISOString().slice(11, 19);
                            timeEl.value = entry.date.toTimeString().slice(0, 8);

                            // Set body
                            journal.SetEditorHtml(entry.body.text);

                            // TODO: Set Tags
                            entry.tags.forEach(function (tag) {
                                var container = document.importNode(document.getElementById("tagT").content, true);
                                container.querySelector(".tagName").value = tag.name;
                                container.querySelector(".tagColor").value = tag.color;
                                container.querySelector(".remove").addEventListener("click", function (evt) {
                                    entryTagList.removeChild(evt.path[5]);
                                });
                                
                                entryTagList.appendChild(container);
                            });

                            document.getElementById("deleteEntry").addEventListener("click", function () {
                            common.RemoveEntryFromDB(entry.uid)
                                .then(function () {
                                    history.back();
                                });
                        });
                        });
                } else {
                    // Error occurred
                    history.back();
                }

                // ----- Event Listeners ----- //
                // cameraBtn.addEventListener("click", function () {
                //     console.log("Taking a picture is still a WIP!");
                // });
                discardChangesBtn.addEventListener("click", function () {
                    console.log("Discarding changes");
                    history.back();
                });

                addTagBtn.addEventListener("click", function () {
                    var tagName = document.getElementById("newTagName").value;

                    if (tagName == "") {
                        common.DisplayAlert("Tag name cannot be empty!");
                        return;
                    }

                    var existingTags = [];

                    var tagEls = document.querySelectorAll(".tagName")
                    for (var i = 0; i < tagEls.length; i++) {
                        var name = tagEls.item(i).value;
                        if (!existingTags.includes(name))
                            existingTags.push(name);
                    }

                    if (existingTags.includes(tagName)) {
                        common.DisplayAlert("Entry already has tag of same name!")
                        return;
                    }

                    var container = document.importNode(document.getElementById("tagT").content, true);
                    container.querySelector(".tagName").value = tagName;
                    container.querySelector(".tagColor").value = document.getElementById("newTagColor").value;

                    entryTagList.prepend(container);
                    
                    var goodEl = entryTagList.querySelector("li:first-child");
                    goodEl.querySelector("input:last-child").addEventListener("click", function () {
                        entryTagList.removeChild(goodEl);
                    });
                    
                    document.getElementById("newTagName").value = "";
                    document.getElementById("newTagColor").value = "#000000";

                    document.getElementById("existingTags").selectedIndex = "0";
                });

                saveChangesBtn.addEventListener("click", function () {
                    common.ShowPrimaryLoading();
                    console.log("Saving entry")
                    var datetime = new Date();
                    // datetime.setHours( timeEl.value.slice(0,2));
                    // datetime.setMinutes(timeEl.value.slice(3, 5));
                    // datetime.setSeconds(timeEl.value.slice(6, 8));
                    var body = journal.GetEditorHtml();

                    // TODO: Tags
                    var tags = [];

                    var tagListEntries = entryTagList.getElementsByTagName("li");
                    for (var i = 0; i < tagListEntries.length; i++) {
                        var tagEl = tagListEntries.item(i);
                        var tag = new common.Tag();
                        
                        tag.name = tagEl.querySelector(".tagName").value;
                        tag.color = tagEl.querySelector(".tagColor").value;
                        
                        tags.push(tag);
                    }

                    if (creatingNewEntry) {
                        datetime.setDate(datetime.getDate());
                        common.CreateNewEntry(datetime, body, tags)
                            .then(function () {
                                history.back();
                            });
                    } else {
                        var _db_entry = {
                            uid: editingEntryNumber,
                            body: {text: ""},
                            tags: [],
                            date: {}
                        }

                        _db_entry.body.text = journal.GetEditorHtml();

                        var datetime = new Date(dateEl.value);
                        datetime.setHours( timeEl.value.slice(0,2));
                        datetime.setMinutes(timeEl.value.slice(3, 5));
                        datetime.setSeconds(timeEl.value.slice(6, 8));
                        datetime.setDate(datetime.getDate() + 1);
                        datetime.setDate(datetime.getDate());
                        _db_entry.date = datetime;

                        var tagEls = document.querySelectorAll("#entryTags > li");
                        for (var i = 0; i < tagEls.length; i++) {
                            var item = tagEls.item(i);
                            var tag = {
                                name: "",
                                color: ""
                            };

                            tag.name = item.querySelector(".tagName").value;
                            tag.color = item.querySelector(".tagColor").value;

                            _db_entry.tags.push(tag);
                        }

                        common.UpdateEntryInDB(_db_entry)
                            .then(function () {
                                history.back();
                            });
                    }
                });
                // ----- Event Listeners ----- //
            });
        },
        plugins: [
            'image autoresize imagetools'
        ],
        menubar: false,
        toolbar: 'mybutton | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent',
        automatic_uploads: true,
        images_upload_handler: function (blobInfo, success, failure) {
            var xhr, formData;
            xhr = new XMLHttpRequest();
            xhr.withCredentials = false;
        },
        file_browser_callback_types: 'image',
        file_browser_callback: function (callback, value, meta) {
            var input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');

            input.onchange = function() {
                var file = this.files[0];
                _StoreImage(file);
                
                // Note: Now we need to register the blob in TinyMCEs image blob
                // registry. In the next release this part hopefully won't be
                // necessary, as we are looking to handle it internally.
                // var id = 'blobid' + (new Date()).getTime();
                // var blobCache = tinymce.activeEditor.editorUpload.blobCache;
                // var blobInfo = blobCache.create(id, file);
                // blobCache.add(blobInfo);
                
                // call the callback and populate the Title field with the file name
                // cb(blobInfo.blobUri(), { title: file.name });
            };
            
            input.click();
        },
        image_title: false,
        image_dimensions: true,
        image_description: false
    });
}

common.initialize.push(_journalInit);

// ----- END Event Listeners ----- //