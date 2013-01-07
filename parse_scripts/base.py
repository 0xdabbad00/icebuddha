filedata = []


def intToHex(value, fill=8):
    if fill == 8:
        return "%0.8X" % value
    else:
        format = "%s0.%dX" % ("%", fill)
        #return "%0.8X" % value
        return format % value
        


def getBinary(value):
    str = ""
    for i in range(8):
        if (value & (1 << i)) != 0:
            str += "1"
        else:
            str += "0"
    return str


def nbsp(count):
    str = ""
    for i in range(count):
        str += ("%snbsp;" % chr(0x26))
    return str

displayableAscii = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        " ", "!", "", "#", "$", "%", "", "", "(", ")", "*", "+", ",", "-", "", "",
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "", "=", "", "?",
        "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O",
        "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "", "]", "^", "_",
        "", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o",
        "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", ""]


def getString(offset, length):
    str = ""
    for i in range(length):
        val = filedata[offset + i]
        if (val > 127):
            continue
        str += displayableAscii[val]
    return str


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
        ascii = False
        if (type == "BYTE"):
            size = 1
        if (type == "CHAR"):
            size = 1
            ascii = True
        elif (type == "WORD"):
            size = 2
        elif (type == "DWORD"):
            size = 4
        elif (type == "ULONGLONG"):
            size = 8
        else:
            size = 1

        name = parts[1]
        value = ""

        arrayParts = name.split('[')
        if len(arrayParts) > 1:
            arraySize = int((arrayParts[1].split(']'))[0])
            size *= arraySize
            if ascii:
                value = getString(offset, size)
        n = Node(name, offset, size, name, comment, value)
        offset += size
        struct.append(n)
    return struct


class Node:
    def __init__(self, label="", offset=0, size=0, name="", comment="", value=""):
        self.offset = offset
        self.size = size

        if (size == 0):
            ws = "%s" % nbsp(14)
            self.label = intToHex(offset) + ws + label
            self.size = 0
        else:
            self.label = label

        self.name = name
        self.comment = comment
        self.children = []
        self.value = value

    def setComment(self, comment):
        self.comment = comment

    def setValue(self, value):
        self.value = value

    def getData(self):
        return filedata[self.offset]

    def get(self):
        childData = []
        for c in self.children:
            childData.append(c.get())

        return [self.label, self.size, self.name, self.comment, self.offset,
            childData, self.value]

    def findChild(self, childName):
        for c in self.children:
            if c.name == childName:
                return c
        print "Child %s not found" % childName
        return None

    def getInt(self, valueName):
        c = self.findChild(valueName)
        if c is None:
            return 0

        if c.size == 1:
            return filedata[c.offset]
        elif c.size == 2:
            return (filedata[c.offset] +
                (filedata[c.offset + 1] << 8))
        elif c.size == 4:
            return (filedata[c.offset] +
                (filedata[c.offset + 1] << 8) +
                (filedata[c.offset + 2] << 16) +
                (filedata[c.offset + 3] << 24))
        else:
            print "TODO: Can not get data for values over 4 bytes"
            return 0

    def start(self):
        return self.offset

    def end(self):
        return self.offset + self.size

    def append(self, child):
        self.children.append(child)
        self.size += child.size

    def parseBitField(self, input):
        bitCount = 0
        self.value = "%s%s" % (nbsp(2), getBinary(self.getData()))
        for l in input.split('\n'):
            parts = l.split(';')
            if (len(parts) < 2):
                continue
            comment = parts[1]
            parts = parts[0].split(":")
            if (len(parts) < 2):
                continue
            size = int(parts[1])
            if bitCount + size > self.size * 8:
                print "Bit field too large for %s" % self.name

            parts = parts[0].split()
            # ignore type
            name = parts[1]

            bitmask = 0
            for i in range(bitCount, bitCount+size):
                bitmask |= (1 << i)

            data = (bitmask & self.getData()) >> bitCount

            value = "<br>%s%s %s %s : %d %s" % (nbsp(11),
                getBinary(bitmask & self.getData()),
                intToHex(data, 2),
                name,
                size,
                comment)
            self.value += value
            bitCount += size

