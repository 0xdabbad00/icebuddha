import argparse
import sys
import json
import icebuddha
from collections import OrderedDict

def getStructured(json):
    result = []
    for e in json:
        element = OrderedDict()
        element['label'] = e[0]
        element['size'] = e[1]
        element['data'] = e[2]
        element['offset'] = e[3]
        element['interpretation'] = e[5]
        element['children'] = getStructured(e[4])
        result.append(element)
    return result

def findElement(struct, needle):
	if isinstance(struct, list):
		for e in struct:
			result = findElement(e, needle)
			if result != None:
				return result
		return None

	if struct['label'] == needle:
		return struct
	for c in struct['children']:
		result = findElement(c, needle)
		if result != None:
			return result
	return None

def parseFile(filename, filetype):
	if filetype == 'gif':
		import gif
		p = gif.Parser()
	elif filetype == 'pe':
		import pe
		p = gif.Parser()
	else:
		print "Unknown file type"
		sys.exit(-1)

	with open(filename, "rb") as f:
		bytes = f.read()

	parsedJson = p.run(bytearray(bytes))
	return getStructured(parsedJson)

if __name__ == "__main__":
	argparser = argparse.ArgumentParser(description='IceBuddha parsing script')
	argparser.add_argument('-t','--type', help='File type [gif, pe]', required=True)
	argparser.add_argument('files', metavar='files', type=str, nargs='+',
	                   help='files to parse')
	args = vars(argparser.parse_args())

	for filename in args['files']:
		filetype = args['type'].lower()
		print json.dumps(parseFile(filename, filetype), indent=2)