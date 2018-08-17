namespace WinMLBridge
{
    public sealed class YoloBoundingBox
    {
        public string Label { get; set; }
        public float X { get; set; }
        public float Y { get; set; }

        public float Height { get; set; }
        public float Width { get; set; }

        public float Confidence { get; set; }

        public MyRectangle Rect
        {
            get { return new MyRectangle(X, Y, Width, Height); }
        }
    }
}
