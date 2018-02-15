var wcfServiceClientTest = (function () {
                var _helpers = {
                    pubSub: function() {
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
                    }(),
                    validateSingleData: function (intype, data) {
                        console.log(intype, data);
                        var answerBool = {
                            bool: 'false', 
                            outdata: {
                                data
                            }
                        };
                        if (intype === 'text'){
                            if (data.value === null || data.value == '' || data.length < 3){
                                answerBool.bool = false;
                                answerBool.outdata = data;
                            } else {
                                answerBool.bool = true;
                                answerBool.outdata = data;
                            }
                        }
                        if (intype === 'number'){
                            console.log('yes its anumber', data);
                            if (isNaN(data) === true){
                                answerBool.bool = false;
                                answerBool.outdata = data;
                            } else {
                                answerBool.bool = true;
                                answerBool.outdata = data;
                            }
                        }
                        if (intype === 'date'){

                        }
                        return answerBool;
                    },
                    currentlyCheckedData: []
                };                
                
                var makeTable = function () {
                    var url = "GetAssetList";
                    var method= 'GET';
                    var callbackObj = ['append', 'maintaincheckbox'];
                    doAjax(url, null, method, callbackObj);                     
                };  

                var appendTable = function (responseData) {
                    if (responseData.length > 0) {
                        $.each(responseData, function(index, element){
                            $('#assetTableResults tbody').append("<tr>"+"<td>" + element["id"] + "</td>" + "<td>" + element["name"] + "</td>"+ "<td><input type='checkbox'></td>"+ "</tr>");
                        });
                        console.log(responseData.length);
                        maintaincheckboxOne();
                    }                    
                };
                
                var maintaincheckboxOne  = function () {
                    var allcheckboxes = $('input[type=checkbox');
                    $(allcheckboxes).change(function(){
                        var checkedData = [];
                        var firstcheckedRow = null;
                        if(this.checked) {
                            firstcheckedRow = this;
                        }                        
                        $(allcheckboxes).each(function(index, element){
                           if (element.checked ) {
                             element.checked = false;
                           }
                        }); 
                        if (firstcheckedRow){
                            firstcheckedRow.checked = true;
                            $('#inputEdit').val($(firstcheckedRow).closest('TR').find('td')[1].innerHTML);       
                            $('.delete').val($(firstcheckedRow).closest('TR').find('td')[1].innerHTML); 
                            var row = $(firstcheckedRow).closest('TR');
                            if (row){
                                var cells = row[0].getElementsByTagName("td");
                                for (var i=0; i < cells.length; i++) { 
                                    checkedData.push(cells[i].textContent);
                                }
                                console.log(checkedData);
                                wcfServiceClientTest.helpers.currentlyCheckedData = checkedData;
                            }                            
                        } else {
                            $('#inputEdit').val(null);
                        }
                    });  
                    
                }; 

                var clearTable = function() {
                    console.log('made it to clear body');
                    $('tbody').empty();
                };                

                var subsribedhandlers = _helpers.pubSub.subscribe('/updateRow/clicked', function(obj){
                   console.log(obj.item, '  waz up');
                });  

                var doAjax =  function(inurl, indata, inmethod, incallbackObj) {
                    $.ajax({
                        url: inurl, 
                        method: inmethod,
                        jsonp: "callback",
//                        contentType: 'application/json',
                        data: indata,                        
                        success: function( response ) {
                            if (incallbackObj.length > 0){
                                $(incallbackObj).each(function(index, efunction){
                                   //console.log(index) ;
                                    if (efunction === 'clear') {
                                        clearTable();
                                    }
                                    if (efunction === 'make'){
                                        makeTable();
                                    }
                                    if (efunction === 'append' && response.length > 0) {
                                        appendTable(response);
                                    }
                                    if (efunction === 'maintaincheckbox') {
                                        maintaincheckboxOne();
                                    }
                                });
                            }
                        }
                    });                     
                };
                

                              
                return {
                    makeTable:makeTable,
                    clearTable: clearTable,
                    helpers: _helpers,
                    runajax: doAjax
                }
                
            })();
