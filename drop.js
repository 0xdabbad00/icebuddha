///////////////////////////////////////////////////////////////////////////////
// Globals
///////////////////////////////////////////////////////////////////////////////
var data;
var file;
var reader;

var NUM_BYTES_TO_LOAD = 16*100;
var lastBytesRead = 0;

var isValueElementSet = false;

var addressString = "";
var hexString = "";
var asciiString = "";


///////////////////////////////////////////////////////////////////////////////
// Utility functions
///////////////////////////////////////////////////////////////////////////////
function convertToHex(dec)
{
    var hexArray = new Array( "0", "1", "2", "3",
                              "4", "5", "6", "7",
                              "8", "9", "A", "B",
                              "C", "D", "E", "F" );
    var decToHex = hexArray[(dec&0xf0)>>4]+hexArray[(dec&0x0f)];
    return (decToHex);
}

function addHexIdentifier(value) {
	return value+"h";
}

function intToHex(val) {
	// Convert value to hex
	var str = ''+val.toString(16);
	// Pad with 0's
	while(str.length < 8) str = '0'+str;
	return addHexIdentifier(str);
}

function dispAscii(val) {
	var displayableAscii = new Array(
			".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", 
			".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", 
			".", "!", "\"", "#", "$", "%", ".", "\'", "(", ")", "*", "+", ",", "-", ".", "\/", 
			"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", ".", "=", ".", "?", 
			"@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", 
			"P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", 
			".", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", 
			"p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", ".");
	if (val > 127) return '.';
	return displayableAscii[val];
}


function str2ArrayBuffer(str) {
  var buf = new ArrayBuffer(str.length); 
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  var tmp = buf.byteLength;
  return bufView;
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
	for (var i = 0; i < length; i++) {
		data[start+i] = readBlock[i];
	}
	
	var address = [""];
	var hex = [""];
	var ascii = [""];
	
	var column = 0;
	for (var i = lastBytesRead; i < lastBytesRead + length; i++) {
		// Show address
		if (column == 0) {
			address.push(intToHex(i)+"<br>\n");
		}
		// Show value
		hex.push("<i id=\"h"+i+"\" class=\"hex\">");
		hex.push(convertToHex(data[i]));
		if (column % 16 != 0 && column % 8 == 0) {
		  hex.push("&nbsp;");
		}
		hex.push(" </i>");
		
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
		}
	}
	
	// TODO This is slow (the appending below), reason unknown
	
	
	log.info((new Date().getTime()) + " " + "Doing append");

	// Set html
	addressString += address.join("");
	hexString += hex.join("");
	asciiString += ascii.join("");
	
	
	$('#byte_content').html(getByteContentHTML(addressString, hexString, asciiString+"<footer>test</footer>"));
	
	// Add right-click menu
	$("#hexCell").contextMenu({
	      menu : 'hexCallbackMenu'
	});
	
	log.info((new Date().getTime()) + " " + "Done with append");
	
	lastBytesRead = lastBytesRead + length;
	
	// Set waypoint for infinite scrolling through file (until end of file)
	$footer = $('footer'),
	opts = {
		offset: '100%',
		context: '#byte_content'
	};
	
	$footer.waypoint(function(event, direction) {
		$footer.waypoint('remove');
		$footer.detach();
		
		readFileSlice(lastBytesRead, lastBytesRead+NUM_BYTES_TO_LOAD);
	}, opts);
	
	$(".ascii").mouseover(mouseoverBytes).mouseout(mouseoutBytes);
	$(".hex").mouseover(mouseoverBytes).mouseout(mouseoutBytes);
	$(".hex").mouseup(snapSelectionToWord);

	if (!isValueElementSet) {
		SetValueElement(0);
	}
	
	SetParseTree();
}

function snapSelectionToWord() {
	// Copied from http://jsfiddle.net/rrvw4/23/
    var sel;

    // Check for existence of window.getSelection() and that it has a
    // modify() method. IE 9 has both selection APIs but no modify() method.
    if (window.getSelection && (sel = window.getSelection()).modify) {
        sel = window.getSelection();
        if (!sel.isCollapsed) {

            // Detect if selection is backwards
            var range = document.createRange();
            range.setStart(sel.anchorNode, sel.anchorOffset);
            range.setEnd(sel.focusNode, sel.focusOffset);
            var backwards = range.collapsed;
            range.detach();

            // modify() works on the focus of the selection
            var endNode = sel.focusNode, endOffset = sel.focusOffset;
            sel.collapse(sel.anchorNode, sel.anchorOffset);
            
            var direction = [];
            if (backwards) {
                direction = ['backward', 'forward'];
            } else {
                direction = ['forward', 'backward'];
            }

            sel.modify("move", direction[0], "character");
            sel.modify("move", direction[1], "word");
            sel.extend(endNode, endOffset);
            sel.modify("extend", direction[1], "character");
            sel.modify("extend", direction[0], "word");
        }
    } else if ( (sel = document.selection) && sel.type != "Control") {
        var textRange = sel.createRange();
        if (textRange.text) {
            textRange.expand("word");
            // Move the end back to not include the word's trailing space(s),
            // if necessary
            while (/\s$/.test(textRange.text)) {
                textRange.moveEnd("character", -1);
            }
            textRange.select();
        }
    }
}

function getByteContentHTML(address, hex, ascii) {
	output = [];
	output.push("<table border=0 cellpadding=0 cellspacing=0><tr>");
	output.push("<td id=\"addressCell\" style=\"padding: 0 10px 0 0;\">");
	output.push(address);
	output.push("<td id=\"hexCell\" style=\"padding: 0 10px 0 0;\">");	
	output.push(hex);
	output.push("<td id=\"asciiCell\">");
	output.push(ascii);
	output.push("</table>");
	return output.join("");
}


function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files; // FileList

	file = files[0];  // File object
	log.info((new Date().getTime()) + " " + "Loading: "+escape(file.name));
	

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
	isValueElementSet = false;
	addressString = "";
	hexString = "";
	asciiString = "";
	
	// Set byte content
	output = [];
	output.push("<table border=0 cellpadding=0 cellspacing=0>\n");
	output.push(" <tr><td width=650px>\n");
	output.push(" <div id=\"byte_content\">");
	output.push(getByteContentHTML("", "", ""));
	output.push(" </div>\n");
	output.push(" <td id=\"value\">");
	output.push("</table>\n");
	output.push("<div id=\"parsetree\"></div>\n");

	// Right-click menu
	output.push(
			"<div id=\"hexCallbackMenu\">\n" + 
			"<ul>" +
			"<li id=\"Hash\"><a href=\"#Hash\">Hash</a></li>" +
			"<li id=\"Edit\"><a href=\"#Edit\">Edit</a></li>" +
			"<li id=\"Copy\"><a href=\"#Copy\">Copy</a>" +
			"<ul>" +
			"  <li id=\"Copy_bytes\"><a href=\"#Copy_bytes\">Copy bytes</a></li>" +
			"  <li id=\"Copy_hex\"><a href=\"#Copy_hex\">Copy hex</a></li>" +
			"</ul></li>" +
			"</ul>" +
			"</div>");
	
	
	$('#content').html(output.join(""));
	
	$('#byte_content').scrollTo(0);  // Start at top
	
	$addressCell = $('#addressCell');
	$hexCell = $('#hexCell');
	$asciiCell = $('#asciiCell')
}

function readFileSlice(start, end) {
	if (file == null) return;
	
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
// Mouse hovering
///////////////////////////////////////////////////////////////////////////////
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
  
function SetValueElement(offset) {
  var output = [""];
  var offsetInt = parseInt(offset);
  if (isNaN(offsetInt)) return;
  output.push("Offset "+intToHex(offsetInt)+"<br>");
  output.push("Data &nbsp;&nbsp;"+
		  addHexIdentifier(
		  convertToHex(data[offsetInt])+
		  convertToHex(data[offsetInt+1])+
		  convertToHex(data[offsetInt+2])+
		  convertToHex(data[offsetInt+3])
		  )+
		  "<br>");
  output.push("ubyte&nbsp;&nbsp;"+
		  data[offsetInt]+
		  "<br>");
  output.push("ushort "+(
		  ((data[offsetInt+1]<<8)>>>0) +
		  (data[offsetInt+0]) ) +
		  "<br>");
  output.push("uint &nbsp;&nbsp;"+(
		  ((data[offsetInt+3]<<24)>>>0) +
		  ((data[offsetInt+2]<<16)>>>0) +
		  ((data[offsetInt+1]<<8)>>>0) +
		  (data[offsetInt+0]) ) +
		  "<br>");
  $('#value').html(output.join(""));
  isValueElementSet = true;
}


///////////////////////////////////////////////////////////////////////////////
// Parse tree
///////////////////////////////////////////////////////////////////////////////
var expectedOffset = 0;
function node(label, size, name, offset) {
	offset = offset || expectedOffset;
	expectedOffset = offset + size;
	
	var dataValue = "";
	
	if (size==4) {
		dataValue = 
		  ((data[offset+3]<<24)>>>0) +
		  ((data[offset+2]<<16)>>>0) +
		  ((data[offset+1]<<8)>>>0) +
		  (data[offset+0]);
	} else if (size == 2) {
		dataValue = 
			  ((data[offset+1]<<8)>>>0) +
			  (data[offset+0]);
	} else if (size == 1) {
		dataValue = 
			  (data[offset+0]);
	} else {
		dataValue = 0;
	}
	
	var maxDataDisplaySize = 4;
	var hexData="";
	if(size>maxDataDisplaySize) {
		hexData = "...";
	} else if (size == 0) {
		hexData = "";
	} else {
		for(var i=0; i<size && i<maxDataDisplaySize; i++) {
			hexData += convertToHex(data[offset+i]); 
		}
		hexData = addHexIdentifier(hexData);
	}
	
	return {label: label, offset: offset, size: size, data: dataValue, hexData: hexData, varName: name};
}


function getStructSize(children) {
	var size = 0;
	for(i in children) {
	  	size += children[i].size;
	}
	return size;
}

var parser;
var treedata = [];

function parseStruct(offset, structText) {
	expectedOffset = offset;
	var parseData = parser.parse(structText);
	
	var struct = parseData;
	var treeDataStruct = { label: struct.label, offset: offset, size: getStructSize(struct.children), children:[]};
	for (i in struct.children) {
		var child = struct.children[i];
		treeDataStruct.children.push(node(child.text, child.size, child.varName));
	}
	
	treedata.push(treeDataStruct);

	return treeDataStruct;
}

function getStructValue(struct, varName) {
	for (i in struct.children) {
		var child = struct.children[i];
		if (child.varName == varName) {
			return child.data;
		}
	}
  return 0;
}

function SetParseTree() {
	var parseGrammer = "";
	var parseInput = "";
	
	treedata = [];
	
	$.get("parseGrammer.txt", function(response) {
		parseGrammer = response;
		parser = PEG.buildParser(parseGrammer, trackLineAndColumn=true);
		
		$.get("parseFile_pe.txt", function(response) {
			parseInput = response;
			// Javascript does not allow multi-line strings, so to allow this, I turn my entire javascript parse files into single lines.  Hack, but better than ugly js.
			parseInput = parseInput.replace(/(\r\n|\n|\r)/gm," ");
			// Also, I need to make all the "typedef struct"'s into string's 
			parseInput = parseInput.replace(/typedef struct ([A-Za-z0-9_]+) {/g,  "var $1 =  \"typedef struct $1 {");
			parseInput = parseInput.replace(/(} [A-Za-z0-9_]+, \*P[A-Za-z0-9_]+;)/g,  "$1\";");
			
			try {
				
				var parseFunc = new Function(parseInput);
				parseFunc();
							
				$('#parsetree').tree({
					data: treedata,
					autoOpen: false
				});
				
				$('#parsetree').bind(
				    'tree.click',
				    clickParseTreeNode
				);
				
			} catch (e) {
				$('#parsetree').html("Parsing failed; "+e);
			}
		});
		
	});
	
	return;	
}

function clickParseTreeNode(event) {
    var node = event.node;
    
    // High-lite byte data
    // Unset old
    for(var i=selectStart; i<selectEnd; i++) {
      $("#a"+i).removeClass( "selected");
      $("#h"+i).removeClass( "selected");
    }
    
    // Set new
    selectStart = node.offset;
    selectEnd = node.offset + node.size;
    for(var i=selectStart; i<selectEnd; i++) {
      $("#a"+i).addClass( "selected");
      $("#h"+i).addClass( "selected");
    }
    
    SetValueElement(selectStart);
    
    // Scroll to element
    $('#byte_content').scrollTo($("#h"+selectStart), 800);
    
    // High-lite parse tree
    // Unset old
    if (selectedNode != null) {
      selectedNode.removeClass("selected");
    }
    // Set new
    selectedNode = event.target;
    if (selectedNode.hasClass("parseTreeData")) {
    	selectedNode = selectedNode.parent();
    }
    selectedNode.addClass("selected");
}

/////////////////////////////////////////////////////////////////////////////
function $_GET(q,s) {
    s = s ? s : window.location.search;
    var re = new RegExp('&'+q+'(?:=([^&]*))?(?=&|$)','i');
    return (s=s.replace(/^\?/,'&').match(re)) ? (typeof s[1] == 'undefined' ? '' : decodeURIComponent(s[1])) : undefined;
} 

///////////////////////////////////////////////////////////////////////////////
// Main
///////////////////////////////////////////////////////////////////////////////
var selectStart = 0;
var selectEnd = 0;
var selectedNode = null;

//Setup the dnd listeners.
var dropZone = document.getElementById('container');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);


if ($_GET('test')) {
	var filename = $_GET('test');
	filename = "putty.exe";  // TODO force only putty to be loaded for now
	
	$.get(filename, function(response) {
		readBlock =  str2ArrayBuffer(response);
		var length = readBlock.byteLength;
		data = new Uint8Array(length);
		createTemplate(filename, length);
		doRead(readBlock, length);
	});
	
}
