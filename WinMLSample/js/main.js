function openTab(tabName) {
    tabinput = document.getElementsByClassName("tabinput");
    for (i = 0; i < tabinput.length; i++) {
        tabinput[i].style.display = "none";
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
            startWebcam();
            loadsnaptabElements();
            break;
        case "uploadtab":
            stopWebcam();
            loaduploadtabElements();
            break;
    } 

    document.getElementById(tabName).style.display = "block";
}

async function loaduploadtabElements() {
    document.getElementById("uploadButton").addEventListener("click", async function() {      

        var picker = new Windows.Storage.Pickers.FileOpenPicker();
        picker.viewMode = Windows.Storage.Pickers.PickerViewMode.Thumbnail;
        picker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.PicturesLibrary;
        picker.fileTypeFilter.push(".jpg");
        picker.fileTypeFilter.push(".jpeg");
        picker.fileTypeFilter.push(".png");

        var file = await picker.pickSingleFileAsync();
        if (file !== null) {

            var base64Image = "";
            var reader = new FileReader();
            var image = document.getElementById("uploadedphoto");  

            reader.addEventListener("load", async function () {
                var imageUrl = reader.result;
                image.src = imageUrl;
                base64Image = imageUrl.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
                var model = await loadModel();

                var boxes = await model.evaluateModelAndProcessOutputAsync(base64Image);

                renderImageOutput(boxes, image);

            }, false);

            if (file) {
                reader.readAsDataURL(file);
            }           
        }
        else {
            // do nothing
        }       
    });
}

async function loadsnaptabElements() {
    
    var model = await loadModel();

    // Trigger photo take
    document.getElementById("snapButton").addEventListener("click", async function () {

        var canvas = document.getElementById('snappedPhoto');
        var video = document.getElementById('webcamVideo');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        var canvasContext = canvas.getContext('2d');

        canvasContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        var image = new Image();
        image.src = canvas.toDataURL("image/png", );

        var imageSizeForYolo = 416;
        var canvasForYoloInput = document.createElement("CANVAS");
        canvasForYoloInput.width = imageSizeForYolo;
        canvasForYoloInput.height = imageSizeForYolo;
        var newcanvasContext = canvasForYoloInput.getContext('2d');

        newcanvasContext.drawImage(video, 0, 0, imageSizeForYolo, imageSizeForYolo);
        var imageUrl = canvasForYoloInput.toDataURL("image/png", );
        var base64Image = imageUrl.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");       
               
        var boxes = await model.evaluateModelAndProcessOutputAsync(base64Image);

        renderImageOutput(boxes, image);
    });
}

function startWebcam() {
    var video = document.getElementById('webcamVideo');
    //var parentContainer = document.getElementById('snappedPhoto');
    //video.width = parentContainer.width;
    //video.height = parentContainer.height;

    // Get access to the camera!
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
            video.src = window.URL.createObjectURL(stream);
            video.play();
        });
    }
}

function stopWebcam() {
    var video = document.getElementById('webcamVideo');
    video.pause();
}

async function loadModel() {
    var yolo = "ms-appx:///Models/tiny_yolov2/TinyYOLO.onnx";

    var modelUri = new Windows.Foundation.Uri(yolo);
    var model = await WinMLBridge.YoloModel.createModelAsync(modelUri);
    console.log("Log: Model Loaded " + model);    
    return model;
}

function renderImageOutput(boxes, img) {

    var canvas = document.getElementById("outputCanvas");
    var video = document.getElementById('webcamVideo');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    var scaleWidth = video.videoWidth / 416;
    var scaleHeigth = video.videoHeight / 416;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    boxes.forEach((box, index) => {
        ctx.beginPath();
        ctx.lineWidth = "3";
        ctx.strokeStyle = "blue";
        ctx.rect(box.x * scaleWidth, box.y * scaleHeigth, box.width * scaleWidth, box.height *scaleHeigth);
        ctx.stroke();
        ctx.font = "20px Georgia";
        ctx.fillText(box.label , (box.x + box.width/4) * scaleWidth, (box.y + box.height/4) * scaleHeigth);
    });
}




