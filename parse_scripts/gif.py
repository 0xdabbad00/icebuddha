class Parse:
    def append(self, node):
        self.parser.append(node.get())

    def run(self, data):
        global filedata
        filedata = data
        self.parser = []

        
        gifHeader = parse(0, "GIFHEADER", """
            BYTE    Signature[3];
            BYTE    Version[3];
        """)
        self.append(gifHeader)

        lsd = parse(gifHeader.end(), "LOGICAL_SCREEN_DESCRIPTOR", """
            WORD  Width;
            WORD  Height;
            BYTE  GlobalColorTable; /* GlobalColorTableFlag : 1; ColorResolution : 3; SortFlag : 1; SizeOfGlobalColorTable : 3; */
            BYTE  BackgroundColorIndex;
            BYTE  PixelAspectRatio;
        """)

        self.append(lsd)



        return self.parser

parser = Parse()