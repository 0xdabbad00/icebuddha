class Parse:
    def append(self, node):
        self.parser.append(node.get())

    def run(self, data):
        global filedata
        filedata = data
        self.parser = []

        print("Unknown file type");
        # Try using something like the following
        # startStruct = parse(0, "START_STRUCT", """
        #    WORD magic; /* Magic signature */
        #    DWORD length;
        # """)
        #
        # self.append(startStruct);

        return self.parser

parser = Parse()