var jq = jQuery.noConflict();

var project = new function () {
    var strApiUrl, strApiKey, container, default_data, data_container;
    default_data = {};
    
    this.loadAPI = function(){
        var profileUrl = jq('#logged_user a[href*="path_info=people"]').attr('href');
        var aryQueryValue = this.passUrlQuery(profileUrl.indexOf('?') < 0 ? profileUrl : profileUrl.substr(profileUrl.indexOf('?') + 1));
        var objPathInfo = decodeURIComponent(aryQueryValue.path_info).replace(/([a-z_]+)\/(\d+)/ig, '$1=$2').replace(/\//ig, '&');
        objPathInfo = this.passUrlQuery(objPathInfo);
        default_data.company_id = objPathInfo.people;
        default_data.user_id = objPathInfo.users;
        default_data.project_id = App.data.active_project_id;
        
        var url = profileUrl + encodeURIComponent('/api');
        var data = jq.ajax({
                    type: 'GET',
                    url: url,
                    async: false,
                    data: {},
                    dataType: 'html', 
                    success: function(msg){
                        var html = jq(msg).find('#api_settings');
                        strApiUrl = html.find(':contains("URL") + dd').text();
                        strApiKey = html.find(':contains("Key") + dd').text().match(/\s*\w[^\s]+/i);
                        project.populateUI();
                    }
                });
    }
    
    this.populateUI = function(){
        container = jq('<div/>');
        data_container = jq('<div/>');
        container.append('<div class="section_options"><a href="javascript:void(0)" onclick="project.panelShift()" style="text-align:center">Open/Close</a></div>')
        container.append('<div class="section_options cols_2" style="width:200px"><div><a href="javascript:void(0)" onclick="project.dataPanelShift()" style="text-align:center">View Data</a></div><div><a href="javascript:void(0)" onclick="project.dataPanelMeOnly()" style="text-align:center">Me/All</a></div><br/></div>')
        data_container.append('<table/>');
        container.addClass('api-ui-menu');
        data_container.addClass('api-data-content');
        
        jq('body').prepend(container);
        jq('body').prepend(data_container);
        var dl = '';
        for(i in APIList){
            var name = i.toLowerCase().replace(/\W/ig, '_');
            dl += '<dt id="dt_' + name + '" onclick="project.apiMenuExpend(\'' + name + '\')" style="border-top:1px solid black;font-weight:bold;cursor:pointer">' + i + '</dt>';
            for(var n = 0; n < APIList[i].length; n++){
                var title = APIList[i][n].substr(APIList[i][n].indexOf('#') + 1);
                dl += '<dd title="' + title + '" id="dd_' + name + '_' + n + '" style="display:none;cursor:pointer" onclick="project.loadAPIAction(\'' + APIList[i][n] + '\')">' + (APIList[i][n].indexOf('?') > -1 ? APIList[i][n].substr(0, APIList[i][n].indexOf('?')) : APIList[i][n]) + '</dd>';
            }
        }
        dl = '<dl style="width:100%">' + dl + '</dl>';
        container.append(dl);
        container.append('<form/>');
        
        container.find('dd').each(function(){
            jq(this).hover(
                function(){
                    jq(this).css({'background-color':'grey'});
                },
                function(){
                    jq(this).css({'background-color':'white'});
                }
            );
        });
        
    }
    
    this.apiMenuExpend = function(name){
        var ddList = jq('dd[id^="dd_' + name + '_"]');
        var dl = jq('#dt_' + name).closest('dl');
        var allDdList = dl.children('dd');
        var blnShow = jq(ddList[0]).is(':hidden');
        allDdList.each(function(){
            jq(this).hide();
        });
        
        if(blnShow){
            ddList.each(function(){
                jq(this).show();
            });
        }
    }
    
    this.panelShift = function(){
        var dl = container.children('dl');
        if(dl.is(':hidden')){
            dl.show();
        }else{
            dl.hide();
        }
    }
    
    this.dataPanelShift = function(){
        var table = data_container.children('table');
        if(table.is(':hidden')){
            table.show();
        }else{
            table.hide();
        }
    }
    
    this.dataPanelMeOnly = function(){
        var tr = data_container.find('table tr.no_selected:first');
        console.log(tr);
        if(tr.is(':hidden')){
            data_container.find('table tr.no_selected').each(function(){
                jq(this).show();
            })
        }else{
            data_container.find('table tr.no_selected').each(function(){
                jq(this).hide();
            })
        }
    }
    
    this.loadAPIAction = function(apiString){
        var objExtraFormData = arguments.length > 1 ? this.pickUpForm(container.find('form') , {}) : {};
        var title = apiString.substr(apiString.indexOf('#') + 1);
        apiString = apiString.indexOf('#') > -1 ? apiString.substr(0, apiString.indexOf('#')) : apiString ;
        
        for(i in default_data){
            var patten = new RegExp('\:' + i, 'ig');
            apiString = apiString.replace(patten, default_data[i]);
        }
        
        for(i in objExtraFormData){
            var patten = new RegExp('\:' + i, 'ig');
            apiString = apiString.replace(patten, encodeURIComponent(objExtraFormData[i]));
        }
        
        var aryCustomData = apiString.match(/\:\w+/ig);
        aryCustomData = aryCustomData ? aryCustomData : [];
        
        this.closeForm();
        
        if(aryCustomData.length){
            this.populateForm(aryCustomData, apiString, title);
        }else{
            var strAPIUrlFull = strApiUrl + '?token=' + strApiKey + '&format=json&path_info=' + (apiString.indexOf('#') > -1 ? apiString.substr(0, apiString.indexOf('#')) : (apiString.indexOf('?') > -1 ? apiString.substr(0, apiString.indexOf('?')) : apiString ));
            var postData = apiString.indexOf('?') > -1 ? apiString.substr(apiString.indexOf('?') + 1) : '';
            postData = postData.indexOf('#') > -1 ? apiString.substr(0, apiString.indexOf('#')) : postData;
            postData = this.passUrlQuery(postData);
            
            var n = 0;
            for(i in postData){
                if(postData[i] == ''){
                    delete postData[i];
                }else{
                    postData[i] = decodeURIComponent(postData[i]);
                }
                n ++;
            }
            if(n){
                postData['submitted'] = 'submitted';
            }
            
            var data = jq.ajax({
                    type: n ? 'POST' : 'GET',
                    url: strAPIUrlFull,
                    async: false,
                    data: postData,
                    dataType: 'json', 
                    success: function(msg){
                        var html = '';
                        if(msg){
                            if(msg.length > 0){
                                var tr = '';
                                for(n in msg[0]){
                                    tr += '<th>' + n + '</th>';
                                }
                                tr = '<thead><tr>' + tr + '</tr></thead>';
                                html += tr;
                                
                                for(i in msg){
                                    var tr = '';
                                    var selected = false;
                                    for(n in msg[i]){
                                        tr += '<td>' + (n=='permalink' ? '<a href="' + msg[i][n] + '" target="_blank">Link</a>' : (msg[i][n] && (typeof(msg[i][n]) == 'object' || typeof(msg[i][n]) == 'array')  ? msg[i][n].toSource() : msg[i][n])) + '</td>';
                                        if(msg[i][n] == default_data.user_id){
                                            selected = true;
                                        }
                                    }
                                    tr = '<tr class="' + (i%2 == 0 ? 'even' : 'odd' ) + ' ' + (selected ? 'selected' : 'no_selected') + '">' + tr + '</tr>';
                                    html += tr;
                                }
                            }else{
                                for(i in msg){
                                    var tr = '<tr class="' + (i%2 == 0 ? 'even' : 'odd' ) + '"><th>' + i + '</th><td>' + (i=='permalink' ? '<a href="' + msg[i] + '" target="_blank">Link</a>' : (msg[i] && (typeof(msg[i]) == 'object' || typeof(msg[i]) == 'array')  ? msg[i].toSource() : msg[i])) + '</td></tr>';
                                    html += tr;
                                }
                            }
                        }else{
                            html = '<tr><th>No records found</th></tr>';
                        }
                        html = '<table cellspacing="2" cellpadding="4">' + html + '</table>';
                        data_container.find('table').replaceWith(jq(html));
                    }
                });
        }
    }
    
    this.populateForm = function(aryFormData, apiString, title){
        var date = new Date();
        
        var form = container.find('form');
        form.empty();
        html = '';
        for(var i = 0; i < aryFormData.length; i++ ){
            html += '<tr><td><label>' + aryFormData[i].substr(1) + '<label></td><td align="right"><input style="width:120px" value="' + (aryFormData[i].indexOf('date') > -1 || aryFormData[i].indexOf('due_on') > -1 ? (date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString() + '-' + date.getDate().toString()) : '' ) + '" name="' + aryFormData[i].substr(1) + '" type="text" /></td></tr>';
        }
        html += '<tr><td colspan="2"><span class="section_options cols_2"><span><a href="javascript:void(0)" onclick="project.closeForm()" style="text-align:center">Close</a></span><span><a href="javascript:void(0)" onclick="project.loadAPIAction(\'' + apiString + '\', true)" style="text-align:center">Submit</a></span></span></td></tr>';
        html += '<tr><td colspan="2"><p>' + title.replace(/\,/g, '<br/>') + '</p></td></tr>';
        html = '<table cellspacing="2" cellpadding="4">' + html + '</table>';
        html += '<input value="submitted" name="submitted" type="hidden" />';
        form.append(html);
    }
    
    this.closeForm = function(){
        var form = container.find('form');
        form.empty();
    }
    
    /**
     * var data = {};
     * data = pickUpForm('form[id="form_name"]', data);
     * $.ajax ....
     *
     **/
    this.pickUpForm = function(str_form_name, data){
        var blnPickDisabled = arguments.length > 2 && arguments[2] == true ? true : false;
        //console.log(str_form_name + ' input,' + str_form_name + ' select,' + str_form_name + ' textarea');
        jq(str_form_name).find('input,select,textarea').each(function(){
            if(!blnPickDisabled && this.disabled){
                return;
            }
            var field_type = jq(this).attr('type');
            var blnRetrieve = true;
            if(field_type == 'checkbox' || field_type == 'radio' ){
                if(!this.checked){
                    blnRetrieve = false;
                }
            }
            if(blnRetrieve){
                var input_node = jq(this);
                data[input_node.attr('name')] = input_node.val();   
            }
        });
        return data;
    }
    
    this.ajaxForm = function(slug, data, callback){
        data.slug = slug;
        data.timestamp = time.getTime();
        jq.ajax({
            type: 'POST',
            url: wwwroot + '/ajax',
            async: false,
            data: data,
            dataType: 'json', 
            success: function(msg){
                callback(msg);
            }
        });
    }
    
    this.passUrlQuery = function(){
        var url = arguments.length > 0 ? arguments[0] : window.location.search.substr(1);
        var ary_url = url.split('&');
        var obj_url = {};
        for(var i = 0; i < ary_url.length ; i++){
            var ary_query_item = ary_url[i].split('=');
            if(typeof ary_query_item[1] != 'undefined'){
                obj_url[ary_query_item[0]] = ary_query_item[1];
            }
        }
        return obj_url;
    }
    
    var APIList = {
        'System Information':['/info'],
        
        'Working with Roles':
        ['/roles/system',
        '/roles/project',
        '/roles/:role_id'],
        
        'Working with Companies and Users':
        ['/people',
        '/people/add-company',
        '/people/:company_id',
        '/people/:company_id/edit',
        '/people/:company_id/delete',
        '/people/:company_id/add-user',
        '/people/:company_id/users/:user_id',
        '/people/:company_id/users/:user_id/edit',
        '/people/:company_id/users/:user_id/delete'],
        
        'Working with Projects':
        ['/projects',
        '/projects/add',
        '/projects/:project_id',
        '/projects/:project_id/edit',
        '/projects/:project_id/edit-status',
        '/projects/:project_id/delete',
        '/projects/:project_id/user-tasks'],
        
        'Working with Project People':
        ['/projects/:project_id/people',
        '/projects/:project_id/people/add',
        '/projects/:project_id/people/:user_id/change-permissions',
        '/projects/:project_id/people/:user_id/remove-from-project'],
        
        'Working with Project Groups':
        ['/projects/groups',
        '/projects/groups/add',
        '/projects/groups/:project_group_id',
        '/projects/groups/:project_group_id/edit',
        '/projects/groups/:project_group_id/delete'],
        
        'Working with Discussions':
        ['/projects/:project_id/discussions',
        '/projects/:project_id/discussions/add',
        '/projects/:project_id/discussions/:discussion_id',
        '/projects/:project_id/discussions/:discussion_id/edit'],
        
        'Working with Checklists':
        ['/projects/:project_id/checklists',
        '/projects/#project_id/checklists/archive',
        '/projects/:project_id/checklists/add',
        '/projects/:project_id/checklists/:checklist_id',
        '/projects/:project_id/checklists/:checklist_id/edit'],
        
        'Working with Files':
        ['/projects/:project_id/files',
        '/projects/:project_id/files/upload-single',
        '/projects/:project_id/files/:file_id',
        '/projects/:project_id/files/:file_id/edit'],
        
        'Working with Milestones':
        ['/projects/:project_id/milestones',
        '/projects/:project_id/milestones/add',
        '/projects/:project_id/milestones/:milestone_id',
        '/projects/:project_id/milestones/:milestone_id/edit'],
        
        'Working with Tickets':
        ['/projects/:project_id/tickets',
        '/projects/:project_id/tickets/archive',
        '/projects/:project_id/tickets/add',
        '/projects/:project_id/tickets/:ticket_id',
        '/projects/:project_id/tickets/:ticket_id/edit'],
        
        'Working with Time':
        ['/projects/:project_id/time',
        '/projects/:project_id/time/add?time[user_id]=:user_id&time[value]=:value&time[record_date]=:record_date&time[body]=:body&time[billable_status]=:billable_status&time[parent_id]=:parent_id#0-not billable,1-billable,2-billable and pending payment,3-billed,parent_id (integer) - ID of the parent object (task or a ticket).;',
        '/projects/:project_id/time/:record_id',
        '/projects/:project_id/time/:record_id/edit?time[user_id]=:user_id&time[value]=:value&time[record_date]=:record_date&time[body]=:body&time[billable_status]=:billable_status&time[parent_id]=:parent_id#0-not billable,1-billable,2-billable and pending payment,3-billed,parent_id (integer) - ID of the parent object (task or a ticket).;'],
        
        'Working with Pages':
        ['/projects/:project_id/pages',
        '/projects/:project_id/pages/add',
        '/projects/:project_id/pages/:page_id',
        '/projects/:project_id/pages/:page_id/edit',
        '/projects/:project_id/pages/:page_id/archive',
        '/projects/:project_id/pages/:page_id/unarchive'],
        
        'Working with Status Messages':
        ['/status',
        '/status/add'],
        
        'Working with Comments':
        ['/projects/:project_id/comments/add&parent_id=:parent_id',
        '/projects/:project_id/comments/:comment_id',
        '/projects/:project_id/comments/:comment_id/edit'],
        
        'Working with Subtasks':
        ['/projects/:project_id/tasks/add&parent_id=:parent_id?task[body]=:body&task[priority]=:priority&task[due_on]=:due_on&task[assignees][0][0]=:user_id&task[assignees][1]=:user_id#body (text) - The task summary. A value for this field is required when a new task is added;, priority (integer) - Priority can have five integer values ranging from -2 (lowest) to 2 (highest). 0 is normal;, due_on (date) - When the task is due;',
        '/projects/:project_id/tasks/:task_id',
        '/projects/:project_id/tasks/:task_id/edit?task[body]=:body&task[priority]=:priority&task[due_on]=:due_on&task[assignees][0][0]=:user_id&task[assignees][1]=:user_id#body (text) - The task summary. A value for this field is required when a new task is added;, priority (integer) - Priority can have five integer values ranging from -2 (lowest) to 2 (highest). 0 is normal;, due_on (date) - When the task is due;'],



        'Working with Attachments':
        ['/projects/:project_id/objects/:object_id/attachments'],
        
        'Common Project Object Operations':
        ['/projects/:project_id/objects/:object_id/complete',
        '/projects/:project_id/objects/:object_id/open',
        '/projects/:project_id/objects/:object_id/star',
        '/projects/:project_id/objects/:object_id/unstar',
        '/projects/:project_id/objects/:object_id/subscribe',
        '/projects/:project_id/objects/:object_id/unsubscribe',
        '/projects/:project_id/objects/:object_id/move-to-trash',
        '/projects/:project_id/objects/:object_id/restore-from-trash']
    }
    
}
project.loadAPI();
