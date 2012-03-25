// TODO: Add progress reporting and error handling from http://www.html5rocks.com/en/tutorials/file/dndfiles/#toc-monitoring-progress


function hex(dec)
{
    var hexArray = new Array( "0", "1", "2", "3", 
                              "4", "5", "6", "7",
                              "8", "9", "A", "B", 
                              "C", "D", "E", "F" );
    var decToHex = hexArray[dec];
    return (decToHex);
    
}

function handleFinishedRead(evt) {
	if(evt.target.readyState == FileReader.DONE) {// DONE == 2
		var output = ["<div id='byte_content'>"];
		var data =  Int8Array(evt.target.result, 0, evt.target.result.byteLength);
		for (var i = 0; i < data.length && i < 100; i++) {
			output.push(hex((data[i]&0xf0)>>4));
			output.push(hex(data[i]&0x0f));
			output.push(" ");
		}
		output.push("</div>")
		document.getElementById('content').innerHTML = output.join("");
	}
}


function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files; // FileList

	var output = [];
	var file = files[0];  // File object
	output.push('<strong>' + escape(file.name)+ '</strong> - ' + file.size + ' bytes');
	document.getElementById('subheader').innerHTML = output.join(); 

	var reader = new FileReader();
	reader.onloadend = handleFinishedRead;
	
	var start = 0;
	var end = 10000;
	if(file.webkitSlice) {
		var blob = file.webkitSlice(start, end + 1);
	} else if(file.mozSlice) {
		var blob = file.mozSlice(start, end + 1);
	}
	
	reader.readAsArrayBuffer(blob);
}

function handleDragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy';
	// Explicitly show this is a copy.
}

// Setup the dnd listeners.
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);
