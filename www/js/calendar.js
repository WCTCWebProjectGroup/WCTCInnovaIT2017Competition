var calendar = new function () {
    var _goodDates = [];
    var _sharedEntries = [];
    var sidePanel = document.getElementById("sidePanel");

    this.SharedEntries = function () {
        return _sharedEntries;
    }

    function _createCheckboxEl (label) {
        var mcheckbox = document.importNode(document.getElementById("checkboxT").content, true);
        var labelEl = mcheckbox.querySelector("label");
        var inputEl = mcheckbox.querySelector("input");

        labelEl.innerText = label;
        labelEl.setAttribute("id", label + "Tag");
        
        inputEl.addEventListener("click", function () {
            if (inputEl.value) {
                console.log("Applied filter " + label);
            }
        });

        return mcheckbox;
    }
    
    function _entryCardElement (entryObj) {
        var card = document.createElement("div");
        var title = document.createElement("h2");
        var tagEl = document.createElement("ul");
        var containerEl = document.createElement("div");
        var editBtnEl = document.createElement("input");
        var shareBtnEl = document.createElement("input");
        var currentTheme = document.getElementsByTagName("body")[0].getAttribute("class");
        currentTheme = currentTheme.replace("themable").trim();

        card.setAttribute("class", "MCard themable " + currentTheme);

        title.setAttribute("class", "gname");
        title.innerText = "[" + entryObj.uid + "] " + entryObj.date.toLocaleString();

        tagEl.setAttribute("class", "listNoBullet listHorizontal tagContainer");
        entryObj.tags.forEach(function (tag) {
            var tagEntryEl = document.createElement("li");
            tagEntryEl.innerText = tag.name;
            tagEntryEl.style.borderColor = tag.color;

            tagEl.appendChild(tagEntryEl);
        });

        containerEl.setAttribute("class", "gcontent");

        editBtnEl.setAttribute("class", "MButton margin");
        editBtnEl.setAttribute("value", "Edit/View");
        editBtnEl.setAttribute("type", "button");
        editBtnEl.addEventListener("click", function () {
            document.location.assign("journal.html?newEntry=false&entryID=" + entryObj.uid);
        });

        shareBtnEl.setAttribute("class", "MButton margin");
        shareBtnEl.setAttribute("value", "Share");
        shareBtnEl.setAttribute("type", "button");
        shareBtnEl.addEventListener("click", function () {
            console.log("Sharing entries is still a WIP");
            _showShareModalForEntries(entryObj);
        });

        card.appendChild(title);
        card.appendChild(tagEl);
        containerEl.appendChild(editBtnEl);
        containerEl.appendChild(shareBtnEl);
        card.appendChild(containerEl);

        return card;
    }
    this.CreateEntryCardElement = _entryCardElement;

    function _showSidePanel(date, obj) {
        document.getElementById("sidePanel").style.top = 0;
        console.log("_showSidePanel()" + date);
        sidePanel.style.left = "0";
        common.GetEntriesOnDay(new Date(date[0]))
            .then(function (entries) {
                var selectedEntriesEl = document.getElementById("selectedDayEntries");
                selectedEntriesEl.innerHTML = "";
                if (entries.length > 0) {
                    entries.forEach(function (entry) {
                        selectedEntriesEl.appendChild(_entryCardElement(entry));
                    });
                } else {
                    var noEntryMsg = document.createElement("div");
                    noEntryMsg.innerText = "No entries on this day";
                    noEntryMsg.setAttribute("class", "gname");
                    selectedEntriesEl.appendChild(noEntryMsg);
                }
            });
    }
    this.ShowSidePanel = _showSidePanel;

    function _showShareModalForEntries (entry) {
        _sharedEntries.push(entry);
        var modal = document.getElementById("shareModal");
        var hiddenGDriveEl = document.getElementById("uploadToGDriveHidden");
        document.querySelector("#shareResponse div").style.display = "none";
        modal.style.top = "0px";
    }
    this.ShowShareModalForEntries = _showShareModalForEntries;

    function _hideShareModalForEntries () {
        document.querySelector("#shareResponse span").innerText = "";
        var modal = document.getElementById("shareModal");
        modal.style.top = "100%";
        _sharedEntries.pop();
    }
    this.HideShareModalForEntries = _hideShareModalForEntries;

    function _hideSidePanel () {
        document.getElementById("selectedDayEntries").innerHTML = "";
        sidePanel.style.left = "100%";
    }
    this.HideSidePanel = _hideSidePanel;
    
    function _onDateClickHandler (date, obj) {
        _showSidePanel(date);
        console.log(obj);
    }

    common.ShowPrimaryLoading();
    common.GetAllEntriesFromDB()
        .then(function (entries) {
            entries.forEach(function (entry) {
                var cleanDate = entry.date.toISOString().slice(0, 10);
                var entry = {
                    name: 'entry',
                    date: cleanDate
                }
                if (!_goodDates.includes(cleanDate))
                    _goodDates.push(entry);
            });
            
            common.GetTheme()
                .then(function (theme) {
                    if (_goodDates.length > 0) {
                        $('.calendar').pignoseCalendar({
                            //toggle: true,
                            theme: theme.name,
                            scheduleOptions: {
                                colors: {
                                    entry: '#2fabb7'
                                }
                            },
                            schedules: _goodDates,
                            select: _onDateClickHandler
                        });
                    } else {
                        $('.calendar').pignoseCalendar({
                            theme: theme.name,
                            select: _onDateClickHandler
                        });
                    }
                })

            // $('.calendar').pignoseCalendar({
            //     scheduleOptions: {
            //         colors: {
            //             offer: '#2fabb7',
            //             ad: '#5c6270'
            //         }
            //     },
            //     schedules: [{
            //         name: 'offer',
            //         date: '2017-02-05',
            //     }],
            //     select: function(date, obj) {
            //         console.log('events for this date', obj.storage.schedules);
            //     }
            // });

            document.getElementById("newEntry").addEventListener("click", function () {
                window.location.href = 'journal.html?newentry=true';
            });
        })
}

// ----- Event Listeners ----- //

function init () {
    document.getElementById("clearFilters").addEventListener("click", function () {
        var checkboxes = document.getElementById("filterableTags")
            .getElementsByTagName("input");
        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = false;
        };
        document.getElementById("filterAfterDate").value = "";
        document.getElementById("filterBeforeDate").value = "";
        connector.UpdateEntries();
    });
    document.getElementById("clsPanelBtn").addEventListener("click", function () {
        calendar.HideSidePanel();
    });
    document.getElementById("shareModal").addEventListener("click", function () {
        calendar.HideShareModalForEntries();
        document.getElementById("shareResponse").style.display = "none";
        document.querySelector("#shareResponse div").innerHTML = "";
        document.querySelector("#shareResponse div").style.display = "none";
    });
    document.getElementById("shareResponse").style.display = "none";
    document.getElementById("uploadToGoogle").addEventListener("click", function (evt) {
        var entry = calendar.SharedEntries()[0];
        common.GetEntryInDB(entry.uid)
            .then(function (cleanEntry) {
                console.log("then: Submitting document " + cleanEntry.uid + " to google");
                common.UploadToGoogleDrive(cleanEntry)
                    .then(function (response) {
                        document.querySelector("#shareResponse span").innerText = "Successfully uploaded file to " + response.name;
                        document.getElementById("shareResponse").style.display = "block";
                    }).catch(function (err) {
                        console.error(err);
                        document.querySelector("#shareResponse span").innerText = "Error occured while uploading file to Google Drive";
                        document.getElementById("shareResponse").style.display = "block";
                    });
        }).catch(function (err) {
            console.error(err);
            document.querySelector("#shareResponse span").innerText = err;
            document.getElementById("shareResponse").style.display = "block";
        });
        evt.stopPropagation();
    });
    document.getElementById("download").addEventListener("click", function (evt) {
        var entry = calendar.SharedEntries()[0];
        common.GetEntryInDB(entry.uid)
            .then(function (cleanEntry) {
                console.log("then: Downloading document " + cleanEntry.uid);
                common.DownloadJournalEntry(cleanEntry)
                    .then(function (response) {
                        document.querySelector("#shareResponse span").innerText = "Downloaded File";
                        document.getElementById("shareResponse").style.display = "block";
                    }).catch(function (err) {
                        console.error(err);
                        document.querySelector("#shareResponse span").innerText = "Error occured while trying to download the file";
                        document.getElementById("shareResponse").style.display = "block";
                    });
        }).catch(function (err) {
            console.error(err);
            document.querySelector("#shareResponse span").innerText = err;
            document.getElementById("shareResponse").style.display = "block";
        });
        evt.stopPropagation();
    });
    // document.getElementById("submitToBlackboard").addEventListener("click", function (evt) {
    //     evt.stopPropagation();
    //     var entry = calendar.SharedEntries()[0];
    //     common.GetEntryInDB(entry.uid).then(function () {
    //         console.log("Submitting document " + entry.uid + " to blackboard");
    //     });
    // });
}
common.initialize.push(init);

// ----- END Event Listeners ----- //