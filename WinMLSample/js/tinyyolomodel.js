var tinyyolomodel = {

    createModelAsync: async function(file) {
        var model = await Windows.AI.MachineLearning.LearningModel.loadFromStorageFileAsync(file);
        this.session = new Windows.AI.MachineLearning.LearningModelSession(model);
        this.binding = new Windows.AI.MachineLearning.LearningModelBinding(this.session);
        return model;
    },

    evaluateAsync: async function (base64Image) {
        
        var imageBytes = Base64Binary.decode(base64Image);
        var stream = new Windows.Storage.Streams.InMemoryRandomAccessStream();
        var writer = new Windows.Storage.Streams.DataWriter(stream.getOutputStreamAt(0));
        writer.writeBytes(imageBytes);
        await writer.storeAsync();
        
        var bitDecoder = await Windows.Graphics.Imaging.BitmapDecoder.createAsync(stream);
        var softwareBitmap = await bitDecoder.getSoftwareBitmapAsync();
        var videoFrame = Windows.Media.VideoFrame.createWithSoftwareBitmap(softwareBitmap);
        this.binding.bind("image", videoFrame);
        var output = await this.session.evaluateAsync(this.binding, "");
        var grid = output.outputs.grid.getAsVectorView();
        var helper = new WinMLBridge.YoloHelper();
        var boxes = helper.parse(grid);

        return boxes;
    }
};