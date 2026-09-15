import type { Preview } from '@storybook/react-vite'
import { addons } from 'storybook/preview-api'
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events'
import '../src/styles/tailwind.css'

// The decorator below only runs when a story renders, so MDX pages with no stories (Introduction,
// Token/Theme) never got data-theme. Following the globals on the channel covers those pages too.
const applyTheme = ({ globals }: { globals: Record<string, unknown> }) => {
  document.documentElement.setAttribute('data-theme', (globals.theme as string | undefined) ?? 'light')
}
addons.getChannel().on(SET_GLOBALS, applyTheme)
addons.getChannel().on(GLOBALS_UPDATED, applyTheme)

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },

    options: {
      storySort: {
        order: [
          'Introduction',
          'Foundations',
          ['Colors', 'Icons'],
          'Token',
          ['Typography', 'Elevation', 'Border', 'Spacing', 'Breakpoints', 'Motion', 'Theme'],
          'Components',
          [
            'Button',
            'ButtonGroup',
            'Breadcrumb',
            'TopNav',
            'SideNav',
            'Drawer',
            'Badge',
            'Input',
            [
              'TextInput',
              'Select',
              'TextArea',
              'SearchInput',
              'PasswordInput',
              'CounterInput',
              'ColorInput',
              'PhoneNumberInput',
              'OTPInput',
            ],
            'Checkbox',
            ['Checkbox', 'CheckboxGroup'],
            'Table',
            'Combobox',
            'FilterDropdown',
            'FilterChip',
            'DatePicker',
            'DateFilter',
            'Filters',
            ['FilterBar', 'AllFiltersPanel'],
            'ColumnCustomizer',
            'BulkActionBar',
          ],
          '*',
        ],
      },
    },
  },

  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: 'light',
  },

  decorators: [
    (Story, context) => {
      document.documentElement.setAttribute('data-theme', context.globals.theme ?? 'light')
      return <Story />
    },
  ],
};

export default preview;
