// eslint-disable-next-line import/no-extraneous-dependencies
import axios from 'axios';
import parser from './parser';

export default (state, url, feedId) => {
  const modifiedUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;
  const iter = () => {
    axios.get(modifiedUrl)
      .then((response) => parser(state, response.data, feedId))
      .catch((err) => console.error(err))
      .then(() => setTimeout(() => iter(), 5000));
  };
  setTimeout(() => iter(), 5000);
};
