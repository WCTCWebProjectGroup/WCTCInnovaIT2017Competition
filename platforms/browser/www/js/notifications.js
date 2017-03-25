var events = {};

initialize.push(function () {
    if (cordova != null) {
        if (cordova.plugins.notification != null)
        {
            //console.log("Found notifcations plugin!");

            function NotificationObject() {
                // Create a new event
                this.NewNotifiaction = function (id, title, text, firstAt, every, sound, icon, data) {
                    this.id = id;
                    this.title = title;
                    this.text = text;
                    this.firstAt = firstAt;
                    this.every = every;
                    this.sound = sound;
                    this.icon = icon;
                    this.data = data;
                }

                // Add event
                this.AddNotification = function (eventObj) {
                    cordova.plugins.notification.local.schedule({
                        id: eventObj.id,
                        title: eventObj.title,
                        text: eventObj.text,
                        firstAt: eventObj.firstAt,
                        every: eventObj.every,
                        sound: eventObj.sound,
                        icon: eventObj.icon, 
                        data: eventObj.data
                    });
                }

                // Cancel notification
                this.CancelNotifaction = function (id) {
                    cordova.plugins.notification.local.cancel(id, function () {
                        // Notications is canceled... Throw stuff here to run after notification was canceled
                    }, null);
                }
            }

            events = new NotificationObject();// cordova.plugins.notification.local;
        }
    }
});