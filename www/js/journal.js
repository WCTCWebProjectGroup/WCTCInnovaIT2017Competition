var journal = new function () {
    
    this.GetEditorHtml = function () {
        return $('#froala-editor').froalaEditor('html.get', true);
    }
}

// ----- Event Listeners ----- //

(function () {
    // WIP
    document.getElementById("takePicture").addEventListener("click", ()=>{
        console.log("Taking a picture is still a WIP!");
    });
})();

// ----- END Event Listeners ----- //