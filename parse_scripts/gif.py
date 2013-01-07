class Parse:
    def append(self, node):
        self.parser.append(node.get())

    def run(self, data):
        global filedata
        filedata = data
        self.parser = []

        gifHeader = parse(0, "GIFHEADER", """
            CHAR    Signature[3];
            CHAR    Version[3];
        """)
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


        self.append(lsd)

        return self.parser

parser = Parse()