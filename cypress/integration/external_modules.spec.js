//  external_modules.spec.js: Tests all relevant external modules (productive)


//  <Spec Assertion Data>
const data_em = require('../../data/external_modules.json')

//  <paths>
const path_redcap = '/redcap_v' + Cypress.env('version')
const path_api = '/api/'
const api_token = Cypress.env('api_token')

describe('Test External Modules', () => {


    /**
     * Auto Record Generation
     * Description: Allows you to create new records in a project (or in the same project) by updating a trigger field. 
     * 
     * Notice: Test can only be repeated if module is configured to overwrite given records
     * 
     * @since 1.0.0
     */
     context('Auto Record Generation', () => {
        
        const rndm = cy.helpers.getRandomString(10)
        
        it('is enabled', () => {
         cy.visit(path_redcap + '/ExternalModules/manager/project.php?pid=' + data_em.em_test_pid)
         cy.get('#external-modules-enabled').should("contain", "Auto Record Generation")
        })
 
        it('can generate new record', () => {
         cy.visit(path_redcap + '/DataEntry/index.php?page=auto_record_generation&id=1&pid=' + data_em.em_test_pid)
         cy.get('input[name="trigger_field"]').clear().type('check')
         cy.get('input[name="auto_filled"]').clear().type(rndm)
         cy.get('#submit-btn-saverecord').click()
        })
 
        it('has auto-generated and filled new record in same project', () => {
         cy.visit(path_redcap + '/DataEntry/index.php?page=auto_record_generation&id=2&pid=' + data_em.em_test_pid)
         cy.get('input[name="trigger_field"]').should('have.value', '')
         cy.get('input[name="auto_filled"]').should('have.value', rndm)
        })
 
     })    

    /**
     * Big Data Import
     * Description: Allows import many records at once through a .csv file upload.
     * 
     * Uses a .csv file located at ../fixtures/bdi_test_import.csv
     * Notice: Erases all data before running test
     * 
     * @since 1.0.0
     */
    context('Big Data Import', ()=>{

        it('is enabled', () =>{
            cy.moduleIsEnabled('Big Data Import')
            //  Remove all previously added records so that we can test properly
            cy.eraseAllData(data_em.em_test_pid)
    
        })

        it('resets module data', () => {
            //  Call directly API
            cy.request({
                url: path_redcap + '/ExternalModules/?prefix=big_data_import&page=resetModuleData&pid=' + data_em.em_test_pid,
              }).then((resp) => {
                // redirect status code is 302
                expect(resp.status).to.eq(200)
                
              })            
        })
    
        it('can upload test csv', () => {
    
            cy.visit(path_redcap + '/ExternalModules/?prefix=big_data_import&page=import&pid=' + data_em.em_test_pid )
    
            cy.fixture('bdi_test_import.csv').then(fileContent => {
                cy.get('input[type="file"]').attachFile({
                    fileContent: fileContent.toString(),
                    fileName: 'bdi_test_import.csv',
                    mimeType: 'text/csv'
                });
            });
    
            cy.get('#import').click()
        });
    
        it('imports data from csv', () => {

            cy.get('#start').click()
            cy.get("div#Msg").should('be.visible')
            cy.contains("Import will start shortly.")
            cy.get('#DataTables_Table_0').contains('Import process finished')
        })


        it('shows successfully imported record', () => {            
            cy.visit( path_redcap + '/DataEntry/index.php?id=100&page=big_data_import&pid='  + data_em.em_test_pid )
            cy.get('input[name="bdi_1"]').should('have.value', 'Foo 100')
            cy.get('input[name="bdi_2"]').should('have.value', 'Bar 100')
            cy.get('input[name="bdi_3"]').should('have.value', 'Car 100')
        })


    })


    /**
     * Complete Row
     * Description: Simple module to highlight filled rows within a form
     * 
     * @since 1.0.0
     */
    context('Complete Row', () => {

        it('is enabled', () => {
            cy.moduleIsEnabled('Complete Row')
        })

        it('colors completed rows', () => {
            cy.visit(path_redcap + '/DataEntry/index.php?page=complete_row&id=1&pid=' + data_em.em_test_pid)
            cy.get('input[name="cr_1"]').type("foo")
            cy.get('input[name="cr_2"]').type("bar")
            cy.get('#submit-btn-dropdown').click()
            cy.get('#submit-btn-savecontinue').click()

            cy.get('#cr_2-tr td.labelrc').should('have.attr', 'style', 'background-color: rgb(219, 247, 223);')
        })

    })

    /**
     * Mass Delete
     * Description: Allows deletion of a big amount of data at once.
     * 
     * @since 1.0.0
     */
    context('Mass Delete', ()=>{

        it('is enabled', ()=>{
            cy.moduleIsEnabled('Mass Delete')
        })
        
        it('can fetch and select all records', () => {
    
            cy.visit( path_redcap + '/ExternalModules/?prefix=mass_delete&page=page_mass_delete&view=record-list&pid=' + data_em.em_test_pid )
            cy.get('#btn-fetch-records').click()
            cy.get('button[data-choice="all"]').should('be.visible').click()
    
        })

        it('can delete records', () => {
            cy.get('#btn-delete-selection').click()
            cy.get('button.delete_btn').click()
        })
    })

    /**
     * Custom Survey Landing Page
     * Description:  A module for creating a nicer landing page for doing mailers and code entry for surveys
     * 
     * Notice: Does not cover external access and mobile access.
     * 
     * @since 1.0.0     
     * 
     */
    context('Custom Survey Landing Page', () => {

        it('is enabled', () => {
            cy.moduleIsEnabled('Custom Survey Landing Page')
        })

        it('succeeds login with correct SAC', () => {
            cy.visit(path_redcap + '/DataEntry/index.php?id=1&page=base&pid='+ data_em.em_test_pid )
            cy.get('#submit-btn-saverecord').click()
            cy.visit(path_redcap + '/Surveys/invite_participants.php?participant_list=1&survey_id='+data_em.custom_survey_landing_survey_id+'&pid=' + data_em.em_test_pid )
            cy.get('#table-participant_table a[href="javascript:;"]').click()
            cy.get('input.staticInput').invoke('val').then( ($sac) => {
                cy.visit(path_redcap + '/ExternalModules/?prefix=custom_survey_landing_page&page=survey&pid=' + data_em.em_test_pid)
                cy.get('#access-digit-1').type($sac)
                cy.get('#submit-btn').click()
                cy.get('#surveytitle').should('have.text', 'Custom Survey Landing Page')
            })            
        })

        it('fails login with wrong SAC', ()=>{
            cy.visit(path_redcap + '/ExternalModules/?prefix=custom_survey_landing_page&page=survey&pid=' + data_em.em_test_pid)
            cy.get('#access-digit-1').type('ABCDEFGHS')
            cy.get('#submit-btn').click()
            cy.get('#alert-error').should('have.css', 'display', 'block')
        })

    })

    /**
     * Date Validation Action Tags
     * Description: Action tags to validate date and date time entries as @FUTURE, @NOTPAST, @PAST, @NOTFUTURE.
     * Date Format: d-m-y
     * 
     * Uses dayjs external package.
     * 
     * @since 1.0.0
     */
    context('Date Validation Action Tags', () => {
        
        it('is enabled', () => {
            cy.moduleIsEnabled('Date Validation Action Tags')
        })

        it('validates @FUTURE', () => {            
            cy.visit(path_redcap + '/DataEntry/index.php?id=1&page=date_validation_action_tags&pid=' + data_em.em_test_pid)            
            cy.get('input[name="future"]').type(Cypress.dayjs().subtract(1, 'year').format('DD-MM-YYYY'))
            cy.get('#label-future').click()
            cy.get('#redcapValidationErrorPopup').contains('The value you provided is outside the suggested range.')
            cy.get('.ui-dialog-buttonset').contains("Close").click()
        })

        it('validates @NOTPAST', () => {            
            cy.get('input[name="not_past"]').type(Cypress.dayjs().subtract(1, 'year').format('DD-MM-YYYY'))
            cy.get('#label-not_past').click()
            cy.get('#redcapValidationErrorPopup').contains('The value you provided is outside the suggested range.')
            cy.get('.ui-dialog-buttonset').contains("Close").click()
        })

        it('validates @PAST', () => {            
            cy.get('input[name="past"]').type(Cypress.dayjs().add(1, 'year').format('DD-MM-YYYY'))
            cy.get('#label-past').click()
            cy.get('#redcapValidationErrorPopup').contains('The value you provided is outside the suggested range.')
            cy.get('.ui-dialog-buttonset').contains("Close").click()
        })
        
        it('validates @NOTFUTURE', () => {            
            cy.get('input[name="not_future"]').type(Cypress.dayjs().add(1, 'year').format('DD-MM-YYYY'))
            cy.get('#label-not_future').click()
            cy.get('#redcapValidationErrorPopup').contains('The value you provided is outside the suggested range.')
            cy.get('.ui-dialog-buttonset').contains("Close").click()
        })

    })

    /**
     * Instance Table
     * Description: Use the action tag @INSTANCETABLE=form_name in a descriptive text field to include a table showing data from repeat instances of that form.
     * 
     * Uses base/helper_it where @INSTANCETABLE=instance_table is included.
     * Notice: Does not cover longtitudinal projects.
     * 
     * @since 1.0.0
     */
    context('Instance Table', () => {
        
        it('is enabled', () => {
            cy.moduleIsEnabled('Instance Table')
        })

        it('includes instance table', ()=>{
            cy.visit(path_redcap + '/DataEntry/index.php?pid='+data_em.em_test_pid+'&page=instance_table&id=1')
            cy.get('input[name="it_1"]').type('foo')
            cy.get('input[name="it_2"]').type('bar')
            cy.get('input[name="it_3"]').type('lel')
            cy.get('#submit-btn-saverecord').click()

            cy.visit(path_redcap + '/DataEntry/index.php?pid='+data_em.em_test_pid+'&id=1&page=instance_table_output')
            cy.get('#MCRI_InstanceTable_it_output_tbl__instance_table').contains('th', 'IT 1')
            cy.get('#MCRI_InstanceTable_it_output_tbl__instance_table').contains('th', 'custom header')
            cy.get('#MCRI_InstanceTable_it_output_tbl__instance_table').contains('td', 'foo')
            cy.get('#MCRI_InstanceTable_it_output_tbl__instance_table').contains('td', 'bar')

        })

    })

    /**
     * Language Editor
     * Description: Allows per project customization of the language.ini settings.
     * 
     * Uses 'em_manage_8' for testing on External Module Manager page.
     * 
     * @since 1.0.0
     */
    context('Language Editor', () => {
        
        it('is enabled', () => {
            cy.moduleIsEnabled('Language Editor')
        })

        it('edits language strings', () => {
            cy.visit(path_redcap + '/ExternalModules/manager/project.php?pid=' + data_em.em_test_pid)
            cy.get('h4').should('contain', '(Language Editor working)')
        })

    })

    /**
     * Several other tests...
     * 
     */


    /**
     * Locking API
     * Description:  Lock, unlock and read the lock status of instruments or entire records using API calls.
     * 
     * Uses API Token
     * @since 1.0.0
     */
    context('Locking API', () => {

        it('is enabled', () => {
            cy.moduleIsEnabled('Locking API')
        })

        it('has test records', () => {
            cy.visit(path_redcap + '/DataEntry/index.php?pid='+ data_em.em_test_pid +'&id=1&page=base')
            cy.get('#submit-btn-saverecord').click()
            cy.visit(path_redcap + '/DataEntry/index.php?pid='+ data_em.em_test_pid +'&id=2&page=base')
            cy.get('#submit-btn-saverecord').click()
            cy.visit(path_redcap + '/DataEntry/index.php?pid='+ data_em.em_test_pid +'&id=3&page=base')
            cy.get('#submit-btn-saverecord').click()
        })

        it('is forbidden', () => {
            cy.request({
                method:'POST',
                url: path_api + '?NOAUTH&type=module&prefix=locking_api&page=status',
                failOnStatusCode: false,
            }).then((resp) => {
                expect(resp.status).to.eq(403)
            })
        })

        it('is authenticated', () => {
            cy.request({
                method:'POST',
                url: path_api + '?NOAUTH&type=module&prefix=locking_api&page=status',
                failOnStatusCode: false,
                body: 'token='+api_token,
                form: true
            }).then((resp) => {
                expect(resp.status).to.eq(400)
            })
        })

        /* Data Level Tests */
        it('locks record (data level', () => {
            cy.request({
                method:'POST',
                url: path_api + '?NOAUTH&type=module&prefix=locking_api&page=lock',
                failOnStatusCode: false,
                body: 'token='+api_token + '&returnFormat=json&instrument=base&record=1',
                form: true
            }).then((resp) => {
                expect(resp.status).to.eq(200)
                var body = JSON.parse(resp.body)[0]
                expect(body.timestamp).to.contain('-')
            })
        })

        it('unlocks record (data level', () => {
            cy.request({
                method:'POST',
                url: path_api + '?NOAUTH&type=module&prefix=locking_api&page=unlock',
                failOnStatusCode: false,
                body: 'token='+api_token + '&returnFormat=json&instrument=base&record=1',
                form: true
            }).then((resp) => {
                expect(resp.status).to.eq(200)
                var body = JSON.parse(resp.body)[0]
                expect(body.timestamp).to.eq('')
            })
        })

        it('shows status for record (data level)', () => {
            cy.request({
                method:'POST',
                url: path_api + '?NOAUTH&type=module&prefix=locking_api&page=status',
                failOnStatusCode: false,
                body: 'token='+api_token + '&returnFormat=json&instrument=base&record=1',
                form: true
            }).then((resp) => {
                expect(resp.status).to.eq(200)
                var body = JSON.parse(resp.body)[0]
                expect(body.locked).to.eq('0')
            })
        })

        /* Record Level*/
        it('shows status for records (record level)', () => {
            cy.request({
                method:'POST',
                url: path_api + '?NOAUTH&type=module&prefix=locking_api&page=status',
                failOnStatusCode: false,
                body: 'token='+api_token + '&returnFormat=json&lock_record_level=true&record=%5B1%2C2%2C3%5D&format=json',
                form: true
            }).then((resp) => {
                expect(resp.status).to.eq(200)                
                resp.body.forEach(element => {                    
                    expect(element.timestamp).to.eq(null)
                });
            })
        })

        it('lock records (record level)', () => {
            cy.request({
                method:'POST',
                url: path_api + '?NOAUTH&type=module&prefix=locking_api&page=lock',
                failOnStatusCode: false,
                body: 'token='+api_token + '&returnFormat=json&lock_record_level=true&record=%5B1%2C2%2C3%5D&format=json',
                form: true
            }).then((resp) => {
                expect(resp.status).to.eq(200)                
                resp.body.forEach(element => {                    
                    expect(element.timestamp).to.contain("-")
                });
            })
        })

        it('unlock records (record level)', () => {
            cy.request({
                method:'POST',
                url: path_api + '?NOAUTH&type=module&prefix=locking_api&page=unlock',
                failOnStatusCode: false,
                body: 'token='+api_token + '&returnFormat=json&lock_record_level=true&record=%5B1%2C2%2C3%5D&format=json',
                form: true
            }).then((resp) => {
                expect(resp.status).to.eq(200)                
                resp.body.forEach(element => {                    
                    expect(element.timestamp).to.eq(null)
                });
            })
        })

    })

    /**
     * PDF Injector
     * 
     *  To Do
     *  ☐ Add new Injection
        ☐ Edit
        ☐ Delete
        ☐ Preview
        ☐ Inject: single, multi, 
     * 
     */


    /**
     * Data Quality API
     * Description: Adds Data Quality API endpoints.
     * 
     * @since 1.0.0
     */
    context('Data Quality API', () => {

        let dq

        it('is enabled', () => {
            cy.moduleIsEnabled('Data Quality API')
            cy.editRecordFor('base')
            cy.saveRecordAndStay()
            cy.get('#dc-icon-helper_data_quality_api').click()
            cy.get('#dc-comment').clear().type('foo-dq_api')
            cy.get('#dataResSavBtn').click()
        })

        it('exports data quality', () => {
            cy.request({
                url: path_api + '?NOAUTH&type=module&prefix=data_quality_api&page=export&pid='+data_em.em_test_pid,
                method: 'POST',
                form: true,
                failOnStatusCode: false,
                body: 'token='+api_token
            }).then((res) => {
                var obj = JSON.parse(res.body)
                dq = obj
                var o = obj[Object.keys(obj)[0]]
                var reso = o.resolutions
                var r = reso[Object.keys(reso)[0]]
                expect(r.comment).to.eq("foo-dq_api")
            })
        })

        it('imports data quality', () => {

            var obj
            obj = dq
            var o = obj[Object.keys(obj)[0]]
            var reso = o.resolutions
            var r = reso[Object.keys(reso)[0]]
            r.ts = "1990-01-01 00:00:00"
            r.comment = "Hello World"

            cy.request({
                url: path_api + '?NOAUTH&type=module&prefix=data_quality_api&page=import&pid='+data_em.em_test_pid,
                method: 'POST',
                form: true,
                failOnStatusCode: false,
                body: 'token='+api_token + '&data=' + JSON.stringify(obj)
            }).then((res) => {
                var id = JSON.parse(res.body)[0]
                cy.editRecordFor('base')
                cy.get('#dc-icon-helper_data_quality_api').click()
                cy.get('#res_id-'+id).should("contain", "Hello World")
            })
        })
    })

    /**
     * Data Resolution Workflow Tweaks
     * Shows/hides "Verify all fields" button
     * 
     * @since 1.0.0
     */
     context('Data Resolution Workflow Tweaks', () => {

        it('is enabled', () => {
            cy.moduleIsEnabled('Data Resolution Workflow Tweaks')
        })

        it('shows "Verify all fields" button', () => {
            cy.editRecordFor('base')
            cy.get('button#MCRI_DRWTweaks_Button').should('be.visible')
        })

    })    

    /**
     * Orca Search Module
     * Description: A configurable, searchable, and performant, list dashboard.
     * 
     * 
     * @since 1.0.0
     */
    context('Orca Search Module', () => {

        it('is enabled', () => {
            cy.moduleIsEnabled('Orca Search Module')
        })

        it('has record with field oid', () => {
            cy.visit(path_redcap + '/DataEntry/index.php?page=orca_search&id=1&pid=' + data_em.em_test_pid)
            cy.get('input[name="oid"]').clear().type('foo')
            cy.get('#submit-btn-saverecord').click()
        })

        it('can search for oid', () => {
            cy.visit(path_redcap + '/ExternalModules/?prefix=orca_search&page=search&pid='+ data_em.em_test_pid)
            cy.get('#search-value').type("foo")
            cy.get('#orca-search').click()
            cy.get('.orca-search-content').should('have.text', 'foo');
        })
    })

    /**
     * Shazam
     * Description: Shazam allows you to define a html template to rearrange the fields on a redcap form or survey instrument.
     * 
     * 
     * @since 1.0.0
     */
     context('Shazam', () => {

        it('is enabled', () => {
            cy.moduleIsEnabled('Shazam')
        })

        it('has basic HTML Output', () => {
            cy.visit(path_redcap + '/DataEntry/index.php?page=shazam&id=1&pid=' + data_em.em_test_pid)
            cy.get('#test-shazam-headline').should('have.text', 'Hello from Shazam');
        })
    })    
    
    /**
     * Simple Ontology Module
     * Description: Example implementation of Ontology Provider add in 8.8.1. 
     * This module allows a site wide set of code/displays to defined and then referenced as an ontology.
     * 
     * @since 1.0.0
     */
    context('Simple Ontology Module', () => {

        it('is enabled', () => {
            cy.moduleIsEnabled('Simple Ontology Module')
        })

        it('can enter Input from Dropdown', () => {
            cy.visit(path_redcap + '/DataEntry/index.php?page=simple_ontology&id=1&pid=' + data_em.em_test_pid)
            cy.get('#test_ontology-autosuggest-span').click()
            cy.get('#test_ontology-autosuggest').type('foo')
            cy.get('ul.ui-menu').not('#pdfExportDropdown').find('li.ui-menu-item a.ui-menu-item-wrapper').click()
            cy.get('input[name="test_ontology"').should('have.value', 'Foo')
        })
    })

    /**
     * Vizr
     * Vizr provides a way for project designers to create charts summarizing 
     * their data in a time series fashion to provide additional insights about their project.
     * 
     * @since 1.0.0
     * 
     */
    context('Vizr', () => {

        it('is enabled', () => {
            cy.moduleIsEnabled('Vizr')

            //  add vizr record
            cy.editRecordFor('vizr')
            cy.get('#vizr_date-tr td button').click()
            cy.saveRecord()
        })

        it('renders chart', () => {
            cy.visit( path_redcap + '/ExternalModules/?prefix=vizr&page=index&pid=' + data_em.em_test_pid)
            cy.get('.vizr-charts canvas').should('be.visible')
            cy.get('.vizr-chart-summary table tbody tr td').first().should('have.text', 1)
        })

    })

    /**
     * Custom Participant Export
     * A simple external module for REDCap that enables custom participant export to CSV. 
     * 
     * 
     * ☐ Custom Export 
     * ☐ Edit configuration
     * 
     * @since 1.0.0
     */
    

    /**
     * Unique Action Tag
     * Description: A REDCap external module providing action tags that make fields unique in Data Entry.
     * 
     * @since 1.0.0
     */
     context('Unique Action Tag', () => {

        it('is enabled', () => {
            cy.moduleIsEnabled('Unique Action Tag')
        })

        it('blocks duplicates for @UNIQUE', () => {
            cy.editRecordFor('unique_action_tag', 1)
            //cy.visit(path_redcap + '/DataEntry/index.php?page=unique_action_tag&id=1&pid=' + data_em.em_test_pid)
            cy.get('input[name="unique"]').clear().type("foo1")
            cy.get('body').click(0,0);
            cy.get('#submit-btn-saverecord').click()

            cy.editRecordFor('unique_action_tag', 2)
            //cy.visit(path_redcap + '/DataEntry/index.php?page=unique_action_tag&id=2&pid=' + data_em.em_test_pid)            
            cy.get('input[name="unique"]').clear().type("foo1")
            cy.get('body').click(0,0);
            cy.get('#suf_warning_dialog').should('be.visible')
        })

        it('blocks duplicates for @UNIQUE-STRICT (cross-record)', () => {
            cy.editRecordFor('unique_action_tag', 1)
            //cy.visit(path_redcap + '/DataEntry/index.php?page=unique_action_tag&id=1&pid=' + data_em.em_test_pid)
            cy.get('input[name="unique_strict"]').clear().type("bar1")
            cy.get('input[name="helper_unique_strict"').clear().type("bar2")
            cy.get('body').click(0,0);
            cy.get('#submit-btn-saverecord').click()

            cy.editRecordFor('unique_action_tag', 2)
            //cy.visit(path_redcap + '/DataEntry/index.php?page=unique_action_tag&id=2&pid=' + data_em.em_test_pid)
            cy.get('input[name="unique_strict"]').clear().type("bar2")
            cy.get('body').click(0,0);
            cy.get('#suf_warning_dialog').should('be.visible')
        })

        it('blocks duplicates for @UNIQUE-STRICT (same-record)', () => {
            //  close warning
            cy.get('[aria-describedby="suf_warning_dialog"] .ui-dialog-buttonpane button.ui-button').click()

            cy.get('input[name="helper_unique_strict"').clear().type("bar3")
            cy.get('input[name="unique_strict"]').clear().type("bar3")
            cy.get('body').click(0,0);
            cy.get('input[name="unique_strict"]').should('have.class', 'has-duplicate-warning')
            cy.get('input[name="helper_unique_strict"]').should('have.class', 'has-duplicate-warning')
        })
    })


    /**
     * Repeat Survey Link
     * todo
     * 
     * @since 1.0.0
     * 
     */
    context('Repeat Survey Link', () => {

        it('is enabled', () => {
            cy.moduleIsEnabled('Repeat Survey Link')
        })

        it('links to next instance (1=>2)', () => {     
            
            //  Add instance 1
            cy.editRecordFor('repeat_survey_link')
            cy.saveRecord()

            //  Check first rsl
            cy.editRecordFor('base')
            cy.get('input[name="helper_rsl"]').invoke('val').then((rsl) => {
                cy.visit(rsl)
                cy.get('input[name="rsl_current_instance"]').should('have.value', 2)
                cy.get('input[name="rsl_last_instance"]').should('have.value', 1)
            })
        })

        it('links to next instance (2=>3)', () => {     
            
            //  Add instance 1
            cy.editRecordFor('repeat_survey_link',1,2)
            cy.saveRecord()

            //  Check first rsl
            cy.editRecordFor('base')
            cy.get('input[name="helper_rsl"]').invoke('val').then((rsl) => {
                cy.visit(rsl)
                cy.get('input[name="rsl_current_instance"]').should('have.value', 3)
                cy.get('input[name="rsl_last_instance"]').should('have.value', 2)
            })
        })

    })



    /**
     * Export Data Dictionary Changes
     * to do
     * 
     * @since 1.0.0
     */

    /**
     * Address Auto Complete
     * Description: Example implementation of Ontology Provider add in 8.8.1. 
     * This module allows a site wide set of code/displays to defined and then referenced as an ontology.
     * 
     * @since 1.0.0
     */
     context('Address Auto Complete', () => {

        it('is enabled', () => {
            cy.moduleIsEnabled('Address Auto Complete')

            //  Set advanced_save = false in module configuration
            cy.visit(path_redcap + '/ExternalModules/manager/project.php?pid=' + data_em.em_test_pid)
            cy.get('tr[data-module="address_auto_complete"]').find('.external-modules-configure-button').click()
            cy.get('input[name="enable-advanced-save"]').uncheck({force:true})
            cy.saveModuleConfig();

        })

        it('auto completes on Data Entry Page simple.', () => {
           
            cy.editRecordFor('address_auto_complete')
            cy.get('#address-auto-complete-aac_field_1').type('Kreuzstrasse 2, 4123');
            cy.get('ul.ui-autocomplete').find('li.ui-menu-item .ui-menu-item-wrapper').first().click()

            cy.get('input[name="aac_meta_1"]').should(($meta) => {
                expect($meta.val()).to.contain('608402.1875, 267696.15625')
            });
        })

        it('auto completes on Survey Page simple', () => {
            //  Logout + Open Survey
            cy.get('input[name="aac_survey_url"]').invoke('val').then( (aac_survey_url) => {
                cy.logout()
                cy.visit(aac_survey_url)
                cy.get('#address-auto-complete-aac_field_1').type('Kreuzstrasse 2, 4123');
                cy.get('ul.ui-autocomplete').find('li.ui-menu-item .ui-menu-item-wrapper').first().click()
                cy.get('input[name="aac_meta_1"]').should('contain.value', '608402.1875, 267696.15625')
            })
        })

        it('auto completes on Data Entry Page advanced.', () => {
            
            cy.login()
            //  Set advanced_save = true in module configuration
            cy.visit(path_redcap + '/ExternalModules/manager/project.php?pid=' + data_em.em_test_pid)
            cy.get('tr[data-module="address_auto_complete"]').find('.external-modules-configure-button').click()
            cy.get('input[name="enable-advanced-save"]').check({force:true})
            cy.get('#external-modules-configure-modal').find('.modal-footer button.save').click()

            cy.editRecordFor('address_auto_complete')
            cy.get('#address-auto-complete-aac_field_1').type('Kreuzstrasse 2, 4123');
            cy.get('ul.ui-autocomplete').find('li.ui-menu-item .ui-menu-item-wrapper').first().click()
            
            cy.get('input[name="aac_meta_1"]').should('contain.value', '608402.1875, 267696.15625')
            cy.get('input[name="aac_street_1"]').should('have.value', 'Kreuzstrasse')
            cy.get('input[name="aac_number_1"]').should('have.value', '2')
            cy.get('input[name="aac_code_1"]').should('have.value', '4123')
            cy.get('input[name="aac_city_1"]').should('have.value', 'Allschwil')
        })

        it('auto completes on Survey Page advanced.', () => {
            //  Logout + Open Survey
            cy.get('input[name="aac_survey_url"]').invoke('val').then( (aac_survey_url) => {
                cy.logout()
                cy.visit(aac_survey_url)
                cy.get('#address-auto-complete-aac_field_1').type('Kreuzstrasse 2, 4123');
                cy.get('ul.ui-autocomplete').find('li.ui-menu-item .ui-menu-item-wrapper').first().click()
                
                cy.get('input[name="aac_meta_1"]').should('contain.value', '608402.1875, 267696.15625')
                cy.get('input[name="aac_street_1"]').should('have.value', 'Kreuzstrasse')
                cy.get('input[name="aac_number_1"]').should('have.value', '2')
                cy.get('input[name="aac_code_1"]').should('have.value', '4123')
                cy.get('input[name="aac_city_1"]').should('have.value', 'Allschwil')
            })
            cy.login()
        })

        it('can input Custom Address', () => {
            //  Presumes that "Custom Address" is enabled
            cy.editRecordFor('address_auto_complete')
            cy.get('#address-auto-complete-aac_field_1').type('foobar')
            cy.get('#aac-status-aac_field_1').should('contain.text', 'Nothing found.')
            cy.get('#aac-custom-address-btn-aac_field_1').should('be.visible').click()
            cy.wait(1500)
            cy.get('#custom-address-modal').should('be.visible')
            cy.wait(500)
            //  Presumes that advanced save is enabled
            cy.get('input#custom-street').type('custom street')            
            cy.get('input#custom-number').type('custom number')
            cy.get('input#custom-city').type('custom city')
            cy.get('input#custom-code').type('custom code')
            cy.get('input#custom-country').type('custom country')
            cy.get('input#custom-note').type('custom note')

            cy.get('#custom-address-form .modal-footer .btn-primary').click()

            cy.get('input[name="aac_meta_1"]').should('have.value', '')
            cy.get('input[name="aac_street_1"]').should('have.value', 'custom street')
            cy.get('input[name="aac_number_1"]').should('have.value', 'custom number')
            cy.get('input[name="aac_code_1"]').should('have.value', 'custom code')
            cy.get('input[name="aac_city_1"]').should('have.value', 'custom city')
            cy.get('input[name="aac_country_1"]').should('have.value', 'custom country')
            cy.get('input[name="aac_note_1"]').should('have.value', 'custom note')

        })
    })

    /**
     * Record Home Dashboard
     * todo
     * 
     * @since 1.0.0
     */


    /**
     * Add Instance on Save
     * Add new instance to a record of a repeating instance by saving any field on any project. 
     * Additionally, define piping fields to set the initial values of fields within the newly added instance.
     * 
     * @since 1.0.0    
     */
     context('Add Instance on Save', () => {

        it('is enabled', () => {
            cy.moduleIsEnabled('Add Instance on Save')

            //  Reset record=1 and add clean record to be in sync with #test EM project
            cy.deleteRecord(1, data_em.cross_test_pid)
            cy.editRecordFor('base',1,1, data_em.cross_test_pid)
            cy.saveRecord()

            //  Trigger AIOS
            cy.editRecordFor('base')
            cy.get('input[name="helper_aios"]').clear().type('test-aios-input')
            cy.saveRecord()
        })

        it('add first instance on save in same project', () => {
            cy.editRecordFor('add_instance_on_save',1,1)
            cy.get('input[name="aios_current_instance"]').should('have.value', 1)
            cy.get('input[name="aios_pipe_target"]').should('have.value', 'test-aios-input')
        })

        it('add first instance on save in cross project', () => {
            cy.editRecordFor('add_instance_on_save',1,1, data_em.cross_test_pid)
            cy.get('input[name="aios_current_instance"]').should('have.value', 1)
            cy.get('input[name="aios_pipe_target"]').should('have.value', 'test-aios-input')
        })
    })


    /**
     * Cross-Project Piping
     * 
     * 
     * @since 1.0.0
     */
    context('Cross-Project Piping', () => {

        it('is enabled', () => {
            cy.moduleIsEnabled('Cross-Project Piping')

        })

        it('pipes all records on button click', () => {
            //  Reset EM project
            cy.deleteRecord(1)
            cy.editRecordFor('base')
            cy.saveRecord()

            //  Reset Cross Project
            cy.deleteRecord(1, data_em.cross_test_pid)
            cy.editRecordFor('crossproject_piping',1,1, data_em.cross_test_pid)

            //  Trigger CCP
            cy.get('input[name="ccp_source"]').type('foo-cpp')
            cy.saveRecord()
            cy.visit(path_redcap + '/DataEntry/record_status_dashboard.php?pid=' + data_em.em_test_pid)
            cy.get('#pipe_all_records').click()

            //  Check piping
            cy.editRecordFor('crossproject_piping')
            cy.get('input[name="cpp_target"]').should('have.value', 'foo-cpp')
        })

    })

    /**
     * 
     * Date Calculated Fields
     * Allows for piping from date fields to other date fields, regardless of format. 
     * Can pipe data across events within a REDCap project.
     * 
     * @since 1.0.0
     */
    context('Date Calculated Fields', () => {

        it('is enabled', () => {
            cy.moduleIsEnabled('Date Calculated Fields')
            cy.editRecordFor('date_calculated_fields')
            cy.get('input[name="dcf_source"]').type('13-05-2022')
            cy.get('body').click(0,0)
        })

        it('adds 1 day', () => {
            cy.get('input[name="dcf_target_1"]').should('have.value', '13-05-2022')
        })

        it('adds 1 month', () => {
            cy.get('input[name="dcf_target_2"]').should('have.value', '12-06-2022')
        })
    }) 



})

