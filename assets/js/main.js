/**
 * Luminary Theme - Vanilla JavaScript
 * Zero external dependencies. Fast, accessible, and lightweight.
 */

(function () {
  'use strict';

  // Mobile Navigation Menu Toggle
  function initMobileMenu() {
    var toggleBtn = document.querySelector('.menu-toggle');
    var nav = document.getElementById('site-navigation');

    if (!toggleBtn || !nav) return;

    toggleBtn.addEventListener('click', function () {
      var isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', !isExpanded);
      nav.classList.toggle('is-active');

      if (!isExpanded) {
        toggleBtn.setAttribute('aria-label', 'Close menu');
      } else {
        toggleBtn.setAttribute('aria-label', 'Open menu');
      }
    });

    // Close when clicking outside
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !toggleBtn.contains(e.target) && nav.classList.contains('is-active')) {
        nav.classList.remove('is-active');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close with Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-active')) {
        nav.classList.remove('is-active');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.focus();
      }
    });
  }

  // Header scroll appearance
  function initHeaderScroll() {
    var header = document.getElementById('masthead');
    if (!header) return;

    var handleScroll = function () {
      if (window.scrollY > 20) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // Back to Top button
  function initBackToTop() {
    var backBtn = document.querySelector('.back-to-top');
    if (!backBtn) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        backBtn.classList.add('is-visible');
      } else {
        backBtn.classList.remove('is-visible');
      }
    }, { passive: true });

    backBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Accessible dropdown focus management for sub-menus
  function initDropdownNav() {
    var menuItems = document.querySelectorAll('.main-navigation li.menu-item-has-children');
    
    menuItems.forEach(function (item) {
      var link = item.querySelector('a');
      var subMenu = item.querySelector('.sub-menu');
      if (!link || !subMenu) return;

      link.addEventListener('focus', function () {
        item.classList.add('focus');
      });

      var subLinks = subMenu.querySelectorAll('a');
      var lastSubLink = subLinks[subLinks.length - 1];

      if (lastSubLink) {
        lastSubLink.addEventListener('blur', function () {
          item.classList.remove('focus');
        });
      }
    });
  }

  // Initialize all modules on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHeaderScroll();
    initBackToTop();
    initDropdownNav();
  });

})();
