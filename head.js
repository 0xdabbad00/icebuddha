///////////////////////////////////////////////////////////////////////////////
// Globals
///////////////////////////////////////////////////////////////////////////////
var data;
var file;
var reader;
var lastBytesRead = 0;

var NUM_BYTES_TO_LOAD = 16*100;

///////////////////////////////////////////////////////////////////////////////
// Utility functions
///////////////////////////////////////////////////////////////////////////////
function dispAscii(val) {
	var displayableAscii = new Array( 
			".", ".", ".", ".", ".", ".", ".", ".", ".", "\t", "\n", ".", ".", "\r", ".", ".",
			".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", 
			" ", "!", "\"", "#", "$", "%", ".", "\'", "(", ")", "*", "+", ",", "-", ".", "\/", 
			"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "&lt;", "=", "&gt;", "?", 
			"@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", 
			"P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", 
			".", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", 
			"p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", ".");
	if (val > 127) return '.';
	return displayableAscii[val];
}

///////////////////////////////////////////////////////////////////////////////
// File reading
///////////////////////////////////////////////////////////////////////////////
function handleFinishedRead(evt) {
	if(evt.target.readyState == FileReader.DONE) {
		var length = evt.target.result.byteLength;
		var readBlock =  new Uint8Array(evt.target.result, 0, length);
		doRead(readBlock, length);
	}
}


function doRead(readBlock, length) {
	var output = [""];
	start = lastBytesRead; 
	for (var i = 0; i < readBlock.length; i++) {
		data[start+i] = readBlock[i];
	}
	
	var ascii = [""];
	
	for (var i = lastBytesRead; i < lastBytesRead + readBlock.length; i++) {
		ascii.push(dispAscii(data[i]));
	}

	// Set html
	asciiString = "<pre>"+ascii.join("")+"</pre>";
	
	
	$('#byte_content').html(asciiString);
	
}


function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files; // FileList

	file = files[0];  // File object

	// Create array to hold all data in the file.  The file data will be read in as chunks as needed.
	data = new Uint8Array(file.size);
	
	createTemplate(file.name, file.size);

	reader = new FileReader();
	reader.onloadend = handleFinishedRead;
	
	readFileSlice(lastBytesRead, NUM_BYTES_TO_LOAD);
}

function createTemplate(fileName, fileSize) {
	var output = [];
	output.push('<strong>' + escape(fileName)+ '</strong> - ' + fileSize + ' bytes');
	document.getElementById('subheader').innerHTML = output.join(""); 
	
	// Set defaults for new file read
	lastBytesRead = 0;
	
	// Set byte content
	output = [];
	output.push("<table border=0 cellpadding=0 cellspacing=0>\n");
	output.push(" <tr><td width=650px>\n");
	output.push(" <div id=\"byte_content\">");
	output.push("");
	output.push(" </div>\n");
	output.push("</table>\n");
	$('#content').html(output.join(""));
}

function readFileSlice(start, end) {
	// Determine how much to read
	if(file.webkitSlice) {
		var blob = file.webkitSlice(start, end);
	} else if(file.mozSlice) {
		var blob = file.mozSlice(start, end);
	}

	reader.readAsArrayBuffer(blob);
}

function handleDragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy';
}

///////////////////////////////////////////////////////////////////////////////
// Main
///////////////////////////////////////////////////////////////////////////////

//Setup the dnd listeners.
var dropZone = document.getElementById('container');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);
