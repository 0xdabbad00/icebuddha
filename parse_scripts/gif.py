""" GIF file parse script for IceBuddha.com
"""
import icebuddha

__author__ = "0xdabbad00"
__license__ = "Apache"


class Parser:
    def run(self, data):
        filedata = data
        ib = icebuddha.IceBuddha()

        RGB = """
            BYTE   R;
            BYTE   G;
            BYTE   B;
        """

        gifHeader = ib.parse(filedata, 0, "GIFHEADER", """
            CHAR    Signature[3];
            CHAR    Version[3];
        """)
        if (gifHeader.findChild("Signature").getValue() != "GIF"):
            return []
        ib.append(gifHeader)

        lsd = ib.parse(filedata, gifHeader.end(), "LOGICAL_SCREEN_DESCRIPTOR", """
            WORD  Width;
            WORD  Height;
            BYTE  GlobalColorTable;
            BYTE  BackgroundColorIndex;
            BYTE  PixelAspectRatio;
        """)
        gct = lsd.findChild("GlobalColorTable")
        gct.parseBitField(filedata, """
            BYTE   GlobalColorTableFlag : 1;
            BYTE   ColorResolution : 3;
            BYTE   SortFlag : 1;
            BYTE   SizeOfGlobalColorTable : 3;
            """)
        GlobalColorTableFlag = gct.getData(filedata) & 1

        if (GlobalColorTableFlag == 1):
            SizeOfGlobalColorTable = (gct.getData(filedata) & 7)
            SizeOfGlobalColorTable = 1 << (SizeOfGlobalColorTable + 1)
            ColorTable = ib.parse(filedata, lsd.end(), "ColorTable RGB[%d]" % SizeOfGlobalColorTable, "")
            for i in range(SizeOfGlobalColorTable):
                color = ib.parse(filedata, ColorTable.end(), "RGB /* " + str(i) + " */", RGB)
                ColorTable.append(color)
            lsd.append(ColorTable)
        ib.append(lsd)

        offset = lsd.end()
        Data = ib.parse(filedata, offset, "Data", "")
        while (filedata[offset] != 0x3B and offset < len(filedata)):
            if (filedata[offset] == 0x2C):
                imgDescriptor = ib.parse(filedata, offset, "IMAGE_DESCRIPTOR", """
                    BYTE  ImageSeperator;
                    WORD  Left;
                    WORD  Top;
                    WORD  Width;
                    WORD  Height;
                    BYTE  PackedField;
                """)
                imgDescriptorPackedField = imgDescriptor.findChild("PackedField")
                imgDescriptorPackedField.parseBitField(filedata, """
                    BYTE  LocalColorTableFlag : 1;
                    BYTE  InterlaceFlag : 1;
                    BYTE  SortFlag : 1;
                    BYTE  Reserved : 2;
                    BYTE  SizeOfLocalColorTable : 3;
                    """)
                Data.append(imgDescriptor)

                LocalColorTableFlag = imgDescriptorPackedField.getData(filedata) & 1
                if (LocalColorTableFlag == 1):
                    SizeOfLocalColorTable = (imgDescriptorPackedField.getData(filedata) & 7)
                    SizeOfLocalColorTable = 1 << (SizeOfLocalColorTable + 1)
                    ColorTable = ib.parse(filedata, imgDescriptor.end(), "ColorTable RGB[%d]" % SizeOfLocalColorTable, "")
                    for i in range(SizeOfLocalColorTable):
                        color = ib.parse(filedata, ColorTable.end(), "RGB /* " + str(i) + " */", RGB)
                        ColorTable.append(color)
                    Data.append(ColorTable)
                imgData = ib.parse(filedata, Data.end(), "IMAGE_DATA", "BYTE LZWMinimumCodeSize;")
                self.getDataSubBlocks(filedata, ib, imgData)
                Data.append(imgData)

            elif (ib.isEqual(filedata, offset, [0x21, 0xF9])):
                Data.append(ib.parse(filedata, offset, "GraphicsControlExtension", """
                    BYTE Introducer;   /* Extension Introducer (always 21h) */
                    BYTE Label;        /* Graphic Control Label (always F9h) */
                    BYTE BlockSize;    /* Size of remaining fields (always 04h) */
                    BYTE Packed;       /* Method of graphics disposal to use */
                    WORD DelayTime;    /* Hundredths of seconds to wait   */
                    BYTE ColorIndex;   /* Transparent Color Index */
                    BYTE Terminator;   /* Block Terminator (always 0) */
                """))
                # TODO Handle Packed field

            elif (ib.isEqual(filedata, offset, [0x21, 0xFE])):
                commentExtension = ib.parse(filedata, offset, "CommentExtension", """
                    BYTE ExtensionIntroducer;
                    BYTE CommentLabel;
                """)
                self.getDataSubBlocks(commentExtension)
                Data.append(commentExtension)

            elif (ib.isEqual(filedata, offset, [0x21, 0x01])):
                plainTextExtension = ib.parse(filedata, offset, "PlainTextExtension", """
                    BYTE Introducer;         /* Extension Introducer (always 21h) */
                    BYTE Label;              /* Extension Label (always 01h) */
                    BYTE BlockSize;          /* Size of Extension Block (always 0Ch) */
                    WORD TextGridLeft;       /* X position of text grid in pixels */
                    WORD TextGridTop;        /* Y position of text grid in pixels */
                    WORD TextGridWidth;      /* Width of the text grid in pixels */
                    WORD TextGridHeight;     /* Height of the text grid in pixels */
                    BYTE CellWidth;          /* Width of a grid cell in pixels */
                    BYTE CellHeight;         /* Height of a grid cell in pixels */
                    BYTE TextFgColorIndex;   /* Text foreground color index value */
                    BYTE TextBgColorIndex;   /* Text background color index value */
                    BYTE PlainTextData;     /* The Plain Text data */
                    BYTE Terminator;         /* Block Terminator (always 0) */
                """)
                # TODO Handle PlainTextData
                Data.append(plainTextExtension)

            elif (ib.isEqual(filedata, offset, [0xFF])):
                applicationExtension = ib.parse(filedata, offset, "ApplicationExtension", """
                    BYTE  BlockSize;
                    BYTE  ApplicationIdentifier[8];
                    BYTE  ApplicationAuthenticationCode[3];
                """)
                Data.append(applicationExtension)
            else:
                print "Undefined data at %d" % offset
                break

            offset = Data.end()

        ib.append(Data)
        ib.append(ib.parse(filedata, Data.end(), "TRAILER", "BYTE GIFTrailer;"))
        return ib.getParseTree()

    def getDataSubBlocks(self, filedata, ib, struct):
        size = 1
        while (size != 0):
            size = filedata[struct.end()]
            subBlock = ib.parse(filedata, struct.end(), "SUBBLOCK", """
                BYTE Size;
                BYTE Data[%d];
            """ % size)
            struct.append(subBlock)

parser = Parser()
