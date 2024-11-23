import { Dimensions } from 'react-native';

const { width: deviceWidth, height: devideHeight } = Dimensions.get('window');

export const hp = (percentage) => {
  return (percentage * devideHeight) / 100;
};

export const wp = (percentage) => {
  return (percentage * deviceWidth) / 100;
};

export const stripHtmlTags = (html) => {
  return html.replace(/<[^>]*>?/gm, '');
};
