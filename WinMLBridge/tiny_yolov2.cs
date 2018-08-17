using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Windows.Media;
using Windows.Storage;
using Windows.AI.MachineLearning.Preview;
using Windows.Foundation;
using System.Runtime.InteropServices.WindowsRuntime;
using System.IO;
using Windows.Graphics.Imaging;
using Windows.Storage.Streams;
using System.Linq;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Shapes;
using Windows.UI.Xaml.Media.Imaging;
using Windows.UI.Xaml;
using Windows.UI.Text;

// d224f87054234871a169eda0b7463d86

namespace WinMLBridge
{
    public sealed class YOLOModelInput
    {
        public VideoFrame videoFrame { get; set; }
    }

    public sealed class YOLOModelOutput
    {
        public IList<float> grid { get; set; }
        public YOLOModelOutput()
        {
            grid = new List<float>(new float[21125]);
        }
    }

    public sealed class YoloModel
    {
        private LearningModelPreview learningModel;
        private YoloOutputParser parser;
        private YOLOModelInput input;

        public YoloModel()
        {
            parser = new YoloOutputParser();
        }

        public static string CheckBridge()
        {
            return "Can reach bridge";
        }

        public static IAsyncOperation<YoloModel> CreateModelAsync(Uri modelUri)
        {
            // return Task.Run(async () => { return await CreateD224f87054234871a169eda0b7463d86Model(filePath); }).AsAsyncOperation();
            return CreateModel(modelUri).AsAsyncOperation();
        }

        public IAsyncOperation<YOLOModelOutput> EvaluateModelAsync(string imageBase64Encoded)
        {
           return EvaluateAsync(imageBase64Encoded).AsAsyncOperation();
        }

        public IAsyncOperation<IList<YoloBoundingBox>> EvaluateModelAndProcessOutputAsync(string imageBase64Encoded)
        {
            return EvaluateAndProcessOutputAsync(imageBase64Encoded).AsAsyncOperation();
        }

        private async Task<IList<YoloBoundingBox>> EvaluateAndProcessOutputAsync(string imageBase64Encoded) //, Windows.UI.Core.CoreDispatcher dispatcher)
        {
            var output = await EvaluateAsync(imageBase64Encoded);
            // process output
            var boxes = parser.ParseOutputs(output.grid.ToArray(), .3F);

            if (boxes.Count > 0)
            {
                // Remove overalapping and low confidence bounding boxes
                boxes = parser.NonMaxSuppress(boxes, 5, .5F);
            }

            // var base64EncodedImage = await DrawOverlaysAsync(input.videoFrame, boxes);            
            // return base64EncodedImage;
            return boxes;
        }

        private async static Task<YoloModel> CreateModel(Uri modelUri)
        {
            StorageFile file = await StorageFile.GetFileFromApplicationUriAsync(modelUri);
            LearningModelPreview learningModel = await LearningModelPreview.LoadModelFromStorageFileAsync(file);
            YoloModel model = new YoloModel
            {
                learningModel = learningModel
            };
            return model;
        }

        private async Task<YOLOModelOutput> EvaluateAsync(string imageBase64Encoded)
        {
            var imageBytes = Convert.FromBase64String(imageBase64Encoded);
            var memoryStream = new MemoryStream(imageBytes);
            BitmapDecoder bitDecoder = await BitmapDecoder.CreateAsync(memoryStream.AsRandomAccessStream());
            var softwareBitmap = await bitDecoder.GetSoftwareBitmapAsync();
            var videoFrame = VideoFrame.CreateWithSoftwareBitmap(softwareBitmap);
            input = new YOLOModelInput
            {
                videoFrame = videoFrame
            };         

            // Retrieve model input and output variable descriptions (we already know the model takes an image in and outputs a tensor)
            var inputFeatures = learningModel.Description.InputFeatures.ToList();
            var outputFeatures = learningModel.Description.OutputFeatures.ToList();

           var inputImageDescription =
                inputFeatures.FirstOrDefault(feature => feature.ModelFeatureKind == LearningModelFeatureKindPreview.Image)
                as ImageVariableDescriptorPreview;

            var outputTensorDescription =
                outputFeatures.FirstOrDefault(feature => feature.ModelFeatureKind == LearningModelFeatureKindPreview.Tensor)
                as TensorVariableDescriptorPreview;

            YOLOModelOutput output = new YOLOModelOutput();
            LearningModelBindingPreview binding = new LearningModelBindingPreview(learningModel);
            binding.Bind(inputImageDescription.Name, input.videoFrame);
            binding.Bind(outputTensorDescription.Name, output.grid);
            LearningModelEvaluationResultPreview evalResult = await learningModel.EvaluateAsync(binding, string.Empty);
            return output;
        }

        private async Task<string> DrawOverlaysAsync(VideoFrame inputImage, IList<YoloBoundingBox> boxes)
        {

            var canvas = new Canvas();
            canvas.Width = canvas.Height = 416;

            // Render output
            if (boxes.Count > 0)
            {
                // Remove overalapping and low confidence bounding boxes
                var filteredBoxes = parser.NonMaxSuppress(boxes, 5, .5F);

                foreach (var box in filteredBoxes)
                    await DrawYoloBoundingBoxAsync(inputImage.SoftwareBitmap, box, canvas);

                var imageBuffer = await ConvertToImage(canvas);
                return Convert.ToBase64String(imageBuffer.ToArray());
            }
            return null;
        }

        private async Task<IBuffer> ConvertToImage(Canvas canvas)
        {
            RenderTargetBitmap renderBitmap = new RenderTargetBitmap();
            // needed otherwise the image output is black

           await renderBitmap.RenderAsync(canvas);

           var imageBuffer = await renderBitmap.GetPixelsAsync();

            return imageBuffer;
        }

        private async Task DrawYoloBoundingBoxAsync(SoftwareBitmap inputImage, YoloBoundingBox box, Canvas canvas)
        {
            var lineBrush = new SolidColorBrush(Windows.UI.Colors.Yellow);
            var  fillBrush = new SolidColorBrush(Windows.UI.Colors.Transparent);
            var  lineThickness = 2.0;
            // Scale is set to stretched 416x416 - Clip bounding boxes to image area
            var x = (uint)Math.Max(box.X, 0);
            var y = (uint)Math.Max(box.Y, 0);
            var w = (uint)Math.Min(canvas.Width - x, box.Width);
            var h = (uint)Math.Min(canvas.Height - y, box.Height);

            var brush = new ImageBrush();

            var bitmapSource = new SoftwareBitmapSource();
            await bitmapSource.SetBitmapAsync(inputImage);

            brush.ImageSource = bitmapSource;
            brush.Stretch = Stretch.Fill;

            canvas.Background = brush;

            var r = new Rectangle();
            r.Tag = box;
            r.Width = w;
            r.Height = h;
            r.Fill = fillBrush;
            r.Stroke = lineBrush;
            r.StrokeThickness = lineThickness;
            r.Margin = new Thickness(x, y, 0, 0);

            var tb = new TextBlock();
            tb.Margin = new Thickness(x + 4, y + 4, 0, 0);
            tb.Text = $"{box.Label} ({Math.Round(box.Confidence, 4).ToString()})";
            tb.FontWeight = FontWeights.Bold;
            tb.Width = 126;
            tb.Height = 21;
            tb.HorizontalTextAlignment = TextAlignment.Center;

            var textBack = new Rectangle();
            textBack.Width = 134;
            textBack.Height = 29;
            textBack.Fill = lineBrush;
            textBack.Margin = new Thickness(x, y, 0, 0);

            canvas.Children.Add(textBack);
            canvas.Children.Add(tb);
            canvas.Children.Add(r);
        }
    }
}
