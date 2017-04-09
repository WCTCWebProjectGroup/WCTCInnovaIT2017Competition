var calendar = new function () {
    var _goodDates = [];
    var _sharedEntries = [];
    var sidePanel = document.getElementById("sidePanel");

    this.SharedEntries = function () {
        return _sharedEntries;
    }
    
    function _entryCardElement (entryObj) {
        var card = document.createElement("div");
        var title = document.createElement("h2");
        var containerEl = document.createElement("div");
        var editBtnEl = document.createElement("input");
        var shareBtnEl = document.createElement("input");

        card.setAttribute("class", "MCard");

        title.setAttribute("class", "gname");
        title.innerText = entryObj.date.toLocaleString();

        containerEl.setAttribute("class", "gcontent");

        editBtnEl.setAttribute("class", "MButton margin");
        editBtnEl.setAttribute("value", "Edit/View");
        editBtnEl.setAttribute("type", "button");
        editBtnEl.addEventListener("click", function () {
            document.location.assign("/journal.html?newEntry=false&entryID=" + entryObj.uid);
        });

        shareBtnEl.setAttribute("class", "MButton margin");
        shareBtnEl.setAttribute("value", "Share");
        shareBtnEl.setAttribute("type", "button");
        shareBtnEl.addEventListener("click", function () {
            console.log("Sharing entries is still a WIP");
            _showShareModalForEntries(entryObj);
        });

        card.appendChild(title);
        containerEl.appendChild(editBtnEl);
        containerEl.appendChild(shareBtnEl);
        card.appendChild(containerEl);

        return card;
    }

    function _showSidePanel(date, obj) {
        document.getElementById("sidePanel").style.top = 0;
        console.log("_showSidePanel()" + date);
        sidePanel.style.left = "0";
        database.GetEntriesOnDay(new Date(date[0]))
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
        modal.style.top = "0px";
    }
    this.ShowShareModalForEntries = _showShareModalForEntries;

    function _hideShareModalForEntries () {
        console.log(_sharedEntries.indexOf());
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
    database.GetAllEntriesFromDB()
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
            
            $('.calendar').pignoseCalendar({
                //toggle: true,
                scheduleOptions: {
                    colors: {
                        entry: '#2fabb7'
                    }
                },
                schedules: _goodDates,
                select: _onDateClickHandler
            });

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

            document.getElementById("newEntry").addEventListener("click", ()=>{
                window.location.href = '/journal.html?newentry=true';
            });
        })
}

// ----- Event Listeners ----- //

// TODO: Save the file to disk?
function init () {
    document.getElementById("clsPanelBtn").addEventListener("click", function () {
        calendar.HideSidePanel();
    });
    document.getElementById("shareModal").addEventListener("click", function () {
        calendar.HideShareModalForEntries();
    });
    document.getElementById("uploadToGoogle").addEventListener("click", function (evt) {
        var entry = calendar.SharedEntries()[0];
        database.GetEntryInDB(entry.uid).then(function () {
            console.log("Submitting document " + entry.uid + "to google");
            console.log(entry.body);
        });
        evt.stopPropagation();
    });
    document.getElementById("submitToBlackboard").addEventListener("click", function (evt) {
        evt.stopPropagation();
        var entry = calendar.SharedEntries()[0];
        database.GetEntryInDB(entry.uid).then(function () {
            console.log("Submitting document " + entry.uid + "to blackboard");
            console.log(entry.body);
        });
    });
}
initialize.push(init);

// ----- END Event Listeners ----- //