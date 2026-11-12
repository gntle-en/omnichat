import type { EmoteRoomsContent, PackContent } from '../../app/components/image-pack';
import type { InCinnySpacesContent } from '../../app/hooks/useSidebarItems';

declare module 'matrix-js-sdk/lib/@types/event.js' {
  interface StateEvents {
    'im.ponies.room_emotes': PackContent;
    'in.cinny.room.power_level_tags': Record<string, unknown>;
  }

  interface AccountDataEvents {
    'in.cinny.spaces': InCinnySpacesContent;
    'io.element.recent_emoji': {
      recent_emoji: Array<[string, number]>;
    };
    'im.ponies.user_emotes': PackContent;
    'im.ponies.emote_rooms': EmoteRoomsContent;
  }
}

declare module 'matrix-js-sdk/lib/@types/event.ts' {
  interface StateEvents {
    'im.ponies.room_emotes': PackContent;
    'in.cinny.room.power_level_tags': Record<string, unknown>;
  }

  interface AccountDataEvents {
    'in.cinny.spaces': InCinnySpacesContent;
    'io.element.recent_emoji': {
      recent_emoji: Array<[string, number]>;
    };
    'im.ponies.user_emotes': PackContent;
    'im.ponies.emote_rooms': EmoteRoomsContent;
  }
}
