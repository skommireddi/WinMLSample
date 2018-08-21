function openTab(tabName) {
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    loadTab(tabName); 
}


if (window.Windows) {
    Windows.UI.WebUI.WebUIApplication.addEventListener('activated', async function (args) {

        var check = WinMLBridge.YoloModel.checkBridge();
        console.log("Log:" + check);

        document.getElementById("snaptabheader").addEventListener("click", function () { openTab('snaptab'); });
        document.getElementById("uploadtabheader").addEventListener("click", function () { openTab('uploadtab'); });

        openTab("snaptab");
    });
}

function loadTab(tabName) {

    switch (tabName) {

        case "snaptab":
            var video = startWebcam();
            loadsnaptabElements(video);
            break;
        case "uploadtab":
            loaduploadtabElements();
            break;
    } 

    document.getElementById(tabName).style.display = "block";
}

async function loaduploadtabElements() {

    // Trigger photo take
    document.getElementById("uploadButton").addEventListener("click", async function() {      

        var picker = new Windows.Storage.Pickers.FileOpenPicker();
        picker.ViewMode = Windows.Storage.Pickers.PickerViewMode.Thumbnail;
        picker.SuggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.PicturesLibrary;
        picker.FileTypeFilter.Add(".jpg");
        picker.FileTypeFilter.Add(".jpeg");
        picker.FileTypeFilter.Add(".png");

        var file = await picker.pickSingleFileAsync();
        if (file != null) {

            var base64Image = "";
            var reader = new FileReader();

            reader.addEventListener("load", function () {
                preview.src = reader.result;
            }, false);

            if (file) {
                base64Image = reader.readAsDataURL(file);
            }

            var model = await loadModel();
           
            var boxes = await model.evaluateModelAndProcessOutputAsync(base64Image);

            renderImageOutput(boxes, image);
        }
        else {
            // do nothing
        }

       
    });
}

async function loadsnaptabElements(video) {
    // Elements for taking the snapshot
    var canvas = document.getElementById('canvas');
    var canvasContext = canvas.getContext('2d');
    var model = await loadModel();

    // Trigger photo take
    document.getElementById("snapButton").addEventListener("click", async function () {
        canvasContext.drawImage(video, 0, 0, 640, 480);
        var imageUrl = canvas.toDataURL("image/png");
        var base64Image = imageUrl.replace(/^data:image\/(png|jpg);base64,/, "");

        var image = new Image();
        image.src = imageUrl;
       
        var boxes = await model.evaluateModelAndProcessOutputAsync(base64Image);

        renderImageOutput(boxes, image);
    });
}

function startWebcam() {
    var video = document.getElementById('video');

    // Get access to the camera!
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Not adding `{ audio: true }` since we only want video now
        navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
            video.src = window.URL.createObjectURL(stream);
            video.play();
        });
    }

    return video;
}

async function loadModel() {
    //var yolo2 = "ms-appx:///Models/tiny_yolov2/tiny_yolov2.onnx";
    var yolo = "ms-appx:///Models/tiny_yolov2/TinyYOLO.onnx";

    var modelUri = new Windows.Foundation.Uri(yolo);
    var model = await WinMLBridge.YoloModel.createModelAsync(modelUri);
    console.log("Log: Model Loaded " + model);    
    return model;
}

function renderImageOutput(boxes, img) {

    var canvas = document.getElementById("outputCanvas");
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    boxes.forEach((box, index) => {
        ctx.beginPath();
        ctx.lineWidth = "3";
        ctx.strokeStyle = "green";
        ctx.rect(box.x, box.y, box.width, box.height);
        ctx.stroke();
        ctx.font = "20px Georgia";
        ctx.fillText(box.label , box.x + box.width/4, box.y + box.height/4);
    });
}




