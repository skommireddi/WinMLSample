using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WinMLBridge
{
    public sealed class MyRectangle
    {
        public MyRectangle(float top, float left, float width, float height)
        {
            Top = top;
            Left = left;
            Width = width;
            Height = height;
            Bottom = top + height;
            Right = left + width;
        }

        public float Width { get; set; }
        public float Height { get; set; }

        public float Top { get; set; }

        public float Bottom { get; private set; }

        public float Left { get; set; }

        public float Right { get; private set; }

        public float Area { get => Width * Height; }
    }
}
