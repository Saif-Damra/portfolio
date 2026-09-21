(function () {
    'use strict';

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isFinePointer = window.matchMedia('(pointer: fine)').matches;

    /* ----------------------------------------------------------------
       Hero load-in: flips a class once the DOM is ready so the
       hero elements animate in on first paint instead of sitting
       hidden (see the .js .hero-* rules in style.css).
       ---------------------------------------------------------------- */
    (function heroReady() {
        function ready() {
            requestAnimationFrame(function () {
                document.documentElement.classList.add('is-ready');
            });
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', ready);
        } else {
            ready();
        }
    })();

    /* ----------------------------------------------------------------
       Theme
       ---------------------------------------------------------------- */
    (function theme() {
        var root = document.documentElement;
        var toggle = document.getElementById('theme-toggle');
        var metaTheme = document.querySelector('meta[name="theme-color"]');

        function current() {
            return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        }

        function applyMeta(mode) {
            if (metaTheme) {
                metaTheme.setAttribute('content', mode === 'dark' ? '#111111' : '#F6F3EE');
            }
        }

        function syncToggle(mode) {
            if (toggle) toggle.setAttribute('aria-pressed', String(mode === 'dark'));
        }

        applyMeta(current());
        syncToggle(current());

        if (toggle) {
            toggle.addEventListener('click', function () {
                var next = current() === 'dark' ? 'light' : 'dark';
                root.setAttribute('data-theme', next);
                try { localStorage.setItem('saif-theme', next); } catch (e) {}
                applyMeta(next);
                syncToggle(next);
            });
        }
    })();

    /* ----------------------------------------------------------------
       Mobile navigation
       ---------------------------------------------------------------- */
    (function nav() {
        var toggle = document.getElementById('menu-toggle');
        var menu = document.getElementById('nav-menu');
        if (!toggle || !menu) return;

        function open() {
            menu.classList.add('is-open');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', 'Close navigation');
        }
        function close() {
            menu.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Open navigation');
        }

        toggle.addEventListener('click', function () {
            if (menu.classList.contains('is-open')) close(); else open();
        });

        menu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', close);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menu.classList.contains('is-open')) {
                close();
                toggle.focus();
            }
        });
    })();

    /* ----------------------------------------------------------------
       Scroll: header state, progress bar, reveal-on-scroll, active nav
       ---------------------------------------------------------------- */
    (function scroll() {
        var header = document.getElementById('site-header');
        var progress = document.getElementById('scroll-progress');

        function onScroll() {
            if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
            if (progress) {
                var doc = document.documentElement;
                var max = doc.scrollHeight - doc.clientHeight;
                var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
                progress.style.width = pct + '%';
            }
        }
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        var reveals = document.querySelectorAll('.reveal, .rule');
        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            reveals.forEach(function (el) { el.classList.add('in-view'); });
        } else {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
            reveals.forEach(function (el) { io.observe(el); });
        }

        var sections = document.querySelectorAll('main section[id]');
        var navLinks = document.querySelectorAll('.nav-link');
        if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
            var navIo = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var id = entry.target.getAttribute('id');
                        navLinks.forEach(function (link) {
                            link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
                        });
                    }
                });
            }, { rootMargin: '-45% 0px -50% 0px' });
            sections.forEach(function (s) { navIo.observe(s); });
        }
    })();

    /* ----------------------------------------------------------------
       Count-up stats (hero proof numbers)
       ---------------------------------------------------------------- */
    (function counters() {
        var nodes = document.querySelectorAll('[data-count-to]');
        if (!nodes.length) return;

        function animate(el) {
            var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
            var suffix = el.getAttribute('data-suffix') || '';

            if (prefersReducedMotion) {
                el.textContent = target + suffix;
                return;
            }

            var duration = 1200;
            var start = null;

            function step(timestamp) {
                if (start === null) start = timestamp;
                var progress = Math.min((timestamp - start) / duration, 1);
                var eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(eased * target) + suffix;
                if (progress < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }

        if (!('IntersectionObserver' in window)) {
            nodes.forEach(animate);
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        nodes.forEach(function (el) { io.observe(el); });
    })();

    /* ----------------------------------------------------------------
       Custom cursor: a small dot that locks onto links/buttons and
       morphs into their shape (magnetic snap). Larger surfaces just
       get a soft glow. Fine-pointer devices only.
       ---------------------------------------------------------------- */
    (function cursor() {
        if (prefersReducedMotion || !isFinePointer) return;

        var el = document.createElement('div');
        el.className = 'cursor-magnet';
        document.body.appendChild(el);

        var mouseX = 0, mouseY = 0;
        var x = 0, y = 0, w = 10, h = 10, r = 5;
        var tw = 10, th = 10, tr = 5;
        var lockedX = null, lockedY = null;
        var active = false;

        function onMove(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!active) {
                active = true;
                document.documentElement.classList.add('cursor-active');
            }
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseleave', function () {
            active = false;
            document.documentElement.classList.remove('cursor-active');
        });

        function loop() {
            var goalX = lockedX !== null ? lockedX : mouseX;
            var goalY = lockedY !== null ? lockedY : mouseY;
            x += (goalX - x) * 0.22;
            y += (goalY - y) * 0.22;
            w += (tw - w) * 0.22;
            h += (th - h) * 0.22;
            r += (tr - r) * 0.22;
            el.style.width = w + 'px';
            el.style.height = h + 'px';
            el.style.borderRadius = r + 'px';
            el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);

        var snapTargets = 'a, button';

        document.addEventListener('mouseover', function (e) {
            var snap = e.target.closest && e.target.closest(snapTargets);
            if (snap) {
                var rect = snap.getBoundingClientRect();
                var actualRadius = parseFloat(getComputedStyle(snap).borderRadius) || 0;
                lockedX = rect.left + rect.width / 2;
                lockedY = rect.top + rect.height / 2;
                tw = rect.width + 12;
                th = rect.height + 12;
                tr = actualRadius > 0 ? Math.min(actualRadius + 4, th / 2) : th / 2;
                el.classList.add('is-locked');
            }
        });
        document.addEventListener('mouseout', function (e) {
            var snap = e.target.closest && e.target.closest(snapTargets);
            if (snap) {
                lockedX = null; lockedY = null;
                tw = 10; th = 10; tr = 5;
                el.classList.remove('is-locked');
            }
        });
    })();

    /* ----------------------------------------------------------------
       Footer year
       ---------------------------------------------------------------- */
    (function year() {
        var el = document.getElementById('year');
        if (el) el.textContent = String(new Date().getFullYear());
    })();

    /* ----------------------------------------------------------------
       Force CV download: some browsers/webviews open a same-origin
       PDF in their built-in viewer instead of honoring the anchor's
       download attribute. Fetch it as a blob and save it explicitly.
       ---------------------------------------------------------------- */
    (function forceDownload() {
        var links = document.querySelectorAll('a[download][href$=".pdf"]');
        links.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                var filename = link.getAttribute('download') || 'download.pdf';
                fetch(link.href)
                    .then(function (res) { return res.blob(); })
                    .then(function (blob) {
                        var url = URL.createObjectURL(blob);
                        var a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
                    })
                    .catch(function () {
                        window.location.href = link.href;
                    });
            });
        });
    })();
})();
