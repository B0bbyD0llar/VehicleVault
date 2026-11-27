import React from 'react';

/**
 * Replaces `{name}` placeholders in a translated text with React nodes (links, bold text, code), so each
 * language keeps its own word order around them. Unknown placeholders stay as they are.
 */
export const fillSlots = (text: string, slots: Record<string, React.ReactNode>) =>
  text.split(/(\{\w+\})/).map((part, i) => {
    const name = part.match(/^\{(\w+)\}$/)?.[1];
    return <React.Fragment key={i}>{name && name in slots ? slots[name] : part}</React.Fragment>;
  });
