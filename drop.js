///////////////////////////////////////////////////////////////////////////////
// Globals
///////////////////////////////////////////////////////////////////////////////
var data;
var file;
var reader;

var MAX_FILE_SIZE = 10*1024*1024; // 10MB

var LINES_TO_DISPLAY = 100;
var FONT_HEIGHT = 15;
var BYTES_PER_LINE = 16;
var NUM_BYTES_PER_DISPLAY = BYTES_PER_LINE * LINES_TO_DISPLAY;

var isValueElementSet = false;

var addressString = "";
var hexString = "";
var asciiString = "";

var clickedNode;

var selectData = [];
var selectedNodes = [];

var selectStart = 0;
var selectEnd = 0;
var selectedNode = null;

var hexDumpStart;
var hexDumpEnd;

var editor;
var parser;
var treedata = [];
var expectedOffset = 0; // for parse tree

var lastHexDumpPosition = 0;

var gotoLocation = 0;
var scrollNeeded = false;

///////////////////////////////////////////////////////////////////////////////
// Utility functions
///////////////////////////////////////////////////////////////////////////////

var hexArray = new Array( "0", "1", "2", "3",
        "4", "5", "6", "7",
        "8", "9", "A", "B",
        "C", "D", "E", "F" );

var displayableAscii = new Array(
		".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", 
		".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", 
		"&nbsp;", "!", "\"", "#", "$", "%", "&amp;", "\'", "(", ")", "*", "+", ",", "-", ".", "\/", 
		"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "&lt;", "=", "&gt;", "?", 
		"@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", 
		"P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "&#92;", "]", "^", "_", 
		".", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", 
		"p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", ".");


function convertToHex(dec)
{
    var decToHex = hexArray[(dec&0xf0)>>4]+hexArray[(dec&0x0f)];
    return (decToHex);
}

function convertToHexWord(dec)
{
    var decToHex =
    	hexArray[(dec&0xf0000000)>>0x1c]+hexArray[(dec&0x0f000000)>>0x18] +
    	hexArray[(dec&0x00f00000)>>0x14]+hexArray[(dec&0x000f0000)>>0x0f] +
    	hexArray[(dec&0x0000f000)>>0x0c]+hexArray[(dec&0x00000f00)>>0x08] +
    	hexArray[(dec&0x000000f0)>>0x04]+hexArray[(dec&0x0000000f)>>0x00];
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

function hexToInt(str) {
	str = str.replace('h', '');
	return parseInt(str, 16);
}

function dispAscii(val) {
	if (val > 127) return '.';
	return displayableAscii[val];
}

function isDisplayable(val) {
	if (val > 127) return false;
	if (val == 0x2e) return true; // real period
	if (displayableAscii[val] == '.') return false;
	return true;
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

function showError(str) {
	$(function() {
		$( "#dialog-message" ).html("<span class=\"ui-icon ui-icon-alert\" style=\"float: left; margin: 0 7px 50px 0;\"></span>"+str);
		
        $( "#dialog-message" ).dialog({
        	title: "Error",
            modal: true,
            disabled: false,

            buttons: {
                Ok: function() {
                    $( this ).dialog( "close" );
                }
            }
        });

        $( "#dialog-message" ).dialog( "enable" );
    });
}

///////////////////////////////////////////////////////////////////////////////
// Strings view
///////////////////////////////////////////////////////////////////////////////
function SetStrings() {
	var stringsData = [];
	var str = [];
	var minLength = 4;
	var startOffset = 0;
	var isUnicode = false;

	// TODO make sure this can handle unicode
	// check 41 00 41 42 43 44 00 -> ABCD
	for (var i=0; i<data.length; i++) {
		if (isUnicode && data[i]==0 && i-startOffset%2==1) {
			// no op
		} else if (isDisplayable(data[i])) {
			str.push(dispAscii(data[i]));
		} else if (data[i]==0 && i-startOffset==1) {
			isUnicode=true;
		} else {
			if (str.length >= minLength) {
				var uOrA = "A";
				if (isUnicode) uOrA = "U";
				stringsData.push("<a class=\"stringFound\" href=\"#"+intToHex(startOffset)+"\">"+intToHex(startOffset)+" "+uOrA+" "+str.join("")+"</a><br>");
			}
			str = [];
			startOffset = i+1;
			isUnicode=false;
		}
	}

	$('#strings').html(stringsData.join(""));

	$('.stringFound').click(function(e) {
		e.preventDefault();
		$("#accordion").accordion("activate", 0 );
		gotoLocation = this.href.split('#')[1].replace('h', '');
		gotoLocation = hexToInt(gotoLocation);
  		scrollToByte(gotoLocation);
  		return false;
	});
}


///////////////////////////////////////////////////////////////////////////////
// File reading
///////////////////////////////////////////////////////////////////////////////
function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files; // FileList

	file = files[0];  // File object

	if (file.size > MAX_FILE_SIZE) {
		showError("File is too large.<br>IceBuddha currently only accepts files under 10MB.");
		return;
	}

	// Create array to hold all data in the file.  The file data will be read in as chunks as needed.
	data = new Uint8Array(file.size);
	
	createTemplate(file.name, file.size);

	reader = new FileReader();
	reader.onloadend = handleFinishedRead;
	
	readFileSlice(0, MAX_FILE_SIZE);
}

function handleDragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy';
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

function handleFinishedRead(evt) {
	if(evt.target.readyState == FileReader.DONE) {
		var length = evt.target.result.byteLength;
		data =  new Uint8Array(evt.target.result, 0, length);
		displayHexDump(0);
		SetParseTree();
		SetStrings();
	}
}


function displayHexDump(position) {
	lastHexDumpPosition = position;
	var output = [""];
	
	var address = [""];
	var hex = [""];
	var ascii = [""];

	length = NUM_BYTES_PER_DISPLAY;
	if (position + length > data.length) { length = data.length - position; }

	bytesAbove = position;
	if (bytesAbove > NUM_BYTES_PER_DISPLAY * .25) { bytesAbove = NUM_BYTES_PER_DISPLAY * .25; }

	hexDumpStart = position - bytesAbove;
	hexDumpEnd = position + length;
	
	var column = 0;
	for (var i = hexDumpStart; i < hexDumpEnd; i++) {
		// Show address
		if (column == 0) {
			address.push(intToHex(i));
			address.push("<br>\n");
		}
		// Show value
		hex.push("<i id=\"h");
		hex.push(i);
		hex.push("\" class=\"hex\">");
	
		hex.push(hexArray[(data[i]&0xf0)>>4]);
		hex.push(hexArray[(data[i]&0x0f)]);
		
		if (column % 16 != 0 && column % 8 == 0) {
		  hex.push("&nbsp;");
		}
		hex.push(" </i>");
		
		// Show ascii
		ascii.push("<i id=\"a");
		ascii.push(i);
		ascii.push("\" class=\"ascii\">");
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

	// Set html
	addressString = address.join("");
	hexString = hex.join("");
	asciiString = ascii.join("");

	footer = "";
	if (position + NUM_BYTES_PER_DISPLAY < data.length) {
		footer = "<footer>Loading more data...</footer>";
	}

	
	$('#byte_content').html(getByteContentHTML(addressString, hexString + footer, asciiString, position-bytesAbove));
	
	// Add right-click menu
	$("#hexCell").contextMenu({
	      menu : 'hexContextMenu',
	      onSelect: function(e) {
	      	hexId = e.target.closest('#hexCell i.hex').attr('id');
	      	alert("The item's action is: " + e.action + "\nTarget:"+hexId);
	      }
	});

	$('#byte_content').unbind('scroll', outOfRangeScrollHandler);

	// On refresh, scroll to the correct place
	$('#byte_content').scrollTo($("#h"+position), 1, {onAfter:function(){
		//
		// After getting to the location, set events to cause data refreshes on scrolls
		//

		// Scroll up
		if (position - NUM_BYTES_PER_DISPLAY*.25 > 0) {
			scrollPointOffsetUp = position-NUM_BYTES_PER_DISPLAY*.25;
			$scrollPointUp = $('#h'+scrollPointOffsetUp);

			opts = {
				offset: 0,
				context: '#byte_content'
			};
			
			$scrollPointUp.waypoint(function(event, direction) {
				if (direction === 'up') {
					if (mouseIsDown) return;
					// Upwards scroll event triggered
					$scrollPointUp.waypoint('destroy');
					$scrollPointUp.detach();
					
					displayHexDump(scrollPointOffsetUp);
				}
			}, opts);
		}


		// Scroll down
		if (position + NUM_BYTES_PER_DISPLAY*.75 < data.length) {
			scrollPointOffsetDown = position+(NUM_BYTES_PER_DISPLAY*.75);
			$scrollPointDown = $('#h'+scrollPointOffsetDown);

			opts = {
				offset: '100%',
				context: '#byte_content'
			};
			
			$scrollPointDown.waypoint(function(event, direction) {
				if (direction === 'down') {
					if (mouseIsDown) return;
					// Downward scroll event triggered
					$scrollPointDown.waypoint('destroy');
					$scrollPointDown.detach();
					
					displayHexDump(scrollPointOffsetDown);
				}
			}, opts);
		}

		// If the user grabs the scroll bar, make sure refresh the screen
	    $('#byte_content').bind('scroll', outOfRangeScrollHandler);
	}});
	
	$("#asciiCell").mouseover(mouseoverBytes).mouseout(mouseoutBytes);
	$("#hexCell").mouseover(mouseoverBytes).mouseout(mouseoutBytes);
	$("#hexCell").mouseup(snapSelectionToWord);
	$("#addressCell").mouseup(snapSelectionToWord);

	if (!isValueElementSet) {
		SetValueElement(0);
	}

	reHighlite();
}

var outOfRangeScrollHandler = function() {
	scrollPos = $('#byte_content').scrollTop();
	topOfContent = $('#byteFillerAbove').height();
	contentHeight = FONT_HEIGHT * LINES_TO_DISPLAY;

	if ((scrollPos < topOfContent - (FONT_HEIGHT * 1)) || 
		(scrollPos > (topOfContent+contentHeight) + (FONT_HEIGHT * 1))) {
		scrollLocation = (scrollPos / FONT_HEIGHT) * BYTES_PER_LINE;

		if (mouseIsDown) {
			// Wait for the scroll to finish
			scrollNeeded = true;
			return;
		}
		scrollToByte(scrollLocation);
	}
};

var mouseIsDown = false;
$(document).mousedown(function() { mouseIsDown = true; });
$(document).mouseup(function() { 
	mouseIsDown = false; 
	if (scrollNeeded) {
		outOfRangeScrollHandler();
	}
});




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

function getByteContentHTML(address, hex, ascii, start) {
	output = [];
	if (!data) return;

	// Calculate size of the scroll view and any filling that should be added before the hexdump
	// for smoother looking auto-scrolling
	tableHeight = data.length/BYTES_PER_LINE * FONT_HEIGHT;
	preHeight = start/BYTES_PER_LINE * FONT_HEIGHT;

	tableHeightStyle = "style=\"min-height:"+tableHeight+"px; height:"+tableHeight+"px; border-spacing: 0px;\"";
	preHeightStyle = "style=\"min-height:"+preHeight+"px; height:"+preHeight+"px;\"";
	
	output.push("<table border=0 cellpadding=0 cellspacing=0 "+tableHeightStyle+" id=\"byteScrollableArea\">");
	output.push("<tr "+preHeightStyle+"><td "+preHeightStyle+" id=\"byteFillerAbove\"><td><td></tr>");
	output.push("<tr>");
	output.push("<td id=\"addressCell\" style=\"padding: 0 10px 0 0;\">");
	output.push(address);
	output.push("</td><td id=\"hexCell\" style=\"padding: 0 10px 0 0;\">");	
	output.push(hex);
	output.push("</td><td id=\"asciiCell\">");
	output.push(ascii);
	output.push("</td></tr></table>");
	ret =  output.join("");
	return ret;
}

function createTemplate(fileName, fileSize) {
	var output = [];
	
	// Set defaults for new file read
	isValueElementSet = false;
	addressString = "";
	hexString = "";
	asciiString = "";
	
	// Set byte content
	output = [];
	output.push("<div id=\"accordion\">");
	output.push("<h3><strong>" + escape(fileName)+ "</strong> - " + fileSize + " bytes</h3>");
	output.push("<div id=\"fileParsing\">");
	output.push("<table border=0 cellpadding=0 cellspacing=0>\n");
	output.push(" <tr><td width=650px>\n");
	output.push(" <div id=\"byte_content\">");
	output.push(getByteContentHTML("", "", "", 0));
	output.push(" </div>\n");
	output.push(" <td style=\"height:100%\"><table border=0 cellpadding=0 cellspacing=0 style=\"height:208\">\n");
	output.push("   <tr><td id=\"value\">");
	output.push("   <tr><td id=\"goto\">Go to<br><input id=\"gotoInput\" value=\"0000000h\"></td>");
	output.push("</table></table>\n");
	output.push("<div id=\"parseTreeEnvelope\"><div id=\"parsetree\"></div></div>\n");
	output.push("</div>");
	output.push("<h3>Parse as: EXE</h3>");
	output.push("<div id=\"editor\"></div>");
	output.push("<h3>Strings</h3>");
	output.push("<div id=\"strings\"></div>");
	output.push("</div>");

	// Right-click menu
	output.push(
			"<div id=\"hexContextMenu\" style=\"display: none;\">\n" + 
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
	
	output.push(
			"<div id=\"parseTreeContextMenu\" style=\"display: none;\">\n" + 
			"<ul>" +
			"<li id=\"Colorize\"><a href=\"#Colorize\">Colorize</a></li>" +
			"</ul>" +
			"</div>");
	
	$('#content').html(output.join(""));

	$( "#accordion" ).accordion({ 
		clearStyle: true,
		autoHeight: false,
		beforeActivate: function(event, ui) {
        	if (ui.newHeader[0].id == 'ui-accordion-accordion-header-0') {
        		// If we are showing the hexdump view, recreate it before it is displayed
        		ParseInstructions(editor.getSession().getValue());
        	}
    	},
    	activate : function(event, ui) {
        	if (ui.newHeader[0].id == 'ui-accordion-accordion-header-1') {
        		// If we are showing the ACE editor, tell it to refresh after the accordion
        		// expands
        		editor.renderer.onResize(true); 
        		editor.renderer.updateFull(force=true);
        	}
    	},
	});

	// Goto input
	$('#gotoInput').keypress(function(e)
    {
        var code= (e.keyCode ? e.keyCode : e.which);

        // Remove the error styling on any typing
        $('#gotoInput').removeClass("InputError");

        if (code == 13) {
        	try {
	        	var input = $('#gotoInput').val();

	        	// Convert to javascript
	        	input = input.replace(/([0-9a-zA-Z]+)h/g, "0x$1");
	        	input = "gotoLocation="+input;

	        	// Eval it
	        	var gotoFunc = new Function(input);
				gotoFunc();

				if (gotoLocation < 0) gotoLocation = data.length + gotoLocation;

	        	scrollToByte(gotoLocation);
	        	SetValueElement(gotoLocation);
	        	$('#h'+gotoLocation).selText();
	        	e.preventDefault();
        	} catch (e) {
				$('#gotoInput').addClass("InputError");
			}
        }
    });
	
	$('#byte_content').scrollTo(0);  // Start at top
	
	$addressCell = $('#addressCell');
	$hexCell = $('#hexCell');
	$asciiCell = $('#asciiCell')
}



///////////////////////////////////////////////////////////////////////////////
// Mouse hovering
///////////////////////////////////////////////////////////////////////////////
function mouseoverBytes(e) {
	var currentId = e.target.id;
	if (currentId == "hexCell" || currentId == "asciiCell") {
		return;
	}
	
	var byte = currentId.substring(1, currentId.length);	
    $("#a"+byte).addClass( "hovered");
    $("#h"+byte).addClass( "hovered");
    
    SetValueElement(byte);
  }

function mouseoutBytes(e) {
	var currentId = e.target.id;
	if (currentId == "hexCell" || currentId == "asciiCell") {
		return;
	}
	
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
function node(label, size, name, comment, offset) {
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
		hexData = "...["+size+"]";
	} else if (size == 0) {
		hexData = "";
	} else {
		for(var i=0; i<size && i<maxDataDisplaySize; i++) {
			hexData += convertToHex(data[offset+i]) + " "; 
		}
	}
	
	// Make hexData specific length
	var fillNeeded = maxDataDisplaySize*3+1 - hexData.length;
	for(var i=0; i<fillNeeded; i++) {
		hexData+="&nbsp;";
	}
	
	commentString = "";
	if (comment) {
		commentString = "&nbsp;&nbsp;; "+comment;
	}
	
	
	return {label: label, offset: offset, size: size, data: dataValue, hexData: hexData, varName: name, comment: commentString};
}

function getStructSize(children) {
	var size = 0;
	for(i in children) {
	  	size += children[i].size;
	}
	return size;
}

function sizeof(struct) { return struct.size; }

function after(struct) { return struct.offset + sizeof(struct); }

function parseStruct(offset, structText) {
	expectedOffset = offset;
	var parseData = parser.parse(structText);
	
	var struct = parseData;
	var treeDataStruct = { label: struct.label, offset: offset, size: getStructSize(struct.children), children:[]};
	for (i in struct.children) {
		var child = struct.children[i];
		treeDataStruct.children.push(node(child.text, child.size, child.varName, child.description));
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

function ParseInstructions(parseInstructions) {
	treedata = [];

	// Javascript does not allow multi-line strings, so to allow this, I turn my entire javascript parse files into single lines.  Hack, but better than ugly js.
	parseInstructions = parseInstructions.replace(/(\r\n|\n|\r)/gm," ");
	// Also, I need to make all the "typedef struct"'s into string's 
	parseInstructions = parseInstructions.replace(/typedef struct ([A-Za-z0-9_]+) {/g,  "var $1 =  \"typedef struct $1 {");
	parseInstructions = parseInstructions.replace(/(} [A-Za-z0-9_]+, \*P[A-Za-z0-9_]+;)/g,  "$1\";");
	
	try {
		$('#parsetree').remove(); // Remove old parse tree
		$('#parseTreeEnvelope').html('<div id=\"parsetree\"></div>');
		
		var parseFunc = new Function(parseInstructions);
		parseFunc();
					
		$('#parsetree').tree({
			data: treedata,
			autoOpen: false
		});
		
		$('#parsetree').bind(
		    'tree.click',
		    clickParseTreeNode
		);

		// Add right-click menu
		$('#parsetree').bind(
		    'tree.contextmenu',
		    function(event) {
		        clickedNode = event.node;
		    }
		);

		 $("#parsetree").contextMenu({
		 	menu : 'parseTreeContextMenu',
		 	onSelect: function(e) {
		 		if (clickedNode.children.length == 0) {
		 			// If you click on a child node, then ensure we focus on the parent
		 			clickedNode = clickedNode.parent;
		 		}
		 		if (e.action == 'Colorize') {
		 			colorize(clickedNode);
		 		}
		 	}
		});
	} catch (e) {
		$('#parsetree').html("Parsing failed; "+e);
	}    
}

function SetParseTree() {
	var parseGrammar = "";
	var parseInput = "";
	
	cacheBreaker = "?"+new Date().getTime();
	
	$.get("parseGrammar.txt"+cacheBreaker, function(response) {
		parseGrammar = response;
		parser = PEG.buildParser(parseGrammar, options={trackLineAndColumn:true});
		
		$.get("parseFile_pe.txt"+cacheBreaker, function(response) {
			parseInput = response;

			// Set up ace editor
			$("#editor").html(parseInput);
		    editor = ace.edit("editor");
    		editor.getSession().setMode("ace/mode/javascript");
		    editor.setTheme("ace/theme/chrome");
		    editor.session.setUseWorker(false);
		    editor.setShowFoldWidgets(false);

		    // Create parse tree
		    ParseInstructions(parseInput);
		});
		
	});
	
	return;	
}

jQuery.fn.selText = function() {
    var obj = this[0];
    if ($.browser.msie) {
        var range = obj.offsetParent.createTextRange();
        range.moveToElementText(obj);
        range.select();
    } else if ($.browser.mozilla || $.browser.opera) {
        var selection = obj.ownerDocument.defaultView.getSelection();
        var range = obj.ownerDocument.createRange();
        range.selectNodeContents(obj);
        selection.removeAllRanges();
        selection.addRange(range);
    } else if ($.browser.safari) {
        var selection = obj.ownerDocument.defaultView.getSelection();
        selection.setBaseAndExtent(obj, 0, obj, 1);
    }
    return this;
}

function pickHighliteColor() {
	colors = ['#f99', '#00ff40', '#2E9AFE', '#F7D358', '#F781F3', '#58FAF4', '#DA81F5', '#F79F81', '#81F781', '#F6CEEC', '#A9E2F3', '#F5A9E1', '#F5D0A9', '#CEF6CE'];
	return colors[selectData.length%colors.length];
}

function reHighlite() {
	for (var selection=0; selection<selectData.length; selection++) {
	    for(var i=selectData[selection].start; i<selectData[selection].end; i++) {
	    	$("#a"+i).css("background", selectData[selection].color);
	    	$("#h"+i).css("background", selectData[selection].color);
	    }
	}
}

function highlite(start, end, node, color) {
	color = typeof color !== 'undefined' ? color : pickHighliteColor();
	for(var i=start; i<end; i++) {
      $("#a"+i).css("background", color);
      $("#h"+i).css("background", color);
    }
    node.style.background = color;
    selectData.push({start: start, end: end, color: color, node: node});
}

function unhighlite() {
	for (var selection=0; selection<selectData.length; selection++) {
	    for(var i=selectData[selection].start; i<selectData[selection].end; i++) {
	    	$("#a"+i).css("background", "");
	    	$("#h"+i).css("background", "");
	    }
      	selectData[selection].node.style.background = "";
	}
	selectData = [];
}

function colorize(node) {
	// High-lite byte data
    unhighlite();

	selectStart = node.offset;
    selectedNode = node;
	for (var i = 0; i<node.children.length; i++) {
		var child = node.children[i];
		//child.element.style.background = pickHighliteColor();
		highlite(child.offset, child.offset + child.size, child.element);
	}
    
    SetValueElement(selectStart);
    
    // Scroll to element
    scrollToByte(selectStart);
}

function scrollToByte(start) {
	scrollNeeded = false;
	if (hexDumpStart > start || hexDumpEnd < start) {
		displayHexDump(start - start % BYTES_PER_LINE);
	} else {
		var location = $("#h"+start);
		if (location.length <= 0) {
			// Location does not actually exist: race condition seen sometimes, so just return
			return;
		}
		$('#byte_content').scrollTo(location, 800);
	}
}

function clickParseTreeNode(event) {
    var node = event.node;
    
    // High-lite byte data
    unhighlite();
    
    // Set new
    selectStart = node.offset;
    selectedNode = event.target;
    if (selectedNode.hasClass("parseTreeData")) {
    	selectedNode = selectedNode.parent();
    }
    //selectedNode.css("background", pickHighliteColor());
    highlite(selectStart, selectStart + node.size, selectedNode[0]);
    
    SetValueElement(selectStart);
    
    // Scroll to element
    scrollToByte(selectStart);
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

// Handler for when the page has loaded
$( "#dialog-message" ).dialog({ autoOpen: false });
$( "#dialog-message" ).dialog( "option", "disabled", true );

//Setup the dnd listeners.
var dropZone = document.getElementById('container');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);


if ($_GET('test')) {
	var filename = $_GET('test');
	filename = "putty.exe";
	
	$.get(filename, function(response) {
		data =  str2ArrayBuffer(response);
		var length = data.byteLength;
		createTemplate(filename, length);
		displayHexDump(0);
		SetParseTree();
		SetStrings();
	});
	
}

