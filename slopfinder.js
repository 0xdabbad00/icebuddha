///////////////////////////////////////////////////////////////////////////////
// Globals
///////////////////////////////////////////////////////////////////////////////
var MAX_FILE_SIZE = 10*1024; // 10K
var NUM_BYTES_TO_LOAD = 16*100;

var files;
var fileData;
var numFilesRead = 0;
var numFiles = 0;
var filesOnly = false;

///////////////////////////////////////////////////////////////////////////////
// File reading
///////////////////////////////////////////////////////////////////////////////
function handleFinishedRead(evt, i) {
	if(evt.target.readyState == FileReader.DONE) {
		var length = evt.target.result.byteLength;
		var readBlock =  new Uint8Array(evt.target.result, 0, length);
		doRead(readBlock, length, i);
		numFilesRead++;
		if (numFilesRead == numFiles) {
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
			executables.push("<tr><td>"+escape(file.name).replace(/%20/g, " ") + "<td align=center>"+file.dep+"<td align=center>"+file.aslr+"\n");
		} else {
			unknownFiles.push(escape(file.name).replace(/%20/g, " ") + "<br>\n");
		}
	}

	output.push("<hr>");

	if (executables.length>1) {
		output.push(""+
			"<table border=0 cellpadding=0 cellspacing=0>"+
			"<tr><th width=100>Executable name<th width=100>DEP<br>protection<th width=100>ASLR<br>protection</tr>" 
			+ executables.join("")
			+"</table>");
	} else {
		output.push("<b>No Windows executables found</b><br>");
	}
	if (unknownFiles.length>1) {
		output.push("<br><b>Nonexecutables</b><br>" + unknownFiles.join(""));
	}
	output.push("<br><br><hr><h2>Protections</h2>");
	output.push("<h3>DEP</h3><a href=\"http://en.wikipedia.org/wiki/Data_Execution_Prevention\">Data Execution Prevention</a> can be turned on by compiling with Visual Studio > 2005 and ensure NXCOMPAT is on (default).");
	output.push("<p><h3>ASLR</h3><a href=\"http://en.wikipedia.org/wiki/Address_space_layout_randomization\">Address Space Layout Randomization</a> can be turned on by compiling with Visual Studio > 2005 and ensure DYNAMICBASE in on (default)");
	$('#analysis').html(output.join(""));
}


function doRead(readBlock, length, i) {
	
	fileData[i].type = 'unknown';
	// Check for MZ header
	if (readBlock[0] == 'M'.charCodeAt(0) && readBlock[1] == 'Z'.charCodeAt(0))
	{
		fileData[i].type = 'exe';
		fileData[i].dep = '<font color="red"><b>NO</b></font>';
		fileData[i].aslr = '<font color="red"><b>NO</b></font>';

		// Get to DllCharacteristics data
		offset = 0x3c;
		e_lfanew = ((readBlock[offset+3]<<24)>>>0) +
		  ((readBlock[offset+2]<<16)>>>0) +
		  ((readBlock[offset+1]<<8)>>>0) +
		  (readBlock[offset+0]);
		sizeof_magic = 4;
		offset = e_lfanew + sizeof_magic;
		machine = 
		  ((readBlock[offset+1]<<8)>>>0) +
		   (readBlock[offset+0]);

		var sizeof_IMAGE_FILE_HEADER = 20;
		var offset_in_IMAGE_OPTIONAL_HEADER;
		if (machine == 0x014c) {
			offset_in_IMAGE_OPTIONAL_HEADER = 0x46;
		} else if (machine == 0x8664) {
			offset_in_IMAGE_OPTIONAL_HEADER = 0x46;
		} else {
			fileData[i].error = "Unknown file type";
			fileData[i].dep = '<font color="red"><b>ERROR</b></font>';
			fileData[i].aslr = '<font color="red"><b>ERROR</b></font>';
		}
		
		offset = e_lfanew + sizeof_magic + sizeof_IMAGE_FILE_HEADER + offset_in_IMAGE_OPTIONAL_HEADER;
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

function handleFile(file, path)
{
	var fileNum = numFiles;
	numFiles++;
	fileData[fileNum] = {};
	fileData[fileNum].name = path;
	fileData[fileNum].type = '';
	fileData[fileNum].error = '';

	reader = new FileReader();
	fileData[fileNum].reader = reader;
	reader.onloadend = function(evt) { handleFinishedRead(evt, fileNum); }
	readFile(reader, file);
}

function handleFileTree(entry, i) {
	var directoryReader = entry.createReader();
            getAllEntries(
                    directoryReader,
                    readDirectory,
                    appendIndentList(parentNode)
                );
}

function readDirectory(entries) {
    for (i = 0; i < entries.length; i++) {
    	(function(i) {
        if (entries[i].isDirectory) {
            var directoryReader = entries[i].createReader();
            getAllEntries(
                    directoryReader,
                    readDirectory
                );
        } else {
            entries[i].file(function(file) {handleFile(file, entries[i].fullPath);}, errorHandler);
        }
    	})(i);
    }
}

function errorHandler(e) {
    console.log('FileSystem API error code: ' + e.code)
}


function getAllEntries(directoryReader, callback) {
    var entries = [];

    var readEntries = function () {
        directoryReader.readEntries(function (results) {
            if (!results.length) {
                entries.sort();
                callback(entries);
            } else {
                entries = entries.concat(toArray(results));
                readEntries();
            }
        }, errorHandler);
    };

    readEntries();
}

function toArray(list) {
    return Array.prototype.slice.call(list || [], 0);
}



function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	items = evt.dataTransfer.items;
	if ($.browser.webkit && (!items || !items[0] || !items[0].webkitGetAsEntry))
	{
		alert("You should really upgrade your browser.  This site needs at least Google Chrome 21 to handle dropped folders.  You can still drop files though.");
		items = evt.dataTransfer.files;
		filesOnly = true;
	} else if ($.browser.mozilla) {
		items = evt.dataTransfer.files;
		filesOnly = true;
	}

	numFilesRead = 0;
	numFiles = 0;
	fileData = [];

	for (var i = 0; i < items.length; i++) {
		var entry = items[i];
		if (filesOnly) {
			handleFile(entry, entry.name);
		} else {
			if (entry.getAsEntry){  //Standard HTML5 API
				entry = entry.getAsEntry();
			} else if (entry.webkitGetAsEntry){  //WebKit implementation of HTML5 API.
				entry = entry.webkitGetAsEntry();
			}
			if (entry.isFile){
				handleFile(evt.dataTransfer.files[i], "/" + entry.name);
			} else if (entry.isDirectory){
				var entries = [];
            	entries[0] = evt.dataTransfer.items[i].webkitGetAsEntry();
				readDirectory(entries);
			} else {
				alert("Error, unkown type given");
			}
		}
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

if ($.browser.webkit) {
	$('#drop_zone').html('Drop files and folders here');
}

//Setup the dnd listeners.
var dropZone = document.getElementById('container');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);
