///////////////////////////////////////////////////////////////////////////////
// Globals
///////////////////////////////////////////////////////////////////////////////
var data;
var file;
var reader;


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
	var displayableAscii = new Array(".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", ".", "!", "\"", "#", "$", "%", ".", "\'", "(", ")", "*", "+", ",", "-", ".", "\/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", ".", "=", ".", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_", ".", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", ".");
	if (val > 127) return '.';
	return displayableAscii[val];
}


///////////////////////////////////////////////////////////////////////////////
// File reading
///////////////////////////////////////////////////////////////////////////////
function handleFinishedRead(evt) {
	
	if(evt.target.readyState == FileReader.DONE) {
		
		var output = [""];
		data =  new Uint8Array(evt.target.result, 0, evt.target.result.byteLength);
		
		var address = [""];
		var hex = [""];
		var ascii = [""];
		
		var column = 0;
		for (var i = 0; i < data.length; i++) {
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
		
		SetParseTree();
	}
}


function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files; // FileList

	var output = [];
	file = files[0];  // File object
	log.info("Loading: "+escape(file.name));
	output.push('<strong>' + escape(file.name)+ '</strong> - ' + file.size + ' bytes');
	document.getElementById('subheader').innerHTML = output.join(); 
	
	output = [];
	output.push("<table border=0 cellpadding=0 cellspacing=0>\n");
	output.push("<tr><td width=650px>\n");
	output.push("<div id=\"byte_content\">&nbsp;</div>\n");
	output.push("<td id=\"value\">");
	output.push("</table>\n");
	output.push("<div id=\"parsetree\"></div>\n");
	document.getElementById('content').innerHTML = output.join("");

	reader = new FileReader();
	reader.onloadend = handleFinishedRead;
	
	readFileSlice(0, 16*100);
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
  document.getElementById('value').innerHTML = output.join("");  
}


///////////////////////////////////////////////////////////////////////////////
// Parse tree
///////////////////////////////////////////////////////////////////////////////

var expectedOffset = 0;
function node(label, size, offset) {
	offset = offset || expectedOffset;
	expectedOffset = offset + size;
	
	var dataValue = "";
	var maxDataDisplaySize = 4; 
	for(var i=0; i<size && i<maxDataDisplaySize; i++) {
		dataValue += convertToHex(data[offset+i]); 
	}
	if(size>maxDataDisplaySize) {
		dataValue +="...";
	}
	dataValue = addHexIdentifier(dataValue);
	
	return {label: label, offset: offset, size: size, data: dataValue};
}


function SetParseTree() {
	var e_lfanew = data[60]+data[61]*256;
	
	var treedata = [
        {
            label: 'IMAGE_DOS_HEADER', offset: 0, size: 64, 
            children: [
                node("WORD  e_magic;      /* MZ Header signature */", 2, 0),
                node("WORD  e_cblp;       /* Bytes on last page of file */", 2),
                node("WORD  e_cp;         /* Pages in file */", 2),
                node("WORD  e_crlc;       /* Relocations */", 2),
                node("WORD  e_cparhdr;    /* Size of header in paragraphs */", 2),
                node("WORD  e_minalloc;   /* Minimum extra paragraphs needed */", 2),
                node("WORD  e_maxalloc;   /* Maximum extra paragraphs needed */", 2),
                node("WORD  e_ss;         /* Initial (relative) SS value */", 2),
                node("WORD  e_sp;         /* Initial SP value */", 2),
                node("WORD  e_csum;       /* Checksum */", 2),
                node("WORD  e_ip;         /* Initial IP value */", 2),
                node("WORD  e_cs;         /* Initial (relative) CS value */", 2),
                node("WORD  e_lfarlc;     /* File address of relocation table */", 2),
                node("WORD  e_ovno;       /* Overlay number */", 2),
                node("WORD  e_res[4];     /* Reserved words */", 8),
                node("WORD  e_oemid;      /* OEM identifier (for e_oeminfo) */", 2),
                node("WORD  e_oeminfo;    /* OEM information; e_oemid specific */", 2),
                node("WORD  e_res2[10];   /* Reserved words */", 20),
                node("DWORD e_lfanew;     /* Offset to extended header */", 4),
            ]
        }, 
        { 
        	label: 'IMAGE_OPTIONAL_HEADER', offset: e_lfanew, size: 0xe0,
        	children: [
        	    node("WORD  Magic;", 2, e_lfanew),
        	    node("BYTE  MajorLinkerVersion;", 1),
            	node("BYTE  MinorLinkerVersion;", 1),
            	node("DWORD SizeOfCode;", 4),
            	node("DWORD SizeOfInitializedData;", 4),
            	node("DWORD SizeOfUninitializedData;", 4),
            	node("DWORD AddressOfEntryPoint;", 4),
            	node("DWORD BaseOfCode;", 4),
            	
            	node("DWORD ImageBase;", 4),
            	node("DWORD SectionAlignment;", 4),
            	node("DWORD FileAlignment;", 4),
            	node("WORD MajorOperatingSystemVersion;", 2),
            	node("WORD MinorOperatingSystemVersion;", 2),
            	node("WORD MajorImageVersion;", 2),
            	node("WORD MinorImageVersion;", 2),
            	node("WORD MajorSubsystemVersion;", 2),
            	node("WORD MinorSubsystemVersion;", 2),
            	node("DWORD Win32VersionValue;", 4),
            	node("DWORD SizeOfImage;", 4),
            	node("DWORD SizeOfHeaders;", 4),
            	node("DWORD CheckSum;", 4),
            	node("WORD Subsystem;", 2),
            	node("WORD DllCharacteristics;", 2),
            	
            	node("DWORD SizeOfStackReserve;", 4),
            	node("DWORD SizeOfStackCommit;", 4),
            	node("DWORD SizeOfHeapReserve;", 4),
            	node("DWORD SizeOfHeapCommit;", 4),
            	node("DWORD LoaderFlags;", 4),
            	node("DWORD NumberOfRvaAndSizes;", 4),
            	
        	    /* IMAGE_DATA_DIRECTORY DataDirectory[IMAGE_NUMBEROF_DIRECTORY_ENTRIES]; */
        	]
        }
    ];
		
	$('#parsetree').tree({
		data: treedata,
		autoOpen: true
	});
	
	$('#parsetree').bind(
	    'tree.click',
	    clickParseTreeNode
	);
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

