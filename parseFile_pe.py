filedata = []

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

    def getValue(self, valueName):
        for c in self.children:
            if c.name == valueName:
                if c.size == 1:
                    return filedata[c.offset]
                elif c.size == 2:
                    return filedata[c.offset] + (filedata[c.offset + 1] << 8)
                elif c.size == 4:
                    return filedata[c.offset] + (filedata[c.offset + 1] << 8) + (filedata[c.offset + 2] << 16) + (filedata[c.offset + 3] << 24)
                else:
                    print "TODO: Can not get data for values over 4 bytes"
                    return 0

    def end(self):
        return self.offset + self.size

    def append(self, child):
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
            struct.append(n)
        return struct

    def run(self, data):
        global filedata
        filedata = data
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

        e_lfanew = imageDosHeader.getValue("e_lfanew")
        imageNtHeader = self.parse(e_lfanew, "IMAGE_NT_HEADER", """
            DWORD                 Signature;
            """)

        imageFileHeader = self.parse(imageNtHeader.end(), "IMAGE_FILE_HEADER", """
            WORD  Machine;
            WORD  NumberOfSections;
            DWORD TimeDateStamp;
            DWORD PointerToSymbolTable;
            DWORD NumberOfSymbols;
            WORD  SizeOfOptionalHeader;
            WORD  Characteristics;
            """)
        imageNtHeader.append(imageFileHeader)

        print "IMAGE_OPTIONAL_HEADER"
        # IMAGE_OPTIONAL_HEADER
        machine = imageFileHeader.getValue("Machine")
        imageOptionalHeader = []
        if (machine == 0x014c):
            imageOptionalHeader = self.parse(imageNtHeader.end(), "IMAGE_OPTIONAL_HEADER", """
                WORD  Magic;
                BYTE  MajorLinkerVersion;
                BYTE  MinorLinkerVersion;
                DWORD SizeOfCode;
                DWORD SizeOfInitializedData;
                DWORD SizeOfUninitializedData;
                DWORD AddressOfEntryPoint;            
                DWORD BaseOfCode;
                DWORD BaseOfData;
                DWORD ImageBase;
                DWORD SectionAlignment;               
                DWORD FileAlignment;
                WORD  MajorOperatingSystemVersion;
                WORD  MinorOperatingSystemVersion;
                WORD  MajorImageVersion;
                WORD  MinorImageVersion;
                WORD  MajorSubsystemVersion;
                WORD  MinorSubsystemVersion;
                DWORD Win32VersionValue;
                DWORD SizeOfImage;
                DWORD SizeOfHeaders;
                DWORD CheckSum;   
                WORD  Subsystem;
                WORD  DllCharacteristics;
                DWORD SizeOfStackReserve;
                DWORD SizeOfStackCommit;
                DWORD SizeOfHeapReserve;
                DWORD SizeOfHeapCommit;
                DWORD LoaderFlags;
                DWORD NumberOfRvaAndSizes;
                """)
        elif (machine == 0x8664):
            imageOptionalHeader = self.parse(imageNtHeader.end(), "IMAGE_OPTIONAL_HEADER64", """
                WORD        Magic;
                BYTE        MajorLinkerVersion;
                BYTE        MinorLinkerVersion;
                DWORD       SizeOfCode;
                DWORD       SizeOfInitializedData;
                DWORD       SizeOfUninitializedData;
                DWORD       AddressOfEntryPoint;
                DWORD       BaseOfCode;
                ULONGLONG   ImageBase;
                DWORD       SectionAlignment;
                DWORD       FileAlignment;
                WORD        MajorOperatingSystemVersion;
                WORD        MinorOperatingSystemVersion;
                WORD        MajorImageVersion;
                WORD        MinorImageVersion;
                WORD        MajorSubsystemVersion;
                WORD        MinorSubsystemVersion;
                DWORD       Win32VersionValue;
                DWORD       SizeOfImage;
                DWORD       SizeOfHeaders;
                DWORD       CheckSum;
                WORD        Subsystem;
                WORD        DllCharacteristics;
                ULONGLONG   SizeOfStackReserve;
                ULONGLONG   SizeOfStackCommit;
                ULONGLONG   SizeOfHeapReserve;
                ULONGLONG   SizeOfHeapCommit;
                DWORD       LoaderFlags;
                DWORD       NumberOfRvaAndSizes;
                """)
        else:
            print("ERROR: machine type unknown: %d" % machine)

        print "Final append"
        imageNtHeader.append(imageOptionalHeader)
        self.append(imageNtHeader)

        return self.parser

parser = Parse()