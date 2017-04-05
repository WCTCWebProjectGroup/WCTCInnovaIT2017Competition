var journal = new function () {
    
    this.GetEditorHtml = function () {
        return $('#froala-editor').froalaEditor('html.get', true);
    }
}