def intToHex(value):
    return "%0.8X" % value

def nbsp():
    return "%snbsp;" % chr(0x26)

class Node:
    def __init__(self, label="", offset=0, size=0, name="", comment=""):
        self.offset = offset
        self.size = size

        if (size == 0):
            ws = "%s%s%s%s%s%s%s%s%s%s%s%s%s%s" % (nbsp(), nbsp(), nbsp(), nbsp(), nbsp(), nbsp(), nbsp(), nbsp(), nbsp(), nbsp(), nbsp(), nbsp(),nbsp(), nbsp())
            self.label = intToHex(offset) + ws + label
            self.size = 0
        else:
            self.label = label

        self.name = name
        self.comment = comment
        self.children = []

    def get(self):
        childData = []
        for c in self.children:
            childData.append(c.get())

        return [self.label, self.size, self.name, self.comment, self.offset, childData]

    def addChild(self, child):
        self.children.append(child)
        self.size += child.size

class Parse:
    def append(self, node):
        self.parser.append(node.get())

    def parse(self, offset, structName, input):
        struct = Node(structName, offset)
        for l in input.split('\n'):
            parts = l.split(';')
            if (len(parts) < 2):
                continue
            comment = parts[1]
            parts = parts[0].split()
            type = parts[0]
            if (type=="WORD"):
                size = 2
            elif (type=="DWORD"):
                size = 4
            elif (type=="ULONGLONG"):
                size = 8
            else:
                size = 1

            name = parts[1]

            arrayParts = name.split('[')
            if len(arrayParts)>1:
                arraySize = int((arrayParts[1].split(']'))[0])
                size *= arraySize
            n = Node(name, offset, size, name, comment)
            offset += size
            struct.addChild(n)
        return struct

    def run(self, data):
        self.parser = []

        imageDosHeader = self.parse(0, "IMAGE_DOS_HEADER", """
            WORD  e_magic;      /* MZ Header signature */
            WORD  e_cblp;       /* Bytes on last page of file */
            WORD  e_cp;         /* Pages in file */
            WORD  e_crlc;       /* Relocations */
            WORD  e_cparhdr;    /* Size of header in paragraphs */
            WORD  e_minalloc;   /* Minimum extra paragraphs needed */
            WORD  e_maxalloc;   /* Maximum extra paragraphs needed */
            WORD  e_ss;         /* Initial (relative) SS value */
            WORD  e_sp;         /* Initial SP value */
            WORD  e_csum;       /* Checksum */
            WORD  e_ip;         /* Initial IP value */
            WORD  e_cs;         /* Initial (relative) CS value */
            WORD  e_lfarlc;     /* File address of relocation table */
            WORD  e_ovno;       /* Overlay number */
            WORD  e_res[4];     /* Reserved words */
            WORD  e_oemid;      /* OEM identifier (for e_oeminfo) */
            WORD  e_oeminfo;    /* OEM information; e_oemid specific */
            WORD  e_res2[10];   /* Reserved words */
            DWORD e_lfanew;     /* Offset to extended header */
            """)    
        self.append(imageDosHeader)

        imgNtHeader = Node("IMAGE_NT_HEADER", 0x100)
        child = Node("child_label", 0x100, 2, "Signature", "/* PE */")
        imgNtHeader.addChild(child)
        imgFileHeader = Node("IMAGE_FILE_HEADER", 0x102)
        child = Node("child_label", 0x102, 2, "Machine")
        imgFileHeader.addChild(child)
        imgNtHeader.addChild(imgFileHeader)
        self.append(imgNtHeader)
        
        return self.parser

parser = Parse()