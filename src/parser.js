// eslint-disable-next-line import/no-extraneous-dependencies
import uniqueId from 'lodash/uniqueId';

export default (state, data, currentId) => {
  try {
    const parser = new DOMParser();
    const document = parser.parseFromString(data.contents, 'text/xml');
    const items = document.querySelectorAll('item');
    const channel = document.querySelector('channel');
    const mainTitle = channel.querySelector('title').textContent;
    const mainDescription = channel.querySelector('description').textContent;
    state.feeds.push({
      id: currentId, title: mainTitle, description: mainDescription,
    });

    items.forEach((item) => {
      const title = item.querySelector('title').textContent;
      const description = item.querySelector('description').textContent;
      const link = item.querySelector('link').textContent;
      const uniqId = uniqueId();
      state.posts.push({
        feedId: currentId, id: uniqId, title, description, link,
      });
    });
  } catch (err) {
    state.parsingErrors.push(err);
    throw new Error();
  }
};
