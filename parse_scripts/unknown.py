""" Unknown file type parse script for IceBuddha.com
"""
import icebuddha

__author__ = "0xdabbad00"
__license__ = "Apache"

class Parse:
    def run(self, data):
        ib = icebuddha.IceBuddha(filedata, "Unknown")

        print("Unknown file type")
        # Try using something like the following
        # ib = icebuddha.IceBuddha(filedata, "myfile_type")
        # startStruct = ib.parse(0, "START_STRUCT", """
        #    WORD magic; /* Magic signature */
        #    DWORD length;
        # """)
        #
        # ib.append(startStruct);

        return ib.getParseTree()

parser = Parse()
