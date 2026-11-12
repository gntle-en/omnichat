import React, { useCallback, useState } from 'react';
import { useAtom } from 'jotai';
import {
  Box,
  Text,
  IconButton,
  Icon,
  Icons,
  Scroll,
  Switch,
  Button,
  TextArea,
  color,
  toRem,
} from 'folds';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../styles.css';
import { SettingTile } from '../../../components/setting-tile';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import {
  AccountDataEditor,
  AccountDataSubmitCallback,
} from '../../../components/AccountDataEditor';
import { copyToClipboard } from '../../../utils/dom';
import { AccountData } from './AccountData';
import {
  backendExtensionsOverrideAtom,
  useBackendExtensions,
} from '../../../hooks/useBackendExtensions';
import {
  EXAMPLE_DEVELOPER_MANIFEST,
  parseBackendExtensionsJson,
} from '../../../../util/backendExtensions';

type DeveloperToolsProps = {
  requestClose: () => void;
};
export function DeveloperTools({ requestClose }: DeveloperToolsProps) {
  const mx = useMatrixClient();
  const [developerTools, setDeveloperTools] = useSetting(settingsAtom, 'developerTools');
  const [expand, setExpend] = useState(false);
  const [accountDataType, setAccountDataType] = useState<string | null>();
  const [overrideJson, setOverrideJson] = useAtom(backendExtensionsOverrideAtom);
  const [draftJson, setDraftJson] = useState(overrideJson);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const activeExtensions = useBackendExtensions();

  const submitAccountData: AccountDataSubmitCallback = useCallback(
    async (type, content) => {
      await mx.setAccountData(type as Parameters<typeof mx.setAccountData>[0], content as never);
    },
    [mx]
  );

  if (accountDataType !== undefined) {
    return (
      <AccountDataEditor
        type={accountDataType ?? undefined}
        content={
          accountDataType
            ? mx
                .getAccountData(accountDataType as Parameters<typeof mx.getAccountData>[0])
                ?.getContent()
            : undefined
        }
        submitChange={submitAccountData}
        requestClose={() => setAccountDataType(undefined)}
      />
    );
  }

  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              Developer Tools
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
                <Text size="L400">Options</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  <SettingTile
                    title="Enable Developer Tools"
                    after={
                      <Switch
                        variant="Primary"
                        value={developerTools}
                        onChange={setDeveloperTools}
                      />
                    }
                  />
                </SequenceCard>
                {developerTools && (
                  <SequenceCard
                    className={SequenceCardStyle}
                    variant="SurfaceVariant"
                    direction="Column"
                    gap="400"
                  >
                    <SettingTile
                      title="Access Token"
                      description="Copy access token to clipboard."
                      after={
                        <Button
                          onClick={() =>
                            copyToClipboard(mx.getAccessToken() ?? '<NO_ACCESS_TOKEN_FOUND>')
                          }
                          variant="Secondary"
                          fill="Soft"
                          size="300"
                          radii="300"
                          outlined
                        >
                          <Text size="B300">Copy</Text>
                        </Button>
                      }
                    />
                  </SequenceCard>
                )}
              </Box>
              {developerTools && (
                <>
                  <Box direction="Column" gap="100">
                    <Text size="L400">Backend Extensions & AI Agents Override</Text>
                    <SequenceCard
                      className={SequenceCardStyle}
                      variant="SurfaceVariant"
                      direction="Column"
                      gap="300"
                    >
                      <SettingTile
                        title="Active Manifest Summary"
                        description={`Deleted messages: ${
                          activeExtensions.deletedMessages.mode
                        } · Send Later: ${
                          activeExtensions.sendLater.enabled
                            ? activeExtensions.sendLater.transport
                            : 'off'
                        } · Actions: ${activeExtensions.actions.length} · Sources: ${
                          activeExtensions.sources.length > 0
                            ? activeExtensions.sources.join(', ')
                            : 'defaults'
                        }`}
                      />
                      <TextArea
                        value={draftJson}
                        onChange={(e) => {
                          setDraftJson(e.currentTarget.value);
                          setOverrideError(null);
                        }}
                        placeholder='{"schemaVersion": 1, "deletedMessages": {"mode": "inline-red"}, "sendLater": {"enabled": true}}'
                        rows={8}
                        resize="Vertical"
                        variant="Secondary"
                        radii="300"
                        outlined
                        style={{ fontFamily: 'monospace', fontSize: toRem(12) }}
                      />
                      {overrideError && (
                        <Text size="T200" style={{ color: color.Critical.Main }}>
                          {overrideError}
                        </Text>
                      )}
                      <Box gap="200" wrap="Wrap" justifyContent="End">
                        <Button
                          type="button"
                          size="300"
                          variant="Secondary"
                          fill="Soft"
                          radii="300"
                          onClick={() => {
                            const formatted = JSON.stringify(EXAMPLE_DEVELOPER_MANIFEST, null, 2);
                            setDraftJson(formatted);
                            setOverrideError(null);
                          }}
                        >
                          <Text size="B300">Load Example</Text>
                        </Button>
                        {overrideJson && (
                          <Button
                            type="button"
                            size="300"
                            variant="Critical"
                            fill="Soft"
                            radii="300"
                            onClick={() => {
                              setDraftJson('');
                              setOverrideJson('');
                              setOverrideError(null);
                            }}
                          >
                            <Text size="B300">Clear Override</Text>
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="300"
                          variant="Primary"
                          fill="Solid"
                          radii="300"
                          onClick={() => {
                            const parsed = parseBackendExtensionsJson(draftJson);
                            if (parsed.error) {
                              setOverrideError(parsed.error);
                              return;
                            }
                            setOverrideError(null);
                            setOverrideJson(draftJson.trim());
                          }}
                        >
                          <Text size="B300">Apply Override</Text>
                        </Button>
                      </Box>
                    </SequenceCard>
                  </Box>
                  <AccountData
                    expand={expand}
                    onExpandToggle={setExpend}
                    onSelect={setAccountDataType}
                  />
                </>
              )}
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
