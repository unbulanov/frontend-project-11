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

const handleError = (error) => {
  if (error.isParseError) {
    return 'invalidRss';
  }
  if (error.request) {
    return 'networkError';
  }
  return error.message.key ?? 'unknown';
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
    input: document.querySelector('#url-input'),
    submit: document.querySelector('[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    postsContainer: document.querySelector('.posts'),
    feedsContainer: document.querySelector('.feeds'),
    modalHeader: document.querySelector('.modal-title'),
    modalBody: document.querySelector('.modal-body'),
    modalFooter: document.querySelector('.full-article'),
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
        const addedLink = watchedState.feeds.map((feed) => feed.link);
        const schema = validater(addedLink);
        const formData = new FormData(e.target);
        const userLink = formData.get('url');
        schema
          .validate(userLink)
          .then(() => {
            watchedState.form.status = 'valid';
            watchedState.form.error = null;
            return axios.get(routes(userLink));
          })
          .then((response) => {
            const data = parse(response.data.contents, userLink);
            preparingDataStorage(data, watchedState);
            watchedState.form.status = 'added';
          })
          .catch((error) => {
            watchedState.form.error = handleError(error);
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
