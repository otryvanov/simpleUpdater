<?php

class simpleUpdaterCheckProcessor extends modProcessor
{
    public $languageTopics = array('simpleupdater');

    public function checkPermissions()
    {
        return $this->modx->user->isMember('Administrator');
    }

    public function process()
    {
        $corePath = $this->modx->getOption('simpleupdater.core_path', null, $this->modx->getOption('core_path') . 'components/simpleupdater/');
        /** @var simpleUpdater $simpleupdater */
        $simpleupdater = $this->modx->getService('simpleupdater', 'simpleUpdater', $corePath . 'model/simpleupdater/', array(
            'core_path' => $corePath
        ));

        $object = array(
            'success' => true,
            'show_button' => false,
            'connector_url' => $simpleupdater->getOption('connectorUrl')
        );
        $ttl = 6 * 60 * 60;
        $registry = $this->modx->getService('registry', 'registry.modRegistry');
        $registry = $registry->getRegister('user', 'registry.modDbRegister');
        $registry->connect();
        $topic = '/simpleUpdater/';
        $registry->subscribe($topic . 'version');
        $versionsData = array_shift($registry->read(array('poll_limit' => 1, 'remove_read' => false)));
        if (empty($versionsData)) {
            $contents = $simpleupdater->requestUrl('https://api.github.com/repos/modxcms/revolution/tags', true);
            $contents = $this->modx->fromJSON($contents);
            if (empty($contents)) {
                $object['success'] = false;
                return $this->failure('', $object);
            } else {
                $versions = array();
                foreach ($contents as $key => $content) {
                    $name = substr($content['name'], 1);
                    if (strpos($name, 'pl') === false) {
                        unset($contents[$key]);
                        continue;
                    }
                    $versions[] = array(
                        'version' => $name,
                        'changelog_url' => 'https://raw.githubusercontent.com/modxcms/revolution/' . $content['name'] . '/core/docs/changelog.txt'
                    );
                }
                $contents = array_values($contents);
                $maxVersion = 0;
                foreach ($versions as $version) {
                    if (!$maxVersion || version_compare($maxVersion, $version['version']) < 0) {
                        $maxVersion = $version['version'];
                    }
                }
                $registry->subscribe($topic);
                $registry->send(
                    $topic,
                    array('versions' => $versions, 'max_version' => $maxVersion),
                    array('ttl' => $ttl)
                );
            }
        } else {
            $versions = $versionsData['versions'];
            $maxVersion = $versionsData['max_version'];
        }
        $this->modx->getVersionData();
        // Build current version string properly for MODX 2.8.x
        $currentVersion = 'v' . $this->modx->version['version'] . '-' . $this->modx->version['patch_level'];
        
        $availableVersions = array();
        foreach ($versions as $version) {
            if (version_compare($currentVersion, $version['version'], '<')) {
                $availableVersions[] = $version;
            }
        }
        
        // Always show button for administrators, even if no update is available
        // This allows users to see the version selector and manually choose a version
        $object['show_button'] = true;
        $object['versions'] = $versions;
        $object['current_version'] = $currentVersion;
        if (!empty($availableVersions)) {
            $object['has_update'] = true;
        } else {
            $object['has_update'] = false;
        }
        if (!$object['success']) {
            $o = $this->failure('', $object);
        } else {
            $o = $this->success('', $object);
        }
        return $o;
    }

}

return 'simpleUpdaterCheckProcessor';
