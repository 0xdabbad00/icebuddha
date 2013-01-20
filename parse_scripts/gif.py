class Parse:
    def append(self, node):
        self.parser.append(node.get())

    def run(self, data):
        global filedata
        filedata = data
        self.parser = []

        RGB = """
            UBYTE   R;
            UBYTE   G;
            UBYTE   B;
        """

        gifHeader = parse(0, "GIFHEADER", """
            CHAR    Signature[3];
            CHAR    Version[3];
        """)
        if (gifHeader.findChild("Signature").getValue() != "GIF"):
            print "Not a GIF file"
            return []
        self.append(gifHeader)

        lsd = parse(gifHeader.end(), "LOGICAL_SCREEN_DESCRIPTOR", """
            WORD  Width;
            WORD  Height;
            BYTE  GlobalColorTable;
            BYTE  BackgroundColorIndex;
            BYTE  PixelAspectRatio;
        """)
        gct = lsd.findChild("GlobalColorTable")
        gct.parseBitField("""
            BYTE   GlobalColorTableFlag : 1;
            BYTE   ColorResolution : 3;
            BYTE   SortFlag : 1;
            BYTE   SizeOfGlobalColorTable : 3;
            """)

        GlobalColorTableFlag = gct.getData() & 1

        if (GlobalColorTableFlag == 1):
            SizeOfGlobalColorTable = (gct.getData() & 7)
            SizeOfGlobalColorTable = 1 << (SizeOfGlobalColorTable + 1)
            ColorTable = parse(lsd.end(), "ColorTable RGB[%d]" % SizeOfGlobalColorTable, "")
            for i in range(SizeOfGlobalColorTable):
                color = parse(ColorTable.end(), "RGB /* " + str(i) + " */", RGB)
                ColorTable.append(color)
            lsd.append(ColorTable)
        self.append(lsd)

        offset = lsd.end()
        Data = parse(offset, "Data", "")
        while (filedata[offset] != 0x3B):
            print "In while loop"
            if (filedata[offset] == 0x2C):
                imgDescriptor = parse(offset, "IMAGE_DESCRIPTOR", """
                    BYTE   ImageSeperator;
                    WORD  ImageLeftPosition;
                    WORD  ImageTopPosition;
                    WORD  ImageWidth;
                    WORD  ImageHeight;
                    BYTE  PackedField;
                """)
                imgDescriptorPackedField = imgDescriptor.findChild("PackedField")
                imgDescriptorPackedField.parseBitField("""
                    BYTE   LocalColorTableFlag : 1;
                    BYTE   InterlaceFlag : 1;
                    BYTE   SortFlag : 1;
                    BYTE   Reserved : 2;
                    BYTE   SizeOfLocalColorTable : 3;
                    """)
                Data.append(imgDescriptor)

                LocalColorTableFlag = imgDescriptorPackedField.getData() & 1

                if (LocalColorTableFlag == 1):
                    SizeOfLocalColorTable = (imgDescriptorPackedField.getData() & 7)
                    SizeOfLocalColorTable = 1 << (SizeOfLocalColorTable + 1)
                    ColorTable = parse(imgDescriptor.end(), "ColorTable RGB[%d]" % SizeOfLocalColorTable, "")
                    for i in range(SizeOfLocalColorTable):
                        color = parse(ColorTable.end(), "RGB /* " + str(i) + " */", RGB)
                        ColorTable.append(color)
                    lsd.append(ColorTable)
            offset = Data.end()
            break

        self.append(Data)
        self.append(parse(Data.end(), "TRAILER", "BYTE GIFTrailer;"))
        return self.parser

parser = Parse()
