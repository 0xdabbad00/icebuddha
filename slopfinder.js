///////////////////////////////////////////////////////////////////////////////
// Globals
///////////////////////////////////////////////////////////////////////////////
var MAX_FILE_SIZE = 10*1024; // 10K
var NUM_BYTES_TO_LOAD = 16*100;

var fileData;
var numFilesRead = 0;
var filesToRead = 0;

///////////////////////////////////////////////////////////////////////////////
// File reading
///////////////////////////////////////////////////////////////////////////////
function handleFinishedRead(evt, i) {
	if(evt.target.readyState == FileReader.DONE) {
		var length = evt.target.result.byteLength;
		var readBlock =  new Uint8Array(evt.target.result, 0, length);
		doRead(readBlock, length, i);
		numFilesRead++;
		if (numFilesRead == filesToRead) {
			displayResults();
		}
	}
}

function displayResults() {
	var output = [""];
	var executables = [""];
	var unknownFiles = [""];
	for (var i = 0; i < fileData.length; i++) {
		file = fileData[i];
		if (file.type == 'exe') {
			executables.push("<tr><td>"+escape(file.name) + "<td align=center>"+file.dep+"<td align=center>"+file.aslr+"\n");
		} else {
			unknownFiles.push(escape(file.name) + "<br>\n");
		}
	}

	if (executables.length>1) {
		output.push(""+
			"<table border=0 cellpadding=0 cellspacing=0>"+
			"<tr><th width=100>Executable name<th width=100>DEP<br>protection<th width=100>ALSR<br>protection</tr>" 
			+ executables.join("")
			+"</table>");
	} else {
		output.push("<b>No Windows executables found</b><br>");
	}
	if (unknownFiles.length>1) {
		output.push("<br><b>Nonexecutables</b><br>" + unknownFiles.join(""));
	}
	$('#content').html(output.join(""));
}


function doRead(readBlock, length, i) {
	
	fileData[i].type = 'unknown';
	// Check for MZ header
	if (readBlock[0] == 'M'.charCodeAt(0) && readBlock[1] == 'Z'.charCodeAt(0))
	{
		fileData[i].type = 'exe';
		fileData[i].dep = '<font color="red"><b>NO</b></font>';
		fileData[i].aslr = '<font color="red"><b>NO</b></font>';

		// TODO actually check
		offset = 0x3c;
		e_lfanew = ((readBlock[offset+3]<<24)>>>0) +
		  ((readBlock[offset+2]<<16)>>>0) +
		  ((readBlock[offset+1]<<8)>>>0) +
		  (readBlock[offset+0]);
		var offset_in_IMAGE_OPTIONAL_HEADER = 0x46;
		var sizeof_IMAGE_FILE_HEADER = 24;
		offset = e_lfanew + sizeof_IMAGE_FILE_HEADER + offset_in_IMAGE_OPTIONAL_HEADER;
		DllCharacteristics = ((readBlock[offset+1]<<8)>>>0) +
		  (readBlock[offset+0]);
		  
		if ((DllCharacteristics & 0x100) != 0) {
			fileData[i].dep = 'yes';
		}
		if ((DllCharacteristics & 0x40) != 0) {
			fileData[i].aslr = 'yes';
		}
		
	}
}

function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files; // FileList
	numFilesRead = 0;
	filesToRead = files.length;
	fileData = []

	for (var i = 0; i < files.length; i++) {
		(function(i)
		{
			//output.push(evaluateFile(files[0]));
			fileData[i] = {};
			fileData[i].name = files[i].name;
			fileData[i].type = '';
			reader = new FileReader();
			fileData[i].reader = reader;
			var fileNum = i;
			reader.onloadend = function(evt) { handleFinishedRead(evt, fileNum); }
			readFile(reader, files[i]);
		})(i);
	}
	
}

function readFile(reader, file) {
	end = MAX_FILE_SIZE;
	var blob;
	if(file.webkitSlice) {
		blob = file.webkitSlice(0, end);
	} else if(file.mozSlice) {
		blob = file.mozSlice(0, end);
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
