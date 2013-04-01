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
            print "Big endian"

        
        ib.append(machHeader)
        return ib.getParseTree()

parser = Parser()
