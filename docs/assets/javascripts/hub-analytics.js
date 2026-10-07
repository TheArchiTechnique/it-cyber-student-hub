/* Anonymous Student Hub engagement events: no identity, answers, or grades. */
(() => {
  'use strict';
  const location = window.location;
  if (location.hostname !== 'thearchitechnique.github.io') return;
  const parts = location.pathname.split('/').filter(Boolean);
  const root = parts.indexOf('it-cyber-student-hub');
  if (root < 0) return;
  const route = parts.slice(root + 1).filter(part => part !== 'index.html');
  const slug = value => /^[a-z0-9][a-z0-9-]{0,63}$/.test(value || '');
  const track = (name, data) => {
    if (typeof window.umami?.track === 'function') window.umami.track(name, data);
  };

  function init() {
    if (route[0] === 'labs') {
      const area = route[1];
      if (!slug(area)) return;
      if (!route[2]) {
        track('lab_area_opened', { area });
      } else if (slug(route[2])) {
        track('lab_launched', { area, lab: route[2] });
      }
      // An external lab link can opt in with data-hub-lab-launch="lab-slug".
      document.addEventListener('click', event => {
        const link = event.target.closest('a[data-hub-lab-launch]');
        if (!link) return;
        const lab = link.getAttribute('data-hub-lab-launch');
        if (slug(lab)) track('lab_launched', { area, lab });
      });
      return;
    }

    if (route[0] !== 'practice' || route[1] !== 'pbqs' ||
        route[4] !== 'app' || !slug(route[2]) || !slug(route[3])) return;
    const data = { certification: route[2], activity: route[3] };
    track('pbq_launched', data);
    let completed = false;
    const visible = id => {
      const element = document.getElementById(id);
      return !!element && !element.hidden && !element.closest('[hidden]');
    };
    const submittedResultsVisible = () => {
      if (data.activity === 'ports-and-protocols') {
        return visible('results') &&
          (document.getElementById('results-body')?.textContent || '').includes('Run complete.');
      }
      return visible('review') || visible('results');
    };
    function afterSubmit() {
      window.setTimeout(() => {
        if (!completed && submittedResultsVisible()) {
          completed = true;
          track('pbq_completed', data); // A submitted run, not a correct/passing score.
        }
      }, 0);
    }
    function retry(action) {
      completed = false;
      track('pbq_retried', { ...data, action });
    }
    function confirmAction(button) {
      const label = [
        button.textContent,
        document.getElementById('confirm-title')?.textContent,
        document.getElementById('confirm-text')?.textContent
      ].join(' ').toLowerCase();
      if (!/\b(reset|restore|clear|fresh|new scenario)\b/.test(label)) return;
      retry(/new scenario/.test(label) ? 'new-scenario' : 'reset');
    }
    document.addEventListener('click', event => {
      const button = event.target.closest('button, input[type="submit"]');
      if (!button || button.disabled) return;
      const id = button.id;
      const label = (button.textContent || button.value || '').trim();
      if (id === 'submit' || id === 'checkBtn' || id === 'check' ||
          /^submit (answers|solution|settings|design|installation)$/i.test(label) ||
          /^check (answers|build|solution)$/i.test(label) ||
          (id === 'tab-results' && data.activity === 'ports-and-protocols')) {
        afterSubmit();
      }
      if (id === 'retry' || id === 'continueBtn' || id === 'revise') {
        retry('revise');
      } else if (['confirmReset', 'confirm-reset', 'confirm-action',
                  'accept-confirm', 'confirm-yes', 'clear'].includes(id)) {
        confirmAction(button);
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
