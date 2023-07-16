const parsePosts = (post) => {
  const title = post.querySelector('title').textContent;
  const description = post.querySelector('description').textContent;
  const link = post.querySelector('link').textContent;
  return {
    link,
    title,
    description,
  };
};

const parse = (rss, url) => {
  const parser = new DOMParser();
  const data = parser.parseFromString(rss, 'text/xml');
  const parseError = data.querySelector('parsererror');
  if (parseError) {
    const error = new Error(parseError.textContent);
    error.isParseError = true;
    throw error;
  }
  const titleFeed = data.querySelector('title').textContent;
  const descriptionFeed = data.querySelector('description').textContent;
  const feed = {
    link: url,
    title: titleFeed,
    description: descriptionFeed,
  };
  const posts = [...data.querySelectorAll('item')].map(parsePosts);
  return { feed, posts };
};

export default parse;
