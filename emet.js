// http://www.shamasis.net/2009/09/fast-algorithm-to-find-unique-items-in-javascript-array/
Array.prototype.unique = function() {
	var o = {}, i, l = this.length, r = [];
	for(i=0; i<l;i+=1) o[this[i]] = this[i];
	for(i in o) r.push(o[i]);
		return r;
};



$('#convert').click(function() {
	input = $('#input').val();
	input = input.split("\n");
	input = input.sort();
	input = input.unique();

	output = [];
	output.push("<EMET_Apps Version=\"3.5.0.0\">");

	for (var i = 0; i < input.length; i++) {
		// Trim
		str = input[i].replace(/^\s+|\s+$/g, '');
  		if (str == '') continue; // Ignore whitespace
  		if (str == 'ExecutablePath') continue; // Ignore header

  		// Sanity check
  		if (!str.match(/\\/)) {
  			$('#output').val("ERROR: Sanity check failure: Line does not have backslash\n"+str);
  			return;
  		}

  		path = str.substring(0, str.lastIndexOf('\\'));
  		executable = str.substring(str.lastIndexOf('\\')+1);

  		output.push("  <AppConfig Path=\""+path+"\" Executable=\""+executable+"\">");
  		output.push("    <Mitigation Name=\"DEP\" Enabled=\"true\" />");
    	output.push("    <Mitigation Name=\"SEHOP\" Enabled=\"true\" />");
    	output.push("    <Mitigation Name=\"NullPage\" Enabled=\"true\" />");
    	output.push("    <Mitigation Name=\"HeapSpray\" Enabled=\"true\" />");
    	output.push("    <Mitigation Name=\"EAF\" Enabled=\"true\" />");
    	output.push("    <Mitigation Name=\"MandatoryASLR\" Enabled=\"true\" />");
    	output.push("    <Mitigation Name=\"BottomUpASLR\" Enabled=\"true\" />");
    	output.push("    <Mitigation Name=\"LoadLib\" Enabled=\"true\" />");
    	output.push("    <Mitigation Name=\"MemProt\" Enabled=\"true\" />");
    	output.push("    <Mitigation Name=\"Caller\" Enabled=\"true\" />");
    	output.push("    <Mitigation Name=\"SimExecFlow\" Enabled=\"true\" />");
    	output.push("    <Mitigation Name=\"StackPivot\" Enabled=\"true\" />");
  		output.push("  </AppConfig>");
	}
	output.push("</EMET_Apps>");

	$('#output').val(output.join("\n"));
});
