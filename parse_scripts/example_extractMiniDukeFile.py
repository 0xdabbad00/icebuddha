import json
import sys
import os
import fileparser

filename = sys.argv[1]
filetype = "gif"

# Check if GIFTrailer is at the end of the file
parsedData = fileparser.parseFile(filename, filetype)

trailer = fileparser.findElement(parsedData, "GIFTrailer")
trailerOffset = trailer['offset']

statinfo = os.stat(filename)
extraDataSize = statinfo.st_size - trailerOffset + 1
if (extraDataSize != 0):
	# Discrepency found!
	print "%d bytes found at end of file" % extraDataSize

	# Read file in
	with open(filename, "rb") as f:
		infile = f.read()

	# Extract key
	keybytes = []
	for i in range(4):
		keybyte = ord(infile[trailerOffset+1+i])
		keybytes.append(keybyte)

	# Key uses weird shifting operation to expand 4 bytes to 8
	key = [0 for x in range(8)]
	key[0] = keybytes[0]
	key[1] = ((keybytes[0] & 0xf) << 4) | (keybytes[3] >> 4)
	key[2] = keybytes[3]
	key[3] = ((keybytes[3] & 0xf) << 4) | (keybytes[2] >> 4)

	key[4] = keybytes[2]
	key[5] = ((keybytes[2] & 0xf) << 4) | (keybytes[1] >> 4)
	key[6] = keybytes[1]
	key[7] = ((keybytes[1] & 0xf) << 4) | (keybytes[0] >> 4)

	outfile = []
	keybyte = 0
	for i in range(extraDataSize-6):
		bytein = ord(infile[trailerOffset + 1 + 4 + i])
		print "%02x" % bytein
		outfile.append(bytein ^ key[keybyte])
		keybyte = (keybyte + 1) % 8
	
	with open(filename+".infected", "wb") as f:
		f.write(bytearray(outfile))

	
