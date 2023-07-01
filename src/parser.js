import uniqueId from 'lodash/uniqueId';

export default (response) => {
  const parse = new DOMParser();
  const xmlContent = parse.parseFromString(response, 'text/xml');
  if (!xmlContent.querySelector('rss')) {
    return null;
  }

  const channel = xmlContent.querySelector('channel');
  const mainTitle = channel.querySelector('title').textContent;
  const mainDescription = channel.querySelector('description').textContent;
  const data = {
    mainTitle,
    mainDescription,
    posts: [],
  };
  const item = xmlContent.querySelector('item');
  item.forEach((items) => {
    const id = uniqueId();
    const title = items.querySelector('title');
    const link = items.querySelector('link').textContent;
    const description = items.querySelector('description').textContent;
    data.posts.push({
      title, description, id, link,
    });
  });
  return data;
};
