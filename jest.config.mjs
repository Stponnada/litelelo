/** @type {import('@jest/types').Config.InitialOptions} */
export default {
  rootDir: '.',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          '@babel/preset-typescript'
        ]
      }
    ]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/test/__mocks__/fileMock.js',
    '^../services/supabase$': '<rootDir>/__mocks__/supabase.ts',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^react-tweet$': '<rootDir>/__mocks__/react-tweet.ts'
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-router-dom|react-tweet)/)'
  ],
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@react-navigation|@ui-kitten|react-native-safe-area-context|react-native-vector-icons|@react-navigation/.*)/)'
  ],
  moduleDirectories: ['node_modules', '.'],
  testTimeout: 10000
};