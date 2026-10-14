// SkillDocker Official Website Client Scripts
(function () {
  'use strict';

  // Language management
  var currentLang = 'zh';

  function initLanguage() {
    var saved = localStorage.getItem('skilldock_site_lang');
    if (saved === 'zh' || saved === 'en') {
      currentLang = saved;
    } else {
      var navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
      currentLang = navLang.indexOf('zh') !== -1 ? 'zh' : 'en';
    }
    applyLanguage(currentLang);
  }

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('skilldock_site_lang', lang);

    document.querySelectorAll('[data-i18n-zh]').forEach(function (el) {
      if (lang === 'zh') {
        el.textContent = el.getAttribute('data-i18n-zh');
      } else {
        el.textContent = el.getAttribute('data-i18n-en') || el.getAttribute('data-i18n-zh');
      }
    });

    document.querySelectorAll('.lang-switch').forEach(function (btn) {
      btn.textContent = lang === 'zh' ? 'English' : '中文';
    });

    // Update document lang attribute
    document.documentElement.lang = lang;

    // Update document title if present
    var titleEl = document.querySelector('title');
    if (titleEl) {
      var zhTitle = titleEl.getAttribute('data-i18n-zh');
      var enTitle = titleEl.getAttribute('data-i18n-en');
      if (zhTitle && enTitle) {
        document.title = lang === 'zh' ? zhTitle : enTitle;
      }
    }

    // Dispatch event so dynamic page components can re-render for current language
    try {
      window.dispatchEvent(new CustomEvent('site:languagechange', { detail: { lang: lang } }));
    } catch (e) {}
  }

  window.getSiteLanguage = function () {
    return currentLang;
  };

  window.toggleLanguage = function () {
    applyLanguage(currentLang === 'zh' ? 'en' : 'zh');
  };

  // Download button configuration initialization
  function initDownloadButton() {
    var dlButtons = document.querySelectorAll('.btn-download');
    var config = window.SKILLDOCKER_CONFIG || {};
    var url = (config.downloadUrl || '').trim();

    dlButtons.forEach(function (btn) {
      if (url) {
        btn.href = url;
        btn.classList.remove('btn-disabled');
        btn.setAttribute('data-i18n-zh', '立即下载 (桌面端)');
        btn.setAttribute('data-i18n-en', 'Download (Desktop)');
      } else {
        btn.removeAttribute('href');
        btn.classList.add('btn-disabled');
        btn.setAttribute('data-i18n-zh', '即将发布');
        btn.setAttribute('data-i18n-en', 'Coming Soon');
      }
    });

    applyLanguage(currentLang);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLanguage();
    initDownloadButton();
  });
})();
