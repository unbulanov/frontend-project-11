import * as yup from 'yup';
import i18n from 'i18next';
import onChange from 'on-change';
import axios from 'axios';
import uniqueId from 'lodash/uniqueId'
import ru from './locales/ru.js';
import parse from './parser.js';
import render from './render.js';
import refresh from './refresh.js';

export default () => {
  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: 'ru',
    resources: {
      ru,
    },
  });

  const state = {
    processState: 'filling',
    fields: {
      url: '',
    },
    feeds: [],
    posts: [],
    newFeedId: '',
    error: '',
    parsingErrors: [],
    addedUrls: [],
    trackingPosts: [],
    viewedPost: '',
  };
  const form = document.querySelector('form.rss-form');
  const watchedState = onChange(state, render(state, form, i18nInstance));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    state.fields.url = url;

    yup.setLocale({
      mixed: {
        notOneOf: i18nInstance.t('errors.addedRss'),
        required: i18nInstance.t('errors.empty'),
        default: i18nInstance.t('errors.invalidRss'),
      },
      string: {
        url: i18nInstance.t('errors.invalidUrl'),
      },
    });
    const schema = yup.object().shape({
      url: yup.string().url().nullable().notOneOf(state.addedUrls),
    });
    schema.validate(state.fields)
      .then(() => {
        const modifiedUrl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;
        return axios.get(modifiedUrl);
      })
      .then((response) => {
        const id = uniqueId();
        parse(watchedState, response.data, 'new', id);
        return id;
      })
      .then((id) => {
        watchedState.newFeedId = id;
        state.addedUrls.push(url);
        refresh(watchedState, url, i18nInstance, id);
      })
      .catch((err) => {
        watchedState.error = err;
      });
  });
};
