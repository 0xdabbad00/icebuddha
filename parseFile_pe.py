def intToHex(value):
    return "%0.8X" % value

class Node:
    def __init__(self, label="", offset=0, size=0, name="", comment=""):
        self.offset = offset
        self.size = size
        print "##%s"%label

        if (size == 0):
            ws = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
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

class Parse:
    def append(self, node):
        self.parser.append(node.get())

    def run(self, data):
        self.parser = []
    
        child = Node("child_label", 0, 2, "e_magic", "/* MZ header sig */")
        child2 = Node("child_label2", 2, 2, "e_cblp", "/* bytes on last page */")
        imgDosHeader = Node("IMAGE_DOS_HEADER", 0)
        imgDosHeader.addChild(child)
        imgDosHeader.addChild(child2)
        
        self.append(imgDosHeader)

        imgNtHeader = Node("IMAGE_NT_HEADER", 0x100)
        child = Node("child_label", 0x100, 2, "Signature", "/* PE */")
        imgNtHeader.addChild(child)
        self.append(imgNtHeader)
        
        return self.parser

parser = Parse()