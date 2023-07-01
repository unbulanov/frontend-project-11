// eslint-disable-next-line import/no-extraneous-dependencies
import uniqueId from 'lodash/uniqueId';

export default (state, response, type, currentId) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(response.contents, 'text/xml');
    const item = doc.querySelectorAll('item');
    if (type === 'new') {
      const channel = document.querySelector('channel');
      const mainTitle = channel.querySelector('title').textContent;
      const mainDescription = channel.querySelector('description').textContent;
      state.feeds.push({
        id: currentId, title: mainTitle, description: mainDescription,
      });

      item.forEach((items) => {
        const title = items.querySelector('title').textContent;
        const description = items.querySelector('description').textContent;
        const link = items.querySelector('link').textContent;
        const uniqId = uniqueId();
        state.posts.push({
          feedId: currentId, id: uniqId, title, description, link,
        });
      });
    }
    if (type === 'existing') {
      const existPosts = state.posts.filter(({ feedId }) => feedId === currentId);
      const existPostsTitles = existPosts.map(({ title }) => title);
      const newPosts = Array.from(item).filter((items) => {
        const title = items.querySelector('title').textContent;
        return !existPostsTitles.includes(title);
      });
      newPosts.forEach((post) => {
        const title = post.querySelector('title').textContent;
        const description = post.querySelector('description').textContent;
        const link = post.querySelector('link').textContent;
        const uniqId = uniqueId();
        state.trackingPosts.push({
          feedId: currentId, id: uniqId, title, description, link,
        });
        state.posts.push({
          feedId: currentId, id: uniqId, title, description, link,
        });
      });
    }
  } catch (err) {
    state.parsingErrors.push(err);
    throw new Error();
  }
};
