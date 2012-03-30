// Project TODO
// TODO: Use blackbird for logging: http://www.gscottolson.com/blackbirdjs/
// TODO: Use Sausage for infinite scrolling: http://christophercliff.github.com/sausage/
// TODO: Also http://imakewebthings.com/jquery-waypoints/
// TODO: Use Peg.js (http://pegjs.majda.cz/) or ometa for dsl parsing

// TODO: Add progress reporting and error handling from http://www.html5rocks.com/en/tutorials/file/dndfiles/#toc-monitoring-progress


function convertToHex(dec)
{
    var hexArray = new Array( "0", "1", "2", "3",
                              "4", "5", "6", "7",
                              "8", "9", "A", "B",
                              "C", "D", "E", "F" );
    var decToHex = hexArray[dec];
    return (decToHex);
}

function intToHex(val) {
	// Convert value to hex
	var str = ''+val.toString(16);
	// Pad with 0's
	while(str.length < 8) str = '0'+str;
	return str;
}

function dispAscii(val) {
	var displayableAscii = new Array(".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "!", "\"", "#", "$", "%", ".", "\'", "(", ")", "*", "+", ",", "-", ".", "\/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", ".", "=", ".", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", ".", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", ".");
	if (val > 127) return '.';
	return displayableAscii[val];
}



function handleFinishedRead(evt) {
	
	if(evt.target.readyState == FileReader.DONE) {// DONE == 2
		
		var output = ["<div id='byte_content'>"];
		var data =  new Uint8Array(evt.target.result, 0, evt.target.result.byteLength);
		
		var address = [""];
		var hex = [""];
		var ascii = [""];
		
		var column = 0;
		for (var i = 0; i < data.length; i++) {
			// Show address
			if (column == 0) {
				address.push("0x"+intToHex(i)+"<br>\n");
			}
			// Show value
			hex.push(convertToHex((data[i]&0xf0)>>4));
			hex.push(convertToHex(data[i]&0x0f));
			
			// Add extra formatting
			column++;
			if (column % 16 == 0) {
				hex.push("<br>\n");
				// Show ASCII
				for (j = i - 15; j <= i; j++) {
					ascii.push(dispAscii(data[j]));
				}
				ascii.push("<br>\n");
				column = 0;
			} else if (column % 8 == 0) {
				hex.push("&nbsp;");
			}
			hex.push(" ");
		}
		
		if (i % 16 != 0) {
			// Pad to ascii
			for (j = i%16; j < 16; j++) {
				//output.push("&nbsp;&nbsp;&nbsp;");
				hex.push("&nbsp;&nbsp;&nbsp;");
				if (j % 8  == 0 && (i%16 != 8)) {
					hex.push("&nbsp;");
				}
			}
			
			// Disp remaining ascii
			ascii.push("&nbsp;<i class=ascii>");
			for (j = i - (i%16); j <= i; j++) {
				ascii.push(dispAscii(data[j]));
				
			}
			ascii.push("</i>");
		}
		
		output.push("<table border=0 cellpadding=0 cellspacing=0><tr>");
		output.push("<td class=\"address\" style=\"padding: 0 10px 0 0;\">");
		output.push(address.join(""));
		output.push("<td class=\"hex\" style=\"padding: 0 10px 0 0;\">");
		output.push(hex.join(""));
		output.push("<td class=\"ascii\">");
		output.push(ascii.join(""));
		
		output.push("</table>");
		output.push("</div>");
		document.getElementById('content').innerHTML = output.join("");
		
	}
}


function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files; // FileList

	var output = [];
	var file = files[0];  // File object
	log.info("Loading: "+escape(file.name));
	output.push('<strong>' + escape(file.name)+ '</strong> - ' + file.size + ' bytes');
	document.getElementById('subheader').innerHTML = output.join(); 

	var reader = new FileReader();
	reader.onloadend = handleFinishedRead;
	
	// Determine how much to read
	var start = 0;
	var end = 16*100;
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
	// Explicitly show this is a copy.
}

// Setup the dnd listeners.
var dropZone = document.getElementById('container');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);
