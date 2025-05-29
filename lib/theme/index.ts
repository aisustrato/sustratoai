import { generateButtonTokens } from "./components/button-tokens";
import { generateInputTokens } from "./components/input-tokens";
import { generateTextTokens } from "./components/text-tokens";
import { navTokens } from "./components/nav-tokens";
import { colorTokens } from "./color-tokens";
import { sizeTokens } from "./size-tokens";
import { createAppColorTokens } from "./ColorToken";

// Create default app color tokens
const defaultAppColorTokens = createAppColorTokens("blue", "light");

// Generate default tokens for each component
const buttonTokens = generateButtonTokens(defaultAppColorTokens, "light");
const inputTokens = generateInputTokens(defaultAppColorTokens, "light");
const textTokens = generateTextTokens(defaultAppColorTokens, "light");

// For now, we'll use empty objects for the missing token generators
const cardTokens = {} as any;
const checkTokens = {} as any;
const selectTokens = {} as any;
const textareaTokens = {} as any;

export const theme = {
  components: {
    button: buttonTokens,
    card: cardTokens,
    checkbox: checkTokens,
    input: inputTokens,
    select: selectTokens,
    textarea: textareaTokens,
    text: textTokens,
    navbar: navTokens,
  },
  color: colorTokens,
  size: sizeTokens,
};

export type Theme = typeof theme;
