// Project TODO
// TODO: Use blackbird for logging: http://www.gscottolson.com/blackbirdjs/
// TODO: Use Sausage for infinite scrolling: http://christophercliff.github.com/sausage/
// TODO: Also http://imakewebthings.com/jquery-waypoints/
// TODO: Use Peg.js (http://pegjs.majda.cz/) or ometa for dsl parsing

// TODO: Add progress reporting and error handling from http://www.html5rocks.com/en/tutorials/file/dndfiles/#toc-monitoring-progress


var data;

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
		
		var output = [""];
		data =  new Uint8Array(evt.target.result, 0, evt.target.result.byteLength);
		
		var address = [""];
		var hex = [""];
		var ascii = [""];
		
		var column = 0;
		for (var i = 0; i < data.length; i++) {
			// Show address
			if (column == 0) {
				address.push(intToHex(i)+"h<br>\n");
			}
			// Show value
			hex.push("<i id=\"h"+i+"\" class=\"hex\">");
			hex.push(convertToHex((data[i]&0xf0)>>4));
			hex.push(convertToHex(data[i]&0x0f));
			hex.push("</i>");
			
			// Show ascii
			ascii.push("<i id=\"a"+i+"\" class=\"ascii\">");
			ascii.push(dispAscii(data[i]));
			ascii.push("</i>");
			
			// Add extra formatting
			column++;
			if (column % 16 == 0) {
				hex.push("<br>\n");
				ascii.push("<br>\n");
				column = 0;
			} else if (column % 8 == 0) {
			hex.push("<i class=\"hex\">&nbsp;</i>");
			}
			hex.push(" ");
		}
		
		output.push("<table border=0 cellpadding=0 cellspacing=0><tr>");
		output.push("<td class=\"bytes address\" style=\"padding: 0 10px 0 0;\">");
		output.push(address.join(""));
		output.push("<td class=\"bytes\" style=\"padding: 0 10px 0 0;\">");
		output.push(hex.join(""));
		output.push("<td class=\"bytes\">");
		output.push(ascii.join(""));
		
		output.push("</table>");
		document.getElementById('byte_content').innerHTML = output.join("");
		
		SetValueElement(0);
		
		$(".ascii").mouseover(mouseoverBytes).mouseout(mouseoutBytes);
		$(".hex").mouseover(mouseoverBytes).mouseout(mouseoutBytes);
		
		//$(".ascii").select(mouseoverBytes).mouseout(mouseoutBytes);
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
	
	output = [];
	output.push("<table border=0 cellpadding=0 cellspacing=0>\n");
	output.push("<tr><td width=650px>\n");
	output.push("<div id=\"byte_content\">&nbsp;</div>\n");
	output.push("<td id=\"value\">");
	output.push("</table>\n");
	document.getElementById('content').innerHTML = output.join("");

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



// Set mouse-over
function mouseoverBytes() {
	var currentId = this.id;
	var byte = currentId.substring(1, currentId.length); 
    $("#a"+byte).addClass( "hovered");
    $("#h"+byte).addClass( "hovered");
    
    SetValueElement(byte);
  }

function mouseoutBytes() {
	var currentId = this.id;
	var byte = currentId.substring(1, currentId.length); 
    $("#a"+byte).removeClass( "hovered");
    $("#h"+byte).removeClass( "hovered");
  };
  
function SetValueElement(byte) {
//Set value
  var output = [""];
  output.push("Offset: "+intToHex(parseInt(byte))+"h<br>");
  document.getElementById('value').innerHTML = output.join("");  
}
