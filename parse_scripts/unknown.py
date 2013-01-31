""" Unknown file type parse script for IceBuddha.com
"""
import icebuddha

__author__ = "0xdabbad00"
__license__ = "Apache"

class Parse:
    def run(self, data):

        print("Unknown file type")
        # Try using something like the following
        # startStruct = ib.parse(filedata, 0, "START_STRUCT", """
        #    WORD magic; /* Magic signature */
        #    DWORD length;
        # """)
        #
        # ib.append(startStruct);

        return ib.getParseTree()

parser = Parse()
