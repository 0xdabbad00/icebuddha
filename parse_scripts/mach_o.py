""" GIF file parse script for IceBuddha.com
"""
import icebuddha

__author__ = "0xdabbad00"
__license__ = "Apache"

class Parser:
    def run(self, data):
        filedata = data
        ib = icebuddha.IceBuddha(filedata, "MACH_O")

        machHeader = ib.parse(0, "mach_header", """
            DWORD magic;
            DWORD cputype;
            DWORD cpusubtype;
            DWORD filetype;
            DWORD ncmds;
            DWORD sizeofcmds;
            DWORD flags;
        """)

        magicElement = machHeader.findChild("magic")
        magicElement.setMeaningFromConstants("""
            MACHO_32        = 0xFEEDFACE
            MACHO_64        = 0xFEEDFACF
            MACHO_FAT       = 0xCAFEBABE
            MACHO_FAT_CIGAM = 0xBEBAFECA
        """);

        if magicElement.getValue() == "":
            ib.setBigEndian()
            magicElement.setMeaningFromConstants("""
                MACHO_32        = 0xFEEDFACE
                MACHO_64        = 0xFEEDFACF
            """);
            if magicElement.getValue() == "":
                print "Unknown file format"
                return ib.getParseTree()

        cputype = machHeader.findChild("cputype")
        cputype.setMeaningFromConstants("""
            CPU_TYPE_I386       = 0x7
            CPU_TYPE_X86_64     = 0x01000007
            CPU_TYPE_POWERPC    = 0x12
            CPU_TYPE_POWERPC64  = 0x01000012
            CPU_TYPE_ARM        = 0xC
        """);

        filetype = machHeader.findChild("filetype")
        filetype.setMeaningFromConstants("""
            MACH_OBJECT       = 0x1
            MACH_EXECUTE      = 0x2
            MACH_FVMLIB       = 0x3
            MACH_CORE         = 0x4
            MACH_PRELOAD      = 0x5
            MACH_DYLIB        = 0x6
            MACH_DYLINKER     = 0x7
            MACH_BUNDLE       = 0x8
            MACH_DYLIB_STUB   = 0x9
            MACH_DSYM         = 0xA
            MACH_KEXT_BUNDLE  = 0xB
        """);

        flags = machHeader.findChild("flags")
        flags.parseBitField("""
            DWORD NOUNDEFS                   : 1;
            DWORD INCRLINK                   : 1;
            DWORD DYLDLINK                   : 1;
            DWORD BINDATLOAD                 : 1;
            DWORD PREBOUND                   : 1;
            DWORD SPLIT_SEGS                 : 1;
            DWORD LAZY_INIT                  : 1;
            DWORD TWOLEVEL                   : 1;
            DWORD FORCE_FLAT                 : 1;
            DWORD NOMULTIDEFS                : 1;
            DWORD NOFIXPREBINDING            : 1;
            DWORD PREBINDABLE                : 1;
            DWORD ALLMODSBOUND               : 1;
            DWORD SUBSECTIONS_VIA_SYMBOLS    : 1;
            DWORD CANONICAL                  : 1;
            DWORD WEAK_DEFINES               : 1;
            DWORD BINDS_TO_WEAK              : 1;
            DWORD ALLOW_STACK_EXECUTION      : 1;
            DWORD ROOT_SAFE                  : 1;
            DWORD SETUID_SAFE                : 1;
            DWORD NO_REEXPORTED_DYLIBS       : 1;
            DWORD PIE                        : 1;
            DWORD DEAD_STRIPPABLE_DYLIB      : 1;
            DWORD HAS_TLV_DESCRIPTORS        : 1;
            DWORD NO_HEAP_EXECUTION          : 1;
        """);
        
        ib.append(machHeader)
        return ib.getParseTree()

parser = Parser()
