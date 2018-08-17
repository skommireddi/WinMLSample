if (window.Windows) {
        Windows.UI.WebUI.WebUIApplication.addEventListener('activated', async function (args) {

            var check = WinMLBridge.YoloModel.checkBridge();
            console.log("Log:" + check);

            var video = document.getElementById('video');

            // Get access to the camera!
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                // Not adding `{ audio: true }` since we only want video now
                navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
                    video.src = window.URL.createObjectURL(stream);
                    video.play();
                });
            }

            // Elements for taking the snapshot
            var canvas = document.getElementById('canvas');
            var canvasContext = canvas.getContext('2d');

            // Trigger photo take
            document.getElementById("snap").addEventListener("click", async function () {
                canvasContext.drawImage(video, 0, 0, 640, 480);               
                var imageUrl = canvas.toDataURL("image/png");
                var base64Image = imageUrl.replace(/^data:image\/(png|jpg);base64,/, "");

                var image = new Image();
                image.src = imageUrl;

                var model = await loadModel();
                var boxes = await model.evaluateModelAndProcessOutputAsync(base64Image);

                renderImageOutput(boxes, image);
            });
        });
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




