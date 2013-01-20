class Parse:
    def append(self, node):
        self.parser.append(node.get())

    def run(self, data):
        global filedata
        filedata = data
        self.parser = []

        imageDosHeader = parse(0, "IMAGE_DOS_HEADER", """
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

        e_lfanew = imageDosHeader.getInt("e_lfanew")
        imageNtHeader = parse(e_lfanew, "IMAGE_NT_HEADER", """
            DWORD                 Signature;
            """)

        imageFileHeader = parse(imageNtHeader.end(), "IMAGE_FILE_HEADER", """
            WORD  Machine;
            WORD  NumberOfSections;
            DWORD TimeDateStamp;
            DWORD PointerToSymbolTable;
            DWORD NumberOfSymbols;
            WORD  SizeOfOptionalHeader;
            WORD  Characteristics;
            """)
        imageNtHeader.append(imageFileHeader)

        # IMAGE_OPTIONAL_HEADER
        machine = imageFileHeader.getInt("Machine")
        imageOptionalHeader = []
        if (machine == 0x014c):
            imageOptionalHeader = parse(imageNtHeader.end(), "IMAGE_OPTIONAL_HEADER", """
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
            imageOptionalHeader = parse(imageNtHeader.end(), "IMAGE_OPTIONAL_HEADER64", """
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

        IMAGE_DATA_DIRECTORY = """
            DWORD VirtualAddress;
            DWORD Size;
            """
        imageOptionalHeader.append(parse(imageOptionalHeader.end(), "IMAGE_DATA_DIRECTORY", IMAGE_DATA_DIRECTORY, "export table"))
        imageOptionalHeader.append(parse(imageOptionalHeader.end(), "IMAGE_DATA_DIRECTORY", IMAGE_DATA_DIRECTORY, "import table"))

        imageNtHeader.append(imageOptionalHeader)
        self.append(imageNtHeader)

        return self.parser

parser = Parse()