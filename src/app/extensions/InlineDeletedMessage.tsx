import React from 'react';
import { MatrixEvent } from 'matrix-js-sdk';
import { Badge, Box, Icon, Icons, Text, color, config, toRem } from 'folds';

import { DeletedMessagesConfig } from '../../util/backendExtensions';
import { getRetainedDeletedContent } from './redactionCache';

type InlineDeletedMessageProps = {
  mEvent: MatrixEvent;
  deletedConfig: DeletedMessagesConfig;
};

/**
 * Renders a soft-deleted / redacted message cleanly inside the chat timeline
 * with Critical-tinted styling, optional retained text, and deletion reason.
 */
export function InlineDeletedMessage({ mEvent, deletedConfig }: InlineDeletedMessageProps) {
  const unsigned = mEvent.getUnsigned();
  const reason = unsigned.redacted_because?.content?.reason;
  const redactedBy = unsigned.redacted_because?.sender;
  const retained = deletedConfig.showRetainedContent
    ? getRetainedDeletedContent(mEvent)
    : { body: '', source: 'none' as const };

  return (
    <Box
      direction="Column"
      gap="100"
      style={{
        padding: `${config.space.S200} ${config.space.S300}`,
        borderRadius: config.radii.R300,
        backgroundColor: color.Critical.Container,
        borderLeft: `${toRem(3)} solid ${color.Critical.Main}`,
        borderTop: `${toRem(1)} solid ${color.Critical.ContainerLine}`,
        borderRight: `${toRem(1)} solid ${color.Critical.ContainerLine}`,
        borderBottom: `${toRem(1)} solid ${color.Critical.ContainerLine}`,
        color: color.Critical.OnContainer,
        opacity: 0.92,
      }}
    >
      <Box alignItems="Center" gap="200" wrap="Wrap">
        {deletedConfig.showBadge && (
          <Badge variant="Critical" fill="Soft" radii="300">
            <Box alignItems="Center" gap="100">
              <Icon size="50" src={Icons.Delete} />
              <Text as="span" size="T200" priority="500">
                Deleted
              </Text>
            </Box>
          </Badge>
        )}
        {redactedBy && redactedBy !== mEvent.getSender() && (
          <Text as="span" size="T200" priority="300">
            {`Removed by ${redactedBy}`}
          </Text>
        )}
        {deletedConfig.showReason && typeof reason === 'string' && reason.trim().length > 0 && (
          <Text as="span" size="T200" priority="300">
            {`Reason: ${reason}`}
          </Text>
        )}
      </Box>
      {retained.body ? (
        <Text
          size="T400"
          style={{
            color: color.Critical.OnContainer,
            textDecoration: 'line-through',
            textDecorationColor: color.Critical.Main,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {retained.body}
        </Text>
      ) : (
        <Text size="T300" priority="300" style={{ color: color.Critical.OnContainer }}>
          Message deleted
        </Text>
      )}
    </Box>
  );
}
