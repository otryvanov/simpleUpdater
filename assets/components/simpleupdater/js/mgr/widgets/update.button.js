function updateMODX() {
    if (!window.simpleUpdaterWindow) {
        simpleUpdaterWindow = new MODx.Window({
            id: 'simpleupdater-window',
            height: 500,
            width: 850,
            cloaseAction: 'hide',
            title: _('simpleupdater'),
            stateful: false,
            buttonAlign: 'right',
            layout: 'anchor',
            items: [{
                html: '<br><h3>' + _('simpleupdater_current_version') + ': ' + simpleUpdateConfig.current_version + '</h3>'
            }, {
                xtype: 'combo',
                fieldLabel: _('simpleupdater_select_version'),
                name: 'version',
                id: 'simpleupdater-version-select',
                mode: 'local',
                triggerAction: 'all',
                store: new Ext.data.SimpleStore({
                    fields: ['version', 'changelog_url'],
                    data: simpleUpdateConfig.versions
                }),
                valueField: 'version',
                displayField: 'version',
                anchor: '100%',
                listeners: {
                    select: function(combo, record) {
                        loadChangelog(record.data.changelog_url);
                    }
                }
            }, {
                xtype: 'textarea',
                name: 'changelog',
                fieldLabel: 'Changelog',
                id: 'simpleupdater-changelog-content',
                value: '',
                readOnly: true,
                height: 355,
                anchor: '100%',
                hidden: false
            }, {
                html: '<div class="loading-indicator" style="height: 355px; background-position: center center;"></div>',
                id: 'simpleupdater-update-loading',
                height: 355,
                anchor: '100%',
                hidden: true
            }],
            buttons: [{
                text: _('simpleupdater_update_start'),
                id: 'simpleupdater-update-start-btn',
                cls: 'primary-button',
                handler: function () {
                    var versionCombo = Ext.getCmp('simpleupdater-version-select');
                    var selectedVersion = versionCombo.getValue();
                    if (!selectedVersion) {
                        Ext.Msg.alert(_('warning'), _('simpleupdater_select_version_warning'));
                        return;
                    }
                    simpleUpdaterWindow._startupdate(selectedVersion);
                },
                scope: this
            }, {
                text: _('cancel'),
                handler: function () {
                    simpleUpdaterWindow.hide();
                },
                scope: this
            }],
            _startupdate: function (version) {
                Ext.get('simpleupdater-update-loading').show();
                MODx.Ajax.request({
                    url: simpleUpdateConfig.connector_url,
                    params: {
                        action: 'mgr/version/update',
                        version: version
                    },
                    listeners: {
                        success: {
                            fn: function () {
                                Ext.get('simpleupdater-update-loading').hide();
                                document.location.href = '/setup/';
                            }, scope: this
                        },
                        failure: {
                            fn: function (response) {
                                Ext.get('simpleupdater-update-loading').hide();
                                Ext.Msg.alert(_('error'), response.object.message);
                            }, scope: this
                        }
                    }
                });
            }
        });
        if (simpleUpdateConfig.versions && simpleUpdateConfig.versions.length > 0) {
            var combo = Ext.getCmp('simpleupdater-version-select');
            if (combo) {
                combo.select(0);
                var store = combo.getStore();
                if (store.getCount() > 0) {
                    var firstRecord = store.getAt(0);
                    loadChangelog(firstRecord.data.changelog_url);
                }
            }
        }
    }
    simpleUpdaterWindow.show(Ext.EventObject.target);
}

function loadChangelog(url) {
    Ext.get('simpleupdater-changelog-content').hide();
    Ext.get('simpleupdater-update-loading').show();
    MODx.Ajax.request({
        url: url,
        method: 'GET',
        listeners: {
            success: {
                fn: function(response) {
                    Ext.get('simpleupdater-update-loading').hide();
                    Ext.getCmp('simpleupdater-changelog-content').setValue(response.object);
                    Ext.get('simpleupdater-changelog-content').show();
                }, scope: this
            },
            failure: {
                fn: function(response) {
                    Ext.get('simpleupdater-update-loading').hide();
                    Ext.getCmp('simpleupdater-changelog-content').setValue('Error loading changelog');
                    Ext.get('simpleupdater-changelog-content').show();
                }, scope: this
            }
        }
    });
}

Ext.onReady(function () {
    if (simpleUpdateConfig.show_button) {
        var usermenuUl = document.getElementById('modx-user-menu'),
            firstLi = usermenuUl.firstChild,
            simpleUpdaterLi = document.createElement('LI');

        simpleUpdaterLi.innerHTML = '<span id="simpleupdater-link" class="x-btn x-btn-small primary-button" onclick="updateMODX()" style="margin: 10px;">' + _('simpleupdater_update') + '</span>';
        usermenuUl.insertBefore(simpleUpdaterLi, firstLi);
    }
});
