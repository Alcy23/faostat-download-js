if (!window.C) {

	window.C = {			
		datasource : '',	
		json : {},	
		cssFilename : '',
		thousandSeparator : '',
		decimalSeparator : '',
		decimalNumbers : '',
		showFlags : true,
		showCodes : false,
		showUnits : true,
		showNullValues : true,
		valueColumnIndex : -1,
		summary_countries_map : new Array(),
		summary_elements_map : new Array(),
		summary_items_map : new Array(),
		summary_years_map : new Array(),
		limit : true,
		lang : 'E',
        widthTable: 750,
		/**
		 * @returns {String} WDS URL to show the table
		 * 
		 * Collect all the parameters from the UI and 
		 * prepare the URL to invoke WDS
		 * 
		 */
		collect : function(limit) {
			
			C.setLanguageForSQL();
			
			/*
				C.showFlags = $('#options_show_flags').jqxDropDownList('getSelectedItem').originalItem.value;
				C.showCodes = $('#options_show_codes').jqxDropDownList('getSelectedItem').originalItem.value;
				C.showUnits = $('#options_show_units').jqxDropDownList('getSelectedItem').originalItem.value;
				C.showNullValues = $('#options_show_null_values').jqxDropDownList('getSelectedItem').originalItem.value;
			*/
			C.showFlags = $('#options_show_flags').val();
			C.showCodes = $('#options_show_codes').val();
			C.showUnits = $('#options_show_units').val();
			C.showNullValues = $('#options_show_null_values').val();
			C.limit = limit;
			
			C.datasource = FAOSTATDownload.datasource;
			C.thousandSeparator = $("#options_thousand_separator").jqxDropDownList('getSelectedItem').value;
			C.decimalSeparator = $("#options_decimal_separator").jqxDropDownList('getSelectedItem').value;
			C.decimalNumbers = $("#options_decimal_numbers").jqxDropDownList('getSelectedItem').value;
						
			if (FAOSTATDownload.showWizard) {C.collect_wizard();} 
			else {C.collect_classic();	}
		},
		setLanguageForSQL : function() {
			switch(FAOSTATDownload.language) {
				case 'en' : C.lang = 'E'; break;
				case 'fr' : C.lang = 'F'; break;
				case 'es' : C.lang = 'S'; break;
			}
		},	
		collect_classic : function() {
//			C.collectListCodes();
			C.createJSONClassic();		
		},
		collect_wizard : function() {
			C.createJSONWizard();
			C.createTable();
		},
		createJSONClassic : function() {
			C.collectValuesFromClassicInterface();
		},
		/**
		 * Collect codes for Areas and Items if there's any 'list'
		 * type of code
		 */
		collectListCodes : function() {
			var callListCodesREST = C.callListCodesREST();
			if (callListCodesREST) {
				var countries = JSON.stringify(C.summary_countries_map);
				var items = JSON.stringify(C.summary_items_map);
				
				var backup_countries = new Array();
				var backup_items = new Array();
				
				for (var i = 0 ; i < C.summary_countries_map.length ; i++) 
					if (C.summary_countries_map[i].type == 'total')
						backup_countries.push(C.summary_countries_map[i]);
				
				for (var i = 0 ; i < C.summary_items_map.length ; i++) 
					if (C.summary_items_map[i].type == 'total') 
						backup_items.push(C.summary_items_map[i]);

                var data = {};
                data.datasource = FAOSTATDownload.datasource;
                data.domainCode = FAOSTATDownload.selectedDomainCode;
                data.language = FAOSTATDownload.language;
                data.countries = countries;
                data.items = items;
				
				$.ajax({
					
					type : 'POST',
                    url : 'http://' + FAOSTATDownload.baseurl + '/bletchley/rest/codes/list/post',
                    data : data,
//					url : 'http://' + FAOSTATDownload.baseurl + '/bletchley/rest/codes/list/' + FAOSTATDownload.datasource + '/' + FAOSTATDownload.selectedDomainCode + '/' + FAOSTATDownload.language + '/' + countries + '/' + items,
					success : function(response) {						
						
						var codes = $.parseJSON(response);		
						
						/**
						 * Firefox
						 */
						if (codes != null && codes.length > 0) {
							
							if (codes != null && codes[0].length > 0) {
								C.summary_countries_map = codes[0];
							}	
							
							if (codes != null && codes[1].length > 0) {
								C.summary_items_map = codes[1];
							}
							
							if (codes != null) {
							
								/**
								 * Use list codes or keep the current ones
								 */
								if (codes != null && codes[0].length > 0)
									C.summary_countries_map = codes[0];
								
								/**
								 * Use list codes or keep the current ones
								 */
								if (codes != null && codes[1].length > 0)
									C.summary_items_map = codes[1];
								
							}
							
							for (var z = 0 ; z < backup_items.length ; z++) 
								C.summary_items_map.push(backup_items[z]);
							
							for (var z = 0 ; z < backup_countries.length ; z++)  
								C.summary_countries_map.push(backup_countries[z]);
						
						} 
						
						/**
						 * Chrome
						 */
						else {
							
							//console.log('chrome');
						
							if (codes != null && codes[1].length > 0) {
								
								C.summary_items_map = codes[1];
								
							} else {
								
								/**
								 * THIS IS SOMEHOW WRONG
								 */
								if (response != null && response[0].length > 0)
									C.summary_countries_map = response[0];
								
								/**
								 * Use list codes or keep the current ones
								 */
								if (response != null && response[1].length > 0)
									C.summary_items_map = response[1];
								
							}
							
//							console.log(backup_items);
//							console.log(backup_countries);
							
							for (var z = 0 ; z < backup_items.length ; z++) 
								C.summary_items_map.push(backup_items[z]);
							
							for (var z = 0 ; z < backup_countries.length ; z++)  
								C.summary_countries_map.push(backup_countries[z]);
						
						}
						
						C.createJSONWizard();
						C.createTable();	
						
					},	
					
					error : function(err, b, c) {
						//console.log('ERROR! ' + err.status + ", " + b + ", " + c);
					}	
					
				});
			
			} else {				
				C.createJSONWizard();
				C.createTable();			
			}	
		},
		createTable : function() {

            var data = {};
			data.datasource = C.datasource;
			data.thousandSeparator = C.thousandSeparator;
			data.decimalSeparator = C.decimalSeparator;
			data.decimalNumbers = C.decimalNumbers;
			data.json = JSON.stringify(C.json);
			data.cssFilename = C.cssFilename;
			data.valueIndex = C.valueColumnIndex;
			var outputType = 'html';
			if (C.limit == null || C.limit == false)
				outputType = 'excel';

            /** Stream the Excel through the hidden form */
            $('#datasource').val(C.datasource);
            $('#thousandSeparator').val(C.thousandSeparator);
            $('#decimalSeparator').val(C.decimalSeparator);
            $('#decimalNumbers').val(C.decimalNumbers);
            $('#json').val(JSON.stringify(C.json));
            $('#cssFilename').val(C.cssFilename);
            $('#valueIndex').val(C.valueIndex);


            _this = this;
            /** Show the table */
            if (C.limit != null && C.limit == true) {

                $.ajax({
                    type : 'POST',
                    url : 'http://' + FAOSTATDownload.baseurl + '/wds/rest/table/' + outputType,
                    data : data,
                    success : function(response) {
                        $('#output_area').append('<div class="single-result-table-title">Please note: the preview is limited to ' + FAOSTATDownload.tablelimit + ' rows.</div>');
                        $('#output_area').append('<div style="padding-top:10px; width:'+ _this.widthTable +'">' + response + '</div>');

                        $('#OLAP_IFRAME').css('display', 'none');
                        $("#data").fixedHeader({
                            width: '720px',
                            height: 500
                        });
//                        if (C.limit != null && C.limit == true) {
//                            document.getElementById('output_area').innerHTML = response;
//                            $('#OLAP_IFRAME').css('display', 'none');
//                            $("#data").fixedHeader({
//                                width: '720px',
//                                height: 500
//                            });
//                        } else {
//                            var idx1 = 4 + response.indexOf('url=');
//                            var idx2 = 4 + response.indexOf('.xls');
//                            var url = response.substring(idx1, idx2);
//                            window.open(url);
//                        }
                        C.showCPINotes();
                    },

                    error : function(err, b, c) {
                        //console.log(err.status + ", " + b + ", " + c);
                    }
                });

            }

            /** Download the Excel */
            else {
                document.excelForm.submit();
            }


			
		},
		
		showCPINotes : function() {
			
			if (FAOSTATDownload.selectedDomainCode == 'CP') {
				
				var data = {};
				data.datasource = C.datasource;
				data.lang = FAOSTATDownload.language;
				
				var json = {};
				json.lang = FAOSTATDownload.language;
				
				var countries = '@areaList=N\'';
				for (var i = 0 ; i < C.summary_countries_map.length ; i++) {
					countries += C.summary_countries_map[i].code;
					if (i < C.summary_countries_map.length - 1)
						countries += ',';
				}
				countries += '\'';
				json.countries = countries;
				
				var items = '@item=N\'';
				for (var i = 0 ; i < C.summary_items_map.length ; i++) {
					items += C.summary_items_map[i].code;
					if (i < C.summary_items_map.length - 1)
						items += ',';
				}
				items += '\'';
				json.items = items;
				
				var years = '@yearList=N\'';
				for (var i = 0 ; i < C.summary_years_map.length ; i++) {
					years += C.summary_years_map[i].code;
					if (i < C.summary_years_map.length - 1)
						years += ',';
				}
				years += '\'';
				json.years = years;
				
				data.json = JSON.stringify(json);
				//console.log(data);
				//console.log(JSON.stringify(json));
				
				$.ajax({
					type : 'POST',
					url : 'http://' + FAOSTATDownload.baseurl + '/wds/rest/notes/cpinotes',
					data : data,
					success : function(response) {
						
						var html = '<br>';
						html += '<input style="margin-left: 22px;" type="button" id="cpi_notes_button" onclick="CPI.showCPITableNotes();" value="Show / Hide CPI Notes"/>';
						html += '<br><br>';
						html += '<div id="cpi_notes_container" style="display: none;">';
						html += response;
						html += '</div>';
						
						$('#cpi_notes_area').css('display', 'inline');
						document.getElementById('cpi_notes_area').innerHTML = html;
						
						$("#cpi_notes_button").jqxButton({
							width: '150', 
							theme: FAOSTATDownload.theme 
						});
						
					},
					
					error : function(err, b, c) {
						//console.log(err.status + ", " + b + ", " + c);
					}
					
				});
				
			}
			
		},
		
		callListCodesREST : function() {
			
			for (var i = 0 ; i < this.summary_countries_map.length ; i++)
				if (this.summary_countries_map[i].type == 'list')
					return true;
			
			for (var i = 0 ; i < this.summary_items_map.length ; i++)
				if (this.summary_items_map[i].type == 'list')
					return true;
			
			return false;
		},
		
		collectValuesFromClassicInterface : function() {
			
			C.summary_countries_map = new Array();
			C.summary_items_map = new Array();
			C.summary_elements_map = new Array();
			C.summary_years_map = new Array();
			
			var countries_rowindexes = null;
			var countries_rows = null;
			switch (FAOSTATDownload.countriesTabSelectedIndex) {
				case 0:
					countries_rowindexes = $('#gridCountries').jqxGrid('getselectedrowindexes');
					countries_rows = $('#gridCountries').jqxGrid('getrows');
				break;
				case 1:
					countries_rowindexes = $('#gridRegions').jqxGrid('getselectedrowindexes');
					countries_rows = $('#gridRegions').jqxGrid('getrows');
				break;
				case 2:
					countries_rowindexes = $('#gridSpecialGroups').jqxGrid('getselectedrowindexes');
					countries_rows = $('#gridSpecialGroups').jqxGrid('getrows');
				break;
			}
			for (var i = 0 ; i < countries_rowindexes.length ; i++) {
				var country_row = countries_rows[countries_rowindexes[i]];
				C.summary_countries_map.push(country_row);
			}
			
			var elements_rowindexes = $('#gridElements').jqxGrid('getselectedrowindexes');
			var elements_rows = $('#gridElements').jqxGrid('getrows');
			for (var i = 0 ; i < elements_rowindexes.length ; i++) {
				var elements_row = elements_rows[elements_rowindexes[i]];
				C.summary_elements_map.push(elements_row);
			}
			
			var items_rowindexes = null;
			var items_rows = null;
			if (FAOSTATDownload.selectedDomainCode != 'GY') {
				switch (FAOSTATDownload.itemsTabSelectedIndex) {
					case 0:
						items_rowindexes = $('#gridItems').jqxGrid('getselectedrowindexes');
						items_rows = $('#gridItems').jqxGrid('getrows');
					break;
					case 1:
						items_rowindexes = $('#gridItemsAggregated').jqxGrid('getselectedrowindexes');
						items_rows = $('#gridItemsAggregated').jqxGrid('getrows');
					break;
				}
			} else {
				items_rowindexes = $('#gridItemsAggregated').jqxGrid('getselectedrowindexes');
				items_rows = $('#gridItemsAggregated').jqxGrid('getrows');
			}
			for (var i = 0 ; i < items_rowindexes.length ; i++) {
				var items_row = items_rows[items_rowindexes[i]];
				C.summary_items_map.push(items_row);
			}
			
			var years_rowindexes = $('#gridYears').jqxGrid('getselectedrowindexes');
			var years_rows = $('#gridYears').jqxGrid('getrows');
			for (var i = 0 ; i < years_rowindexes.length ; i++) {
				var years_row = years_rows[years_rowindexes[i]];
				C.summary_years_map.push(years_row);
			}
			
			/**
			 * collect list codes, if any
			 */
			C.collectListCodes();
			
		},
		
		createJSONWizard : function() {
			if (FAOSTATDownload.selectedDomainCode == 'FT' || FAOSTATDownload.selectedDomainCode == 'TM') {
				C.createJSONTradeMatrix();
			} else {
				C.createJSONStandard();
			}
		},
		
		createJSONTradeMatrix : function() {
	
//			C.json["selects"] = [{"aggregation":"NONE", "column":"A1.AreaNameE", "alias":"Reporter_Area"}];
			
			/**
			 * Include domain name
			 */
			C.json["selects"] = [{"aggregation":"NONE", "column":"DOM.DomainName" + C.lang, "alias":"Domain"}];
			
			C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"A1.AreaName" + C.lang, "alias":"Reporter_Area"};
			
			if (C.showCodes)
				C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"D.ReporterAreaCode", "alias":"Reporter_Area_Code"};
			
			C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"A2.AreaName" + C.lang, "alias":"Partner_Area"};
			
			if (C.showCodes)
				C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"D.PartnerAreaCode", "alias":"Partner_Area_Code"};
			
			if (C.showCodes)
				C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"D.ItemCode", "alias":"Item_Code"};
			
			C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"I.ItemName" + C.lang, "alias":"Item"};
			
			if (C.showCodes)
				C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"D.ElementCode", "alias":"Element_Code"};
			
			C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"E.ElementName" + C.lang, "alias":"Element"};
			
			C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"D.Year", "alias":"Year"};
			
			if (C.showUnits)
				C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"E.UnitName" + C.lang, "alias":"Unit"};
			
			C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"D.Value", "alias":"Value"};
			
			if (C.showFlags)
				C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"D.Flag", "alias":"Flag"};
			
			C.valueColumnIndex = C.getValueColumnIndex(C.json);
			
			C.json["froms"] = [{"column":"TradeMatrix", "alias":"D"},
			                   {"column":"Item", "alias":"I"},
			                   {"column":"Element", "alias":"E"},
			                   {"column":"Area", "alias":"A1"},
			                   {"column":"Area", "alias":"A2"},
			                   {"column":"Domain", "alias":"DOM"}];
			
			var elements = C.elements();
			var countries = C.countries();
			var items = C.items();
			var years = C.years();
			
			C.json["wheres"] = [{"datatype":"TEXT","column":"D.DomainCode","operator":"=","value":FAOSTATDownload.selectedDomainCode,"ins":[]},
			                    {"datatype":"TEXT","column":"DOM.DomainCode","operator":"=","value":FAOSTATDownload.selectedDomainCode,"ins":[]},
			                    {"datatype":"DATE","column":"D.PartnerAreaCode","operator":"=","value":"A2.AreaCode","ins":[]},
			                    {"datatype":"DATE","column":"D.ReporterAreaCode","operator":"=","value":"A1.AreaCode","ins":[]},
			                    {"datatype":"DATE","column":"D.DomainCode","operator":"=","value":"DOM.DomainCode","ins":[]},
			                    {"datatype":"DATE","column":"D.ItemCode","operator":"=","value":"I.ItemCode","ins":[]},
//			                    {"datatype":"DATE","column":"D.ElementListCode","operator":"=","value":"E.ElementListCode","ins":[]},
			                    {"datatype":"DATE","column":"D.ElementCode","operator":"=","value":"E.ElementCode","ins":[]}];
			
			if (elements != null)
				C.json["wheres"][C.json["wheres"].length] = {"datatype":"TEXT","column":"D.ElementCode","operator":"IN","value":"E.ElementCode","ins": elements};
			if (countries != null)
				C.json["wheres"][C.json["wheres"].length] = {"datatype":"TEXT","column":"D.ReporterAreaCode","operator":"IN","value":"A1.AreaCode","ins": countries};
			if (items != null)
				C.json["wheres"][C.json["wheres"].length] = {"datatype":"TEXT","column":"D.ItemCode","operator":"IN","value":"I.ItemCode","ins": items};
			if (years != null)
				C.json["wheres"][C.json["wheres"].length] = {"datatype":"TEXT","column":"D.Year","operator":"IN","value":"D.Year","ins": years};
					
			C.json["orderBys"] = [{"column":"D.Year", "direction":"DESC"},
			                      {"column":"A1.AreaName" + C.lang, "direction":"ASC"},
			                      {"column":"I.ItemName" + C.lang, "direction":"ASC"},
			                      {"column":"E.ElementName" + C.lang, "direction":"ASC"}];
			
			if (C.limit) {
				C.json["limit"] = FAOSTATDownload.tablelimit;
			} else {
				C.json["limit"] = null;
			}
			C.json["query"] = null;
			C.json["frequency"] = "NONE";
			C.getValueColumnIndex(C.json);
		},
		
		createJSONStandard : function() {
			
			/**
			 * Include the Domain name
			 */
			C.json["selects"] = [{"aggregation":"NONE", "column":"DOM.DomainNameE", "alias":"Domain"}];	
			C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"A.AreaName" + C.lang, "alias":"Country"};
			if (C.showCodes)
				C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"D.AreaCode", "alias":"Country_Code"};
			
			C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"I.ItemName" + C.lang, "alias":"Item"};
			
			if (C.showCodes)
				C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"D.ItemCode", "alias":"Item_Code"};
			
			C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"E.ElementName" + C.lang, "alias":"Element"};
			
			if (C.showCodes)
				C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"D.ElementCode", "alias":"Element_Code"};
			
			C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"D.Year", "alias":"Year"};
			
			if (C.showUnits)
				C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"E.UnitName" + C.lang, "alias":"Unit"};
			
			C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"D.Value", "alias":"Value"};
			
			if (C.showFlags)
				C.json["selects"][C.json["selects"].length] = {"aggregation":"NONE", "column":"D.Flag", "alias":"Flag"};
			
			C.valueColumnIndex = C.getValueColumnIndex(C.json);
			
			C.json["froms"] = [{"column":"Data", "alias":"D"},
			                   {"column":"Item", "alias":"I"},
			                   {"column":"Element", "alias":"E"},
			                   {"column":"Area", "alias":"A"},
			                   {"column":"Domain", "alias":"DOM"}];
			
			var elements = C.elements();
			var countries = C.countries();
			var items = C.items();
			var years = C.years();
			
			C.json["wheres"] = [{"datatype":"TEXT","column":"D.DomainCode","operator":"=","value":FAOSTATDownload.selectedDomainCode,"ins":[]},
			                    {"datatype":"TEXT","column":"DOM.DomainCode","operator":"=","value":FAOSTATDownload.selectedDomainCode,"ins":[]},
			                    {"datatype":"DATE","column":"D.AreaCode","operator":"=","value":"A.AreaCode","ins":[]},
			                    {"datatype":"DATE","column":"D.DomainCode","operator":"=","value":"DOM.DomainCode","ins":[]},
			                    {"datatype":"DATE","column":"D.ItemCode","operator":"=","value":"I.ItemCode","ins":[]},
//			                    {"datatype":"DATE","column":"D.ElementListCode","operator":"=","value":"E.ElementListCode","ins":[]}];
			                    {"datatype":"DATE","column":"D.ElementCode","operator":"=","value":"E.ElementCode","ins":[]}];
			
			if (elements != null)
				C.json["wheres"][C.json["wheres"].length] = {"datatype":"TEXT","column":"D.ElementCode","operator":"IN","value":"E.ElementCode","ins": elements};
			if (countries != null)
				C.json["wheres"][C.json["wheres"].length] = {"datatype":"TEXT","column":"D.AreaCode","operator":"IN","value":"A.AreaCode","ins": countries};
			if (items != null)
				C.json["wheres"][C.json["wheres"].length] = {"datatype":"TEXT","column":"D.ItemCode","operator":"IN","value":"I.ItemCode","ins": items};
			if (years != null)
				C.json["wheres"][C.json["wheres"].length] = {"datatype":"TEXT","column":"D.Year","operator":"IN","value":"D.Year","ins": years};
			
			C.json["orderBys"] = [{"column":"D.Year", "direction":"DESC"},
			                      {"column":"A.AreaName" + C.lang, "direction":"ASC"},
			                      {"column":"I.ItemName" + C.lang, "direction":"ASC"},
			                      {"column":"E.ElementName" + C.lang, "direction":"ASC"}];
			
			if (C.limit) {
				C.json["limit"] = FAOSTATDownload.tablelimit;
			} else {
				C.json["limit"] = null;
			}
			
			C.json["query"] = null;
			C.json["frequency"] = "NONE";
			C.getValueColumnIndex(C.json);
		},
		
		getValueColumnIndex : function(json) {
			for (var i = 0 ; i < json.selects.length ; i++) 
				if (json.selects[i].column == 'D.Value') 
					return i;
		},
		
		items : function() {
			var ins = new Array();
			if (FAOSTATDownload.showWizard) {
				for (var i = 0 ; i < FAOSTATDownloadWizard.summary_items_map.length ; i++) {
					if (FAOSTATDownloadWizard.summary_items_map[i].code == 'all') {
						return null;
					} else {
						ins.push(FAOSTATDownloadWizard.summary_items_map[i].code);
					}
				}
			} else {
				for (var i = 0 ; i < this.summary_items_map.length ; i++) {
					if (this.summary_items_map[i].code == 'all') {
						return null;
					} else {
						ins.push(this.summary_items_map[i].code);
					}
				}
			}
			return ins;
		},
		elements : function() {
			var ins = new Array();
			if (FAOSTATDownload.showWizard) {
				for (var i = 0 ; i < FAOSTATDownloadWizard.summary_elements_map.length ; i++) {
					if (FAOSTATDownloadWizard.summary_elements_map[i].code == 'all') {
						return null;
					} else {
						ins.push(FAOSTATDownloadWizard.summary_elements_map[i].code);
					}
				}
			} else {
				for (var i = 0 ; i < this.summary_elements_map.length ; i++) {
					if (this.summary_elements_map[i].code == 'all') {
						return null;
					} else {
						ins.push(this.summary_elements_map[i].code);
					}
				}
			}
			return ins;
		},
		countries : function() {
			var ins = new Array();
			if (FAOSTATDownload.showWizard) {
				for (var i = 0 ; i < FAOSTATDownloadWizard.summary_countries_map.length ; i++) {
					if (FAOSTATDownloadWizard.summary_countries_map[i].code == 'all') {
						return null;
					} else {
						ins.push(FAOSTATDownloadWizard.summary_countries_map[i].code);
					}
				}
			} else {
				for (var i = 0 ; i < this.summary_countries_map.length ; i++) {
					if (this.summary_countries_map[i].code == 'all') {
						return null;
					} else {
						ins.push(this.summary_countries_map[i].code);
					}
				}
			}
			return ins;
		},
		years : function() {
			var ins = new Array();
			if (FAOSTATDownload.showWizard) {
				for (var i = 0 ; i < FAOSTATDownloadWizard.summary_years_map.length ; i++) {
					if (FAOSTATDownloadWizard.summary_years_map[i].code == 'all') {
						return null;
					} else {
						ins.push(FAOSTATDownloadWizard.summary_years_map[i].code);
					}
				}
			} else {
				for (var i = 0 ; i < this.summary_years_map.length ; i++) {
					if (this.summary_years_map[i].code == 'all') {
						return null;
					} else {
						ins.push(this.summary_years_map[i].code);
					}
				}
			}
			return ins;
		}
		
	};
	
}
