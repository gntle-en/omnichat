import React, { FormEvent, useState } from 'react';
import {
  Box,
  Button,
  Header,
  Icon,
  IconButton,
  Icons,
  Input,
  Line,
  Menu,
  MenuItem,
  PopOut,
  RectCords,
  Text,
  Tooltip,
  TooltipProvider,
  color,
  config,
  toRem,
} from 'folds';
import FocusTrap from 'focus-trap-react';

import { computeScheduleDelayMs, SendLaterConfig } from '../../util/backendExtensions';

type SendLaterButtonProps = {
  sendLaterConfig: SendLaterConfig;
  disabled?: boolean;
  onSchedule: (delayMs: number) => Promise<string | null>;
};

/**
 * Clock trigger + PopOut menu for scheduling messages via MSC4140 delayed events
 * or a configured backend http_rpc scheduler.
 */
export function SendLaterButton({ sendLaterConfig, disabled, onSchedule }: SendLaterButtonProps) {
  const [anchorCords, setAnchorCords] = useState<RectCords>();
  const [customDateTime, setCustomDateTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  if (!sendLaterConfig.enabled) return null;

  const handlePickDelay = async (delayMs: number) => {
    if (busy) return;
    setBusy(true);
    setStatusError(null);
    const err = await onSchedule(delayMs);
    setBusy(false);
    if (err) {
      setStatusError(err);
    } else {
      setAnchorCords(undefined);
      setCustomDateTime('');
    }
  };

  const handleCustomSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    const delayMs = computeScheduleDelayMs(customDateTime);
    if (delayMs === null) {
      setStatusError('Pick a time at least 5 seconds in the future.');
      return;
    }
    handlePickDelay(delayMs);
  };

  return (
    <PopOut
      anchor={anchorCords}
      position="Top"
      align="End"
      offset={6}
      content={
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: () => setAnchorCords(undefined),
            clickOutsideDeactivates: true,
          }}
        >
          <Menu style={{ minWidth: toRem(240), maxWidth: toRem(300) }}>
            <Header
              size="300"
              variant="Surface"
              style={{ padding: `${config.space.S200} ${config.space.S300}` }}
            >
              <Box alignItems="Center" gap="200">
                <Icon size="100" src={Icons.Clock} />
                <Text size="L400">Send Later</Text>
              </Box>
            </Header>
            <Box direction="Column" gap="100" style={{ padding: config.space.S200 }}>
              {sendLaterConfig.presets.map((preset) => (
                <MenuItem
                  key={preset.id}
                  size="300"
                  radii="300"
                  disabled={busy}
                  onClick={() => handlePickDelay(preset.delayMs)}
                >
                  <Text as="span" size="T300" truncate>
                    {preset.label}
                  </Text>
                </MenuItem>
              ))}
              <Line size="300" />
              <Box
                as="form"
                onSubmit={handleCustomSubmit}
                direction="Column"
                gap="200"
                style={{ padding: `${config.space.S100} 0` }}
              >
                <Text size="T200" priority="300">
                  Custom date & time
                </Text>
                <Input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.currentTarget.value)}
                  size="300"
                  variant="Secondary"
                  radii="300"
                  outlined
                />
                {statusError && (
                  <Text size="T200" style={{ color: color.Critical.Main }}>
                    {statusError}
                  </Text>
                )}
                <Button
                  type="submit"
                  size="300"
                  variant="Primary"
                  fill="Soft"
                  radii="300"
                  disabled={busy || !customDateTime.trim()}
                >
                  <Text size="B300">{busy ? 'Scheduling...' : 'Schedule'}</Text>
                </Button>
              </Box>
            </Box>
          </Menu>
        </FocusTrap>
      }
    >
      <TooltipProvider
        tooltip={
          <Tooltip>
            <Text>Send Later</Text>
          </Tooltip>
        }
      >
        {(triggerRef) => (
          <IconButton
            ref={triggerRef}
            aria-pressed={!!anchorCords}
            disabled={disabled}
            onClick={(evt) => {
              setStatusError(null);
              setAnchorCords(evt.currentTarget.getBoundingClientRect());
            }}
            variant="SurfaceVariant"
            size="300"
            radii="300"
          >
            <Icon src={Icons.Clock} filled={!!anchorCords} />
          </IconButton>
        )}
      </TooltipProvider>
    </PopOut>
  );
}
