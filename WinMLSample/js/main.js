if (window.Windows) {
        Windows.UI.WebUI.WebUIApplication.addEventListener('activated', async function (args) {

            var check = WinMLBridge.D224f87054234871a169eda0b7463d86Model.checkBridge();
            console.log("Log:" + check);

            await loadModel();
        });
}


async function loadModel() {

    var modelUri = new Windows.Foundation.Uri("ms-appx:///Models/tiny_yolov2/tiny_yolov2.onnx");

    var model = await WinMLBridge.D224f87054234871a169eda0b7463d86Model.createModelAsync(modelUri);

    console.log("Log: Model Loaded " + mystr1);
}




