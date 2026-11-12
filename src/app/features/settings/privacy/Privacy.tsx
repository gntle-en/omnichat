import React from 'react';
import { Box, Icon, IconButton, Icons, Scroll, Switch, Text } from 'folds';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SettingTile } from '../../../components/setting-tile';
import { SequenceCardStyle } from '../styles.css';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';

type PrivacyProps = {
  requestClose: () => void;
};
export function Privacy({ requestClose }: PrivacyProps) {
  const [hideActivity, setHideActivity] = useSetting(settingsAtom, 'hideActivity');
  const [urlPreview, setUrlPreview] = useSetting(settingsAtom, 'urlPreview');
  const [encUrlPreview, setEncUrlPreview] = useSetting(settingsAtom, 'encUrlPreview');
  const [clearUrls, setClearUrls] = useSetting(settingsAtom, 'clearUrls');

  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              Privacy
            </Text>
          </Box>
          <Box shrink="No">
            <IconButton onClick={requestClose} variant="Surface">
              <Icon src={Icons.Cross} />
            </IconButton>
          </Box>
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <Box direction="Column" gap="700">
              <Box direction="Column" gap="100">
                <Text size="L400">Presence</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile
                    title="Hide Typing & Read Receipts"
                    description="Turn off both typing status and read receipts to keep your activity private."
                    after={
                      <Switch variant="Primary" value={hideActivity} onChange={setHideActivity} />
                    }
                  />
                </SequenceCard>
              </Box>

              <Box direction="Column" gap="100">
                <Text size="L400">Link Previews</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile
                    title="Url Preview"
                    description="Show previews for URLs shared in unencrypted rooms."
                    after={<Switch variant="Primary" value={urlPreview} onChange={setUrlPreview} />}
                  />
                </SequenceCard>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile
                    title="Url Preview in Encrypted Room"
                    description="Allow requesting URL previews from your homeserver for links in encrypted rooms."
                    after={
                      <Switch variant="Primary" value={encUrlPreview} onChange={setEncUrlPreview} />
                    }
                  />
                </SequenceCard>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                >
                  <SettingTile
                    title="Clear URLs"
                    description="Automatically remove known tracking parameters from outgoing HTTP(S) links."
                    after={<Switch variant="Primary" value={clearUrls} onChange={setClearUrls} />}
                  />
                </SequenceCard>
              </Box>
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
