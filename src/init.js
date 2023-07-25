/* eslint-disable no-param-reassign */
import onChange from 'on-change';
import 'bootstrap';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import { uniqueId, differenceBy } from 'lodash';
import resources from './locales/index.js';
import render from './render.js';
import parse from './parser.js';

const routes = (url) => {
  const proxyUrl = new URL('https://allorigins.hexlet.app/get');
  proxyUrl.searchParams.set('disableCache', 'true');
  proxyUrl.searchParams.set('url', url);
  return proxyUrl.toString();
};

const parseError = (error) => {
  if (error.isParseError) {
    return 'invalidRss';
  }
  if (error.isAxiosError) {
    return 'networkError';
  }
  return error.message.key ?? 'unknown';
};

const preparingDataStorage = (data, watchedState) => {
  const { feed, posts } = data;
  const feedsId = uniqueId();
  feed.id = feedsId;
  posts.forEach((post) => {
    post.id = uniqueId();
    post.feedId = feed.id;
  });
  watchedState.feeds.push(feed);
  watchedState.posts.push(...posts);
};

const updateRss = (watchedState) => {
  const promises = watchedState.feeds.map((feed) => axios
    .get(routes(feed.link))
    .then((response) => {
      const { posts } = parse(response.data.contents);
      const postFromState = watchedState.posts.filter((post) => post.feedId === feed.id);
      const newPosts = differenceBy(posts, postFromState, 'link');
      newPosts.forEach((post) => {
        post.id = uniqueId();
        post.feedId = feed.id;
      });
      watchedState.posts.unshift(...newPosts);
      return newPosts;
    })
    .catch((e) => {
      console.log(e.message);
    }));
  Promise.all(promises).then(() => setTimeout(updateRss, 5000, watchedState));
};

export default () => {
  yup.setLocale({
    string: {
      url: () => ({ key: 'invalidURL' }),
      required: () => ({ key: 'fields' }),
    },
    mixed: {
      notOneOf: () => ({ key: 'addedRss' }),
    },
  });
  const elements = {
    form: document.querySelector('.rss-form'),
    submit: document.querySelector('[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    input: document.querySelector('#url-input'),
    modalHeader: document.querySelector('.modal-title'),
    modalBody: document.querySelector('.modal-body'),
    modalFooter: document.querySelector('.full-article'),
    postsContainer: document.querySelector('.posts'),
    feedsContainer: document.querySelector('.feeds'),
  };

  const i18n = i18next.createInstance();
  i18n
    .init({
      lng: 'ru',
      resources,
    })
    .then(() => {
      const state = {
        form: {
          status: 'filling',
          error: null,
        },
        posts: [],
        feeds: [],
        uiState: {
          selectedPost: null,
          viewedPost: new Set(),
        },
      };
      const validater = (urls) => yup.string().required().url().notOneOf(urls);
      const watchedState = onChange(state, render(state, i18n, elements));
      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const addedUrls = watchedState.feeds.map((feed) => feed.link);
        const schema = validater(addedUrls);
        const formData = new FormData(e.target);
        const url = formData.get('url');
        schema
          .validate(url)
          .then(() => {
            watchedState.form.status = 'valid';
            watchedState.form.error = null;
            return axios.get(routes(url));
          })
          .then((response) => {
            const data = parse(response.data.contents, url);
            preparingDataStorage(data, watchedState);
            watchedState.form.status = 'filling';
          })
          .catch((error) => {
            watchedState.form.status = 'invalid';
            watchedState.form.error = parseError(error);
          });
      });

      elements.postsContainer.addEventListener('click', (e) => {
        const { dataset: { id } } = e.target;
        watchedState.uiState.viewedPost.add(id);
        watchedState.uiState.selectedPost = id;
      });

      updateRss(watchedState);
    });
};
