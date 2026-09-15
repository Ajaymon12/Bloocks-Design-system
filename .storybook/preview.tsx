import type { Preview } from '@storybook/react-vite'
import '../src/styles/tailwind.css'

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
          'Foundations',
          ['Colors', 'Icons'],
          'Token',
          ['Typography', 'Elevation', 'Border', 'Spacing', 'Breakpoints', 'Motion', 'Theme'],
          'Components',
          [
            'Button',
            'ButtonGroup',
            'Breadcrumb',
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
            'ColumnCustomizer',
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
