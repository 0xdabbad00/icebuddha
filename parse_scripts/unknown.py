""" Unknown file type parse script for IceBuddha.com
"""
import icebuddha

__author__ = "0xdabbad00"
__license__ = "Apache"

filedata = []


class Parse:
    def append(self, node):
        self.parser.append(node.get())

    def run(self, data):
        global filedata
        filedata = data
        self.parser = []

        print("Unknown file type")
        # Try using something like the following
        # startStruct = icebuddha.parse(filedata, 0, "START_STRUCT", """
        #    WORD magic; /* Magic signature */
        #    DWORD length;
        # """)
        #
        # self.append(startStruct);

        return self.parser

parser = Parse()
