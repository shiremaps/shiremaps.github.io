    var tmwaTableAssets = (function (config) {
        //core functionality-  add, load, listeners, validators
        var _tableAssetsCore = {
            getCAOBJID: function () {
                var myurl = document.URL;
                if (myurl.indexOf("?") > -1 ) {
                    var myURLParamPieces = myurl.split("?");
                    var URLPieces = myURLParamPieces[1].split("&");
                    for (i=0; i < URLPieces.length; i++){
                        if (URLPieces[i].toLowerCase().indexOf('caobjid')!= -1){
                                mycaobjid = URLPieces[i].split("=");
                            }
                    }

                    var myid = String( mycaobjid[1]);
                    //console.log("from the asset tracker, my id is: " +  myid);
                    return myid;                
                } else {
                    return 462;
                }

            },            
            addRecord: function (caoid) {
                $(".add-row").on("click", function () {
                    //define new object for data json payload to be sent to server
                    $( "#inputfieldsTbl" ).wrapAll( "<div class='mymodal'><div class='bluedog'></div></div>" );
                    var newRecObj = {};
                    //get data frp, the form, make sure type isnt blank
                    var validationResult = _tableAssetsCore.validateInputAdd();
                    validationResult =   $.inArray(false, validationResult);
                    if (validationResult > -1) {
                        return;
                    } else {
                        newRecObj = $(".assetInput").serializeArray();  //.tableinputform  #inputForm  assetInput
//                        console.log('the inputs are:', newRecObj);
                        if (newRecObj[0].value == '') {
                            alert('You need to choose a type!');
                            return;
                        }
                        // this adds as many records as is specified in the copyQuantity input

                        var copyQuantity = 1;
                        copyQuantity = $('.copyQuant').val();
                        if (copyQuantity > 0 ) {
                            console.log(copyQuantity);
                            //boiler plate built object for ajax
                            //wrap the payload in an object
                            var outDataObj = {};
                            outDataObj.data = newRecObj;
                            //stringify then change all double quotes to single quotes using simple regex
                            var outdata = JSON.stringify(outDataObj);    
                            var anotherString = outdata.replace(/"/g, "'");

                            //data for ajax
                            var dataArray = {};

                            dataArray['caoid'] = caoid;
                            dataArray['COperation'] = 'addnew';
                            dataArray['data'] = "'" + anotherString + "'";
                            dataArray['f'] = 'json';      
                            //end built object for ajax
                            
                            //all ajax done wait method
                            var $ajaxcalls = [],
                                myCounterArray = [];
                            console.log($('#addRow'));
                            $(".inputDiv").append("<i class='fa fa-spinner fa-spin'></i>");
                            document.getElementById("addRow").disabled = true;
                            $(".cancel-edit").prop('disabled', true);
                            console.log(document.getElementById("addRow").disabled);
                            // set up all the ajax calls that will populate my array
                            for(var i=0; i < copyQuantity; i++) {
                                $ajaxcalls[i] = $.ajax({
                                    url: config.SOEurl,
                                    jsonp: "callback",
                                    // Tell jQuery we're expecting JSONP
                                    dataType: "jsonp",
                                    data:  dataArray,
                                    success: function( m ) {
                                       // console.log('tried to add data', response.data);
                                        try{ 
                                            myCounterArray.push(m);
                                            console.log(myCounterArray.length);
                                        } catch (e) {
                                            console.log(e);
                                        }

                                    }                                    
                                });
                            }

                            // this will setup the promise --- 
                            // what will run when all 28 AJAX calls complete?
                            $.when.apply(null, $ajaxcalls).then(function() {
                                returnResults();
                            });                        
                        //all ajax done wait method                            
                        }
                        

                        
                        
                        function returnResults() {
                            console.log('all Done!');
                            //after adding the new record clear the form, destroy and recreate the table from the db
                            _tableAssetHelpers.clearFormFields();
                            _tableAssetHelpers.clearTable();
                            _tableAssetsCore.refreshTable(caoid);
                            _tableAssetsHandlers.cancelEditHandler.clearStuff();
                            $("#Type").change();    
                            $(".fa-spinner").remove();
                            document.getElementById("addRow").disabled = false;
                            $(".cancel-edit").prop('disabled', false);
                        }


                    }


                });
            },
            toggleAddNew: function() {
                 $('#showAddModal').on('click', function() {
                     console.log('hey');
                    $( ".inputDiv" ).wrapAll( "<div class='mymodal'><div class='bluedog'></div></div>" );  ///inputfieldsTbl
                    $('.inputDiv').show(); 
                    $('.cancel-edit').css("display", "inline");
                    $('.copy-rows').css("display", "inline");
                 });

//                    if ($(".inputDiv").css('display') != "none") {
//                        $(".inputDiv").hide();
//                    }  
            },
            refreshTable: function (caoid) { 
                if ($('.update-row').css("display", "inline")) {
                   $('.update-row').css("display", "none");
                }
                if ($('.cancel-edit').css("display", "inline")) {
                   $('.cancel-edit').css("display", "none");
                }
                if ($('.copy-rows').css("display", "inline")){
                     $('.copy-rows').css("display", "none");
                }
                _tableAssetHelpers.clearTable();
                var dataArray = {};
                dataArray['caoid'] = caoid;
                dataArray['COperation'] = 'select';
                dataArray['data'] = 'Johny';
                dataArray['f'] = 'json';    

                //query rest web service for records with caoid
                $.ajax({
                    url: config.SOEurl,
                    jsonp: "callback",
                    // Tell jQuery we're expecting JSONP
                    dataType: "jsonp",
                    data:  dataArray,

                    // Work with the response
                    success: function( response ) {
                       // console.log('got data for table', response.data);
                        try{ 
                            if (response.data.length > 0){
                                //console.log('got a valid response, start building object'); 
                                //load the table with the data in the response
                                _tableAssetsCore.makeTable(response.data);
                            }
                        } catch (e) {
                            console.log(e);
                        }

                    }
                })    
            }, 
            operationRowListener: function (caoid) {
                var tableEl = document.getElementById("assetTbody");
                tableEl.onclick = function (e) {
                    e = e || window.event;
                    var target = e.srcElement || e.target;
                    //console.log(target);
//                    var data = [];
//                    console.log(data);
                    if ($(target).hasClass('trashcan')) {
                        target =  $(target).closest('TR');  //target.parentNode;
                        //console.log(target);
                        var trashData = [];
                        if (target){
                            var cells = target[0].getElementsByTagName("td");
                            for (var i=0; i < cells.length; i++) { 
                                trashData.push(cells[i].textContent);
                            }  
                            var deleteConfirm = confirm('Do you want to delete this row number ' + trashData[0] + " Type: " + trashData[1] + "?");
                            if (deleteConfirm == true){
                                //console.log('you like deleting dont you!');
                                _tableAssetsHandlers.deleteRowHandler(trashData[0], caoid);
                                trashData = [];
                            }
                        }
                    } else if ($(target).hasClass('mypencil')) {
                        if ($('.assetInput').hasClass("error")) {
                            $('.assetInput').removeClass("error");
                        }                              
                        var editTarget =  $(target).closest('TR');  //target.parentNode;
                        _tableAssetHelpers.pubSub.publish('/updateRow/regularEdit', {
                            item:editTarget,
                            modal:true
                        });


                    } else if ($(target).hasClass('savebt')) {
                          console.log(target);

                          if ($('.assetInput').hasClass("error")) {
                                $('.assetInput').removeClass("error");
                            }                              
                            var insideEditTarget =  $(target).closest('TR');  //target.parentNode;
                            console.log(insideEditTarget);
                            //saveEditButton(insideEditTarget);
                            _tableAssetHelpers.pubSub.publish('/updateRow/regularEdit', {
                                item: insideEditTarget,
                                modal: false,
                                floppy: true                                
                            });                    


                    }
                }

                var quickValidate = function (TR) {
                    var cells = TR;  //$(TR).find("td:not(:first-child):not(.ops)"); 
                    //console.log(cells);
                    var editData = [];
                    var editableArray = [];
                    var myinputs = $('.assetInput');
                    for (var i=0; i < cells.length; i++) { 
                        editData.push(cells[i].textContent);
                    } 
                    console.log(editData);
                    //push the current row data into the input modal
                    $(editData).each(function(index, element){
                        if (index == 0){
                            console.log(element);
                            $("#Type").change();
                        }
                        var curval = element;
                        try {
                            if (index == 0){
                                 $(myinputs[index]).val(curval);
                                //validate by type by forcing a change
                                $("#Type").change();
                            } 
                            //only update the input if the field isnt disabled
                            if (myinputs[index].disabled == false ) {
                                editableArray.push(true);
                                // $(myinputs[index]).val(curval);
                            } else {
                                console.log('this one disabled = '  + myinputs[index].disabled);
                                editableArray.push(false);
                            }
                        } catch (e) {
                            console.log(e);
                        }                             
                    }); 
                return editableArray;
                }
                
                $(tableEl).dblclick(function(e) {
                    var editArr = [];
                    var editableList = [];
                    var target = null;
                    var rowtarget = null;
                    $('TR').each(function() {
                      if( $(this).hasClass("tableEditRow") ) {
                        editArr.push($(this).text());
                      }
                    });          
                    console.log(editArr.length);
                    //dont let user double click edit more than 1 row
                    if ( editArr.length > 0 ) {  
                        return;
                    } else {
                        e = e || window.event;
                        var dblEdittarget = e.srcElement || e.target;
                            rowtarget = $(dblEdittarget).closest('TR');
                            target =  $(dblEdittarget).closest('TR').find("td:not(:first-child):not(.ops)");  //target.parentNode;
                            if (target){
                                editableList = quickValidate(target);
                                $(rowtarget).addClass("tableEditRow"); 
                                $(target).each(function(index, element) {
                                    if (editableList[index] === true && $(element).hasClass('editable')) {
                                        $( element ).wrapInner(function () {
                                            return "<div contentEditable='true'></div>"
                                        });                                        
                                    }
                                });

                                $(rowtarget).find('.fa.fa-floppy-o').css("display", "inline");
                                $(rowtarget).find('.mypencil').css("display", "none");

                            }
                    }

                });
                
                $(tableEl).on('keypress', '.tableEditRow', function(args) {
                    if (args.keyCode == 13) {
                        console.log('u just pressed me(the enter key)', args);
                        _tableAssetHelpers.pubSub.publish('/updateRow/regularEdit', {
                            item: args.currentTarget,
                            modal: false,
                            floppy: true
                        });                        
                        return false;
                    }
                });  //update-row

                
            },            
            makeTable: function (data){
                   // console.log('hello again');
                        $.each(data, function (k, v) {
                            //for each record in the return data and load into table
                            $("#assetTableResults tbody").append(
                                "<tr>" +
                                "<td>" + v.id + "</td>" +
                                "<td>" + v.Type + "</td>" +   
                                "<td>" + v.ServiceType + "</td>" +                                
                                "<td>" + v.Material + "</td>" +       
                                "<td class='editable'>" + v.Length + "</td>" +                                   
                                "<td title='" + v.UnitsServedList + "' style='color:#00bfff;'>" + v.NumUnitsServed + "</td>" + 
                                "<td class='editable'>" + v.LotNum + "</td>" +
                                "<td class='editable'>" + v.ServiceAddress + "</td>" +
                                "<td class='editable'>" + v.SubServiceAddress + "</td>" +  
                                "<td class='dontshowme'>" + v.UnitsServedList + "</td>" +
                                "<td class='editable'>" + v.Diameter + "</td>" +                                
                                "<td>" + v.SizeType + "</td>" +    
                                "<td>" + v.HasBackflow + "</td>" +                                     
                                "<td>" + v.MeterManuf + "</td>" +                                    
//                                "<td>" + v.Quantity + "</td>" +   
                                
                                "<td class='ops'>"  +
                                "<a title='Edit Existing Data'>" + 
                                    "<i class='mypencil fa fa-pencil-square-o fa-lg' aria-hidden='true'></i>" +
                                "</a>" + 
                                "<a>" + 
                                    "<i class='savebt fa fa-floppy-o fa-lg' aria-hidden='true'></i>" + 
                                "</a>" + 
                                "<a title='Delete this record'>" +
                                    "<i class='trashcan fa fa-trash-o fa-lg' aria-hidden='true'></i>" + 
                                "</a>" +
                                "</td>" + 
                                "</tr>" )
                            //fa fa-trash-o
                            //"<a><i class='ops mypencil fa fa-pencil-square-o' aria-hidden='true'></i></a><span><a><i class='ops savebt fa fa-floppy-o' aria-hidden='true'></i></a></span><a><i class='trashcan fa fa-trash-o' aria-hidden='true'></i></a>"

                        });
                    //trigger update makes tablesorter plugin realize theres data in the table so it can start sorting
                    $.tablesorter.addParser({
                            // set a unique id 
                            id: 'ftype',
                            is: function(s) {
                                    // return false so this parser is not auto detected 
                                    return false;
                            },
                            format: function(s) {
                                    // format your data for normalization 
                                    return s.toLowerCase()
                                            .replace("Water Meter", "d")
                                            .replace("Fire Service", "h")
                                            .replace("Fire Hydrant", "m")
                                            .replace("Main", "r")
                                            .replace("Pressure Regulating Station", "v")
                                            .replace("Booster Pump Station", "w")
                                            .replace("Water Storage Tank", "x");
                            },
                            // set type, either numeric or text 
                            type: 'text'
                    });
                
                    $("#assetTableResults").trigger("update"); 
                
                    //setsize matches the input fields to where the table fields are- for continuity
                    $(window).resize(_tableAssetHelpers.setSize());
                    _tableAssetHelpers.setSize();
            },
            validateInputTypes: function () {
                var allFields = $('.assetInput');
                var typeField = $("#Type");            
                $(typeField).change(function(){  //"select[name='Type']"
                    $('.assetInput:not(#Type)').val('');
                    $(allFields).attr('disabled', false);
                    $(allFields).show();
                    $(allFields).parent().find(".inputLabel").show();
                    $(allFields).removeClass('error');
                    var setType = $(typeField).val();
                    if ( setType != '' &&  setType != null ) {
                        switch (setType) {
                            case 'Main':
                                $.each(allFields, function (index, value) {
                                    if (value.name == "ServiceType" || value.name == "NumUnitsServed" || value.name == "LotNum" || value.name == "ServiceAddress" || value.name == "SizeType" || value.name == "HasBackflow" || value.name == "MeterManuf" || value.name == "SubServiceAddress" || value.name == "UnitsServedList") {
                                        value.disabled = true;
                                        $(value).css("display", "none");
                                        $(allFields[index]).parent().find(".inputLabel").css("display", "none");
                                    }
                                });                        
                                break;
                            case 'Water Meter':                         
                            case 'Construction Water Meter':                              
                                $.each(allFields, function (index, value) {
                                    if (value.name == "Length" || value.name == "Material") {
                                        value.disabled = true;
                                        $(value).css("display", "none");
                                        $(allFields[index]).parent().find(".inputLabel").css("display", "none");
                                    }
                                });                            
                                break;
                            case 'Fire Hydrant':
                                $.each(allFields, function (index, value) {
                                    if (value.name == "Length" || value.name == "Material" || value.name == "Diameter"  || value.name == "SizeType" || value.name == "HasBackflow" || value.name == "MeterManuf" || value.name == "UnitsServedList" || value.name == "NumUnitsServed") {
                                        value.disabled = true;
                                        $(value).css("display", "none");
                                        $(allFields[index]).parent().find(".inputLabel").css("display", "none");
                                    }
                                });                            
                                break;  
                            case 'Fire Service': 
                                $.each(allFields, function (index, value) {
                                    if (value.name == "Length" || value.name == "Material" || value.name == "SizeType" || value.name == "MeterManuf") {
                                        value.disabled = true;
                                        $(value).css("display", "none");
                                        $(allFields[index]).parent().find(".inputLabel").css("display", "none");
                                    }
                                });                            
                                break;
                            case 'Pressure Regulating Station':
                            case 'Booster Pump Station': 
                            case 'Water Storage Tank':                                 
                                $.each(allFields, function (index, value) {
                                    if (value.name == "ServiceType" || value.name == "NumUnitsServed" || value.name == "LotNum" || value.name == "Length" || value.name == "Material" || value.name == "SizeType" || value.name == "HasBackflow" || value.name == "MeterManuf" || value.name == "Diameter" || value.name == "SubServiceAddress" || value.name == "UnitsServedList") {
                                        value.disabled = true;
                                        $(value).css("display", "none");
                                        $(allFields[index]).parent().find(".inputLabel").css("display", "none");
                                    }
                                });                            
                                break;                                
                        }
                    }
                });   

            },
            validateInputAdd: function(){
                var allFields = $('.assetInput');
                _tableAssetHelpers.inputErrorClassRemover();
                var typeField = $("#Type");            
                var setType = $(typeField).val();
                var isOk =  [];
                if ( setType != '' &&  setType != null ) {
                    switch (setType) {
                        case 'Main':
                            var reqFields = $("#Diameter,#Material,#Length");
                            isOk = _tableAssetHelpers.validateTypes(reqFields);
                            break;                         
                        case 'Water Meter':                           
                            var reqFields = $("#Diameter,#ServiceType,#NumUnitsServed, #ServiceAddress,#MeterManuf");
                            isOk = _tableAssetHelpers.validateTypes(reqFields);
                            break;
                        case 'Fire Hydrant':
                            var reqFields = $("#ServiceType, #ServiceAddress");
                            isOk = _tableAssetHelpers.validateTypes(reqFields);
                            break; 
                        case 'Fire Service': 
                            var reqFields = $("#Diameter,#ServiceType,#ServiceAddress,#NumUnitsServed");
                            isOk = _tableAssetHelpers.validateTypes(reqFields);
                            break;   
                        case 'Pressure Regulating Station':
                        case 'Booster Pump Station': 
                        case 'Water Storage Tank':
                            var reqFields = $("#ServiceAddress");
                            isOk = _tableAssetHelpers.validateTypes(reqFields);
                            break;                            
                    }
                } 
                //alert(isOk);
                return isOk;
            },
        }
        //event handlers
        var _tableAssetsHandlers = {
            deleteRowHandler: function (rowid, caoid){
                //console.log(rowid, caoid);
                var data = {};
                data.operation = "deleteRecord";
                data.rownum = rowid;
                data = JSON.stringify(data);
                var anotherString = data.replace(/"/g, "'");
                var dataArray = {};
                dataArray['caoid'] = caoid;
                dataArray['COperation'] = 'deleteRecord';
                dataArray['data'] =  "'" + anotherString + "'";
                dataArray['f'] = 'json';    

                //query rest web service for records with caoid
                $.ajax({
                    url: config.SOEurl,
                    jsonp: "callback",
                    // Tell jQuery we're expecting JSONP
                    dataType: "jsonp",
                    data:  dataArray,


                    // Work with the response
                    success: function( response ) {
                       // console.log('trying to delete', response.data);
                        try{ 
                            if (response.data.length > 0){
                                _tableAssetHelpers.clearTable();
                                _tableAssetsCore.refreshTable(caoid);
                            }
                        } catch (e) {
                            console.log(e);
                        }

                    }
                });             
            },        
            cancelEditHandler: {
                
                
                clearStuff: function  () {
                    _tableAssetHelpers.clearFormFields();
                    //get rid of modal and show the add button and hide the save button
                    if ($(".add-row").css('display') == "none"  ){  //&& $('.update-row').css('display') == "inline" && $('.cancel-edit').css('display') == "inline"
                        $(".add-row").css("display", "inline");
                        $('.update-row').css("display", "none");
                        $('.cancel-edit').css("display", "none");
                    }

                    if ( $(".bluedog" ).parent().hasClass('mymodal') == true ){
                        console.log('truedat');
                       $( ".bluedog" ).unwrap(); 
                    }
                    if ( $( ".inputDiv" ).parent().hasClass('bluedog')) {
                       $( ".inputDiv" ).unwrap(); 
                    }
                    if ($(".inputDiv").css('display') != "none") {
                        $(".inputDiv").hide();
                    }
                    if ($('.tableEditRow')){
                        console.log($('.tableEditRow'));
                        $('.tableEditRow').removeClass('tableEditRow');
                    }   

                    if ($('.assetInput').hasClass("error")) {
                        $('.assetInput').removeClass("error");
                    }                    
                },
                cancelButton: function () {
                    $(".cancel-edit").on("click", function ( ) {
                        _tableAssetsHandlers.cancelEditHandler.clearStuff();
                    });                
                }
                

            },
            saveButtonHandler: function (caoid) {
                        //, caoid, newRecObj
                
                $(".update-row").on("click", function () {    
                    console.log('you just clicked the save button', caoid);
                    //define new object for data json payload to be sent to server

                    //get data from the form, make sure type isnt blank
                    var validationResult = _tableAssetsCore.validateInputAdd();
                    validationResult = $.inArray(false, validationResult);
                    if (validationResult > -1) {
                        if ($('.inputDiv').css('display') == "none") {
                           $('.inputDiv').show();
                        }

                        return;
                    } else {
                        //console.log(validationResult);
                        var newRecObj = {};
                        newRecObj = $(".assetInput").serializeArray(); //.tableinputform  #inputForm  assetInput
                        console.log('the updates are:', newRecObj);
                        if (newRecObj[0].value == '') {
                            alert('You need to choose a type!');
                            return;
                        }
                    
                        var currentEditRow =  $('.tableEditRow');   
                        if (currentEditRow) {
                            console.log($(currentEditRow));
                            var currentRowID = ($(currentEditRow).find("td:first").text());
                            var rowidObj = {name: "Atid", value: currentRowID};
                            newRecObj.push(rowidObj);
                            //console.log(newRecObj);
                            //wrap the payload in an object
                            var outDataObj = {};
                            outDataObj.data = newRecObj;
                            //stringify then change all double quotes to single quotes using simple regex
                            var outdata = JSON.stringify(outDataObj);    
                            var anotherString = outdata.replace(/"/g, "'");

                            //data for ajax
                            var dataArray = {};

                            dataArray['caoid'] = caoid;
                            dataArray['COperation'] = 'updateRecord';
                            dataArray['data'] = "'" + anotherString + "'";
                            dataArray['f'] = 'json';   

                            $.ajax({
                                url: config.SOEurl,
                                jsonp: "callback",
                                // Tell jQuery we're expecting JSONP
                                dataType: "jsonp",
                                data:  dataArray,
                                // Work with the response
                                success: function( response ) {
                                    //console.log('tried to add data', response.data);
                                        //console.log(response);
                                        try{ 
                                            if (response.data.length > 0) {


                                                _tableAssetsHandlers.cancelEditHandler.clearStuff();
                                                _tableAssetHelpers.clearTable();
                                                _tableAssetsCore.refreshTable(caoid);
                                                $("#Type").change();

                                            }
                                        } catch (e) {
                                            console.log(e);
                                        }


                                }
                            });                          

                        }                        
                    }
                }); 



            }, 
 
            openCrystalHandler: {
                openCrystal: function() {
                    $(".crystalMagic").on("click", function () {   
                        var repnum = config.CrystalReportNumber;
                        var newwindowOptions = "location=yes,menubar=yes,status=yes,titilebar=yes,resizable=yes"  //,location=yes,menubar=yes,status=yes,titilebar=yes,resizable=yes,width=800,height=600"
                        var myReportWindow = window.open(config.CrystalReportUrl + repnum + "&ReportType=Normal", "_blank"); //, newwindowOptions
//                        setTimeout(function(){
//                           console.log(myReportWindow.document) 
//                        },2000);
//                        $(myReportWindow.document).ready(function(){
//                            var mylist = $(myReportWindow.document).contents().find('#ctl00_Main_CrystalReportViewer1_p0SelectValue');
//                            if (mylist === undefined){
//                                console.log('bla');
//                            } else{
//                                //alert('it is defined');
//                                setTimeout(function(){
//                                    $(mylist).val('16-5105');
//                                    $(mylist).change();
//                                },2000);
//                            }
//                        });                         
                    });                    
                   
                }
            },
            subcribedHandlers: function() {

                var regularEditHandler= _tableAssetHelpers.pubSub.subscribe('/updateRow/regularEdit', function(obj){
                    //creates an empty array to hold the edit data
                        var editData = [];
                        //creates a variable to store the in data tr - row
                        var editTarget = obj.item;
                        var showmodal = obj.modal;
                        var inlinefloppy = obj.floppy;
                        //make a variable to hold the indata minus the operation cells
                        var cells =  $(editTarget).find("td:not(:first-child):not(.ops)");                      
                    
                        //make a variable for the inputs
                        var myinputs = $('.assetInput');        
        
                        //make sure the edit row isn't nothing                     
                        if (editTarget){
                            $(editTarget).addClass("tableEditRow");                              
                            //wrap the input fields with modal markup
                            $( ".inputDiv" ).wrapAll( "<div class='mymodal'><div class='bluedog'></div></div>" );  ///inputfieldsTbl
                            //show the input modal
                            if (showmodal === true) {
                                $('.inputDiv').show();                                
                            }
                            //loop through the cells variables and push contents into the editdata array
                            for (var i=0; i < cells.length; i++) { 
                                editData.push(cells[i].textContent);
                            } 
                            //push the current row data into the input modal
                            $(editData).each(function(index, element){
                                if (index == 0){
                                    $("#Type").change();
                                }
                                var curval = element;
                                try {
                                    if (index == 0){
                                         $(myinputs[index]).val(curval);
                                        //validate by type by forcing a change
                                        $("#Type").change();
                                    } 
                                    //only update the input if the field isnt disabled
                                    if (myinputs[index].disabled == false ) {
                                         $(myinputs[index]).val(curval);
                                    } else {
                                        console.log('this one disabled = '  + myinputs[index].disabled);
                                    }
                                } catch (e) {
                                    console.log(e);
                                }                             
                            });
                            $(".add-row").css("display", "none");
                            $('.update-row').css("display", "inline");
                            $('.cancel-edit').css("display", "inline");    
                            if (inlinefloppy === true) {
                                floppyHelperHandler(editTarget);
                            }
                            editData= [];
                    }                    
                });      
                var floppyHelperHandler = function (target){
                    $('.update-row').trigger("click");
                    $(target).find('.fa.fa-floppy-o').css("display", "none");                    
                }
                
                $(document).on('keypress', '.inputDiv', function(args) {
                    if (args.keyCode == 13) {
                        console.log('u just pressed me(the enter key)', args);
//                        _tableAssetHelpers.pubSub.publish('/updateRow/regularEdit', {
//                            item: args.currentTarget,
//                            modal: false,
//                            floppy: true
//                        }); 
                        $('.update-row').click();
                        return false;
                    }
                });  
                
            }

       
        }
        //helping functions
        var _tableAssetHelpers = {
            validateTypes: function (reqFields) {
    //            var validityArray = [];
                var validationBool = [];
                validationBool.push(true);
                var rules = {
                    Diameter: {
                        required: true,
                        min: .25,
                        dtype: Number
                    },
                    Material: {
                        required: true,
                        minlength: 2, 
                        dtype: 'string'
                    },
                    Length: {
                        required: true,
                        min: 1,
                        dtype: Number
                    },
                    Quantity: {
                        required: true,
                        min: 1,
                        dtype: Number
                    },
                    ServiceAddress: {
                        required: true,
                        minlength: 5,
                        dtype: 'string'
                    },
                    MeterManuf: {
                        required: true,
                        min: 5,
                        dtype: 'string'
                    },
                    ServiceType: {
                        required: true,
                        min: 3,
                        dtype: 'string'
                    },
                    NumUnitsServed: {
                        min: 1,
                        dtype: Number
                    }
                    
                }           
                $.each(reqFields, function (index, value) {
                    if ( rules.hasOwnProperty(value.name) ) {
                        var currentRule = rules[value.name];
                        if (currentRule['required'] = true && (value.value === null || value.value == '')  ) {
                            value.classList.add("error");
                            //break;
                            validationBool.push(false);
                        } else if (currentRule['dtype'] === Number && isNaN(value.value) === true ) {
                            value.classList.add("error");
                            //alert('thats not a number');
                            validationBool.push(false);
                        } else if (currentRule['required'] = true && currentRule['min'] >= 1 && value.value < currentRule['min']  )  {
                            value.classList.add("error");
                            //break; 
                            validationBool.push(false);
                        }
                    }

                });   
                return validationBool;
            },
            clearTable: function () {
                //destroy the html table
                $('#assetTbody').empty();
            },            
            setSize: function() {

                var i = 0;
                //console.log('setting size now');
                $("#assetTableResults tr").first().find("th").each(function() {
                    $($("#inputfieldsTbl tr").first().find("th")[i]).width(
                        $(this).width()
                    );
                    i++;
                });
            },
            clearFormFields: function () {
                //pretty self explanatory- clears out the form inputs
                $('.assetInput').val('');
                if ($('.copyQuant').val() != 1) {
                    $('.copyQuant').val(1);
                }
                //console.log('reset input form');
            },            
            inputErrorClassRemover: function (){
                $(".assetInput").mousedown(function(e) {
    //                $.each('.assetInput', function (index, value) {
                    if (_tableAssetHelpers.hasClass(e.target, "error")){
                        e.target.classList.remove("error");
                    }
    //                });

                    //console.log(e.target + 'hello input');
                });            
            },
            hasClass: function (element, cls) {
                return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
            },
            pubSub: function(){
                var topics = {};
                var hOP = topics.hasOwnProperty;

                return {
                subscribe: function(topic, listener) {
                  // Create the topic's object if not yet created
                  if(!hOP.call(topics, topic)) topics[topic] = [];

                  // Add the listener to queue
                  var index = topics[topic].push(listener) -1;

                  // Provide handle back for removal of topic
                  return {
                    remove: function() {
                      delete topics[topic][index];
                    }
                  };
                },
                publish: function(topic, info) {
                  // If the topic doesn't exist, or there's no listeners in queue, just leave
                  if(!hOP.call(topics, topic)) return;

                  // Cycle through topics queue, fire!
                  topics[topic].forEach(function(item) {
                        item(info != undefined ? info : {});
                  });
                }
                };
            }()
            
        }
        
        
        //initialize the application
        var init = function () {
            var caoid = _tableAssetsCore.getCAOBJID();
            //console.log(caoid);
            _tableAssetsCore.validateInputTypes();	         
            $("#assetTableResults").tablesorter({
              
            });  
            _tableAssetsCore.addRecord(caoid);
            _tableAssetsCore.refreshTable(caoid);      
            _tableAssetsCore.operationRowListener(caoid); 
            _tableAssetsCore.toggleAddNew();
            _tableAssetsHandlers.cancelEditHandler.cancelButton();
            _tableAssetsHandlers.saveButtonHandler(caoid);
            _tableAssetsHandlers.openCrystalHandler.openCrystal();
            _tableAssetsHandlers.subcribedHandlers();
        };

        return {
            init: init
        }
        
    })( assetTableTMWAConfig  );
