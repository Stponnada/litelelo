// mock react-native
const RN = jest.requireActual('react-native');
module.exports = {
  ...RN,
  Platform: {
    ...RN.Platform,
    OS: 'web',
    select: jest.fn(options => options.web || options.default)
  },
  NativeModules: {
    ...RN.NativeModules,
  }
};