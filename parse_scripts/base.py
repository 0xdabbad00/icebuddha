filedata = []

def intToHex(value):
    return "%0.8X" % value

def nbsp():
    return "%snbsp;" % chr(0x26)


def parse(offset, structName, input, comment=""):
    struct = Node(structName, offset)
    struct.setComment(comment)
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

    def setComment(self, comment):
        self.comment = comment

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

