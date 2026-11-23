/* ==========================================================================
   CONFIG — the only place you need to edit if the Google Form changes.
   Option text must match the Google Form EXACTLY (including curly ’).
   Verified against the live form's FB_PUBLIC_LOAD_DATA_ on 2026-11-23.

   type: "checkbox" (multiple answers), "radio" (one answer), "scale" (linear scale)
   other: true  -> Google's built-in "Other" option with a text box
   ========================================================================== */
const CONFIG = {
  formId: '1FAIpQLSctEjG5cFtYR0NGwohlyUQcscaagunSVes6E_1ieL_YF19T3Q',

  questions: [
    {
      entry: '942339231',
      type: 'checkbox',
      required: true,
      label: 'How did you learn about the Data Liberation Project?',
      options: [
        'Friend or Family Member',
        'Email / Newsletter',
        'Social Media',
        'Word of Mouth',
        'While Filing a Request',
      ],
    },
    {
      entry: '343321527',
      type: 'checkbox',
      required: true,
      label: 'In which sectors are you interested in?',
      options: [
        'Healthcare',
        'Military',
        'Government',
        'Education',
        'Climate / Environment',
        'Civil Rights',
        'Immigration',
        'Policing',
        'Data Centers and AI',
      ],
      other: true,
      columns: 2,
    },
    {
      entry: '2071234059',
      type: 'radio',
      required: true,
      label: 'Are you interested in volunteering for the Data Liberation Project?',
      options: ['Yes', 'No'],
      columns: 2,
    },
    {
      entry: '946806936',
      type: 'checkbox',
      required: true,
      label: 'How would you like to help?',
      options: [
        'I would like to file FOIA Requests for DLP',
        'I can Proofread FOIA Data for DLP',
        'I would like to Analyze Data',
        'I would love to Clean FOIA Data',
        'I can’t help right now, but I would like to help later',
      ],
    },
    {
      entry: '2006114676',
      type: 'radio',
      required: true,
      label: 'How do you prefer to learn about the Data Liberation Project?',
      options: [
        'Social Media (Instagram, BlueSky, LinkedIn)',
        'YouTube',
        'Podcasts',
        'Email',
        'Slack',
        'FOIA Friday’s',
        'MuckRock Website',
      ],
      other: true,
    },
    {
      entry: '2145231935',
      type: 'radio',
      required: true,
      label: 'Which newsrooms do you know about?',
      options: ['MuckRock Foundation'],
      other: true,
    },
    {
      entry: '1573240963',
      type: 'scale',
      required: true,
      label: 'How likely would you recommend DLP to a friend?',
      min: 1,
      max: 5,
      minLabel: 'Worst',
      maxLabel: 'Best',
    },
  ],
};

const FORM_RESPONSE_URL = `https://docs.google.com/forms/d/e/${CONFIG.formId}/formResponse`;
const FORM_VIEW_URL = `https://docs.google.com/forms/d/e/${CONFIG.formId}/viewform`;
const OTHER_VALUE = '__other_option__';

/* ==========================================================================
   Rendering
   ========================================================================== */
const els = {
  form: document.getElementById('dlp-form'),
  questions: document.getElementById('questions'),
  submit: document.getElementById('submit-btn'),
  summary: document.getElementById('error-summary'),
  formView: document.getElementById('form-view'),
  successView: document.getElementById('success-view'),
  successHeading: document.getElementById('success-heading'),
  again: document.getElementById('again-btn'),
};

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) {
    if (child) node.append(child);
  }
  return node;
}

function renderQuestion(q, index) {
  const qid = `q${index + 1}`;
  const name = `entry.${q.entry}`;
  const errorId = `${qid}-error`;
  const hintId = `${qid}-hint`;

  const legend = el('legend', {}, [
    el('span', { class: 'q-num', text: `${index + 1}.` }),
    el('span', {}, [
      document.createTextNode(q.label),
      q.required ? el('span', { class: 'req', 'aria-hidden': 'true', text: ' *' }) : null,
      q.required ? el('span', { class: 'sr-only', text: ' (required)' }) : null,
    ]),
  ]);

  const fieldset = el('fieldset', {
    class: 'question',
    id: qid,
    'data-index': index,
  }, [legend]);

  const describedBy = [];

  if (q.type === 'checkbox') {
    fieldset.append(el('p', { class: 'hint', id: hintId, text: 'Select all that apply.' }));
    describedBy.push(hintId);
  }

  if (q.type === 'scale') {
    const options = el('div', { class: 'scale-options' });
    for (let n = q.min; n <= q.max; n++) {
      const endLabel = n === q.min ? q.minLabel : n === q.max ? q.maxLabel : '';
      options.append(el('label', { class: 'scale-option' }, [
        el('input', { type: 'radio', name, value: String(n), id: `${qid}-${n}` }),
        el('span', {}, [
          document.createTextNode(String(n)),
          endLabel ? el('span', { class: 'sr-only', text: ` (${endLabel})` }) : null,
        ]),
      ]));
    }
    fieldset.append(el('div', { class: 'scale' }, [
      options,
      el('div', { class: 'scale-labels', 'aria-hidden': 'true' }, [
        el('span', { text: `${q.min} = ${q.minLabel}` }),
        el('span', { text: `${q.max} = ${q.maxLabel}` }),
      ]),
    ]));
  } else {
    const options = el('div', { class: `options${q.columns === 2 ? ' two-col' : ''}` });
    q.options.forEach((text, i) => {
      options.append(el('label', { class: 'option' }, [
        el('input', { type: q.type, name, value: text, id: `${qid}-${i}` }),
        el('span', { class: 'option-text', text }),
      ]));
    });

    if (q.other) {
      const otherId = `${qid}-other`;
      const otherTextId = `${qid}-other-text`;
      options.append(el('label', { class: 'option' }, [
        el('input', {
          type: q.type, name, value: OTHER_VALUE, id: otherId,
          'aria-controls': `${otherTextId}-wrap`, 'data-other': 'true',
        }),
        el('span', { class: 'option-text', text: 'Other' }),
      ]));
      fieldset.append(options);
      fieldset.append(el('div', { class: 'other-wrap', id: `${otherTextId}-wrap`, hidden: true }, [
        el('label', { for: otherTextId, text: 'Please specify' }),
        el('input', {
          type: 'text', class: 'text-input', id: otherTextId,
          name: `${name}.other_option_response`, autocomplete: 'off',
          disabled: true, // disabled inputs are skipped by FormData
        }),
      ]));
    } else {
      fieldset.append(options);
    }
  }

  fieldset.append(el('p', { class: 'field-error', id: errorId, hidden: true }));
  if (describedBy.length) fieldset.setAttribute('aria-describedby', describedBy.join(' '));
  return fieldset;
}

CONFIG.questions.forEach((q, i) => els.questions.append(renderQuestion(q, i)));
document.getElementById('year').textContent = new Date().getFullYear();

/* ==========================================================================
   "Other" text box: show + enable only while Other is selected
   ========================================================================== */
function syncOther(fieldset) {
  const otherInput = fieldset.querySelector('input[data-other]');
  if (!otherInput) return;
  const wrap = fieldset.querySelector('.other-wrap');
  const text = wrap.querySelector('input');
  const on = otherInput.checked;
  wrap.hidden = !on;
  text.disabled = !on;
  text.required = on;
  otherInput.setAttribute('aria-expanded', String(on));
  return { on, text };
}

/* ==========================================================================
   Validation (mirrors the Google Form's required questions)
   ========================================================================== */
let attemptedSubmit = false;

function validateQuestion(fieldset) {
  const q = CONFIG.questions[Number(fieldset.dataset.index)];
  const checked = fieldset.querySelectorAll('input[type=checkbox]:checked, input[type=radio]:checked');
  const otherText = fieldset.querySelector('.other-wrap input');
  const otherOn = !!fieldset.querySelector('input[data-other]:checked');
  let message = '';
  let focusTarget = fieldset.querySelector('input');

  if (q.required && checked.length === 0) {
    message = q.type === 'checkbox' ? 'Please select at least one option.'
      : q.type === 'scale' ? `Please choose a rating from ${q.min} to ${q.max}.`
      : 'Please choose an option.';
  } else if (otherOn && !otherText.value.trim()) {
    message = 'Please describe your “Other” answer.';
    focusTarget = otherText;
  }

  setError(fieldset, message);
  if (otherText) otherText.setAttribute('aria-invalid', String(otherOn && !otherText.value.trim() && !!message));
  return message ? { fieldset, message, focusTarget, label: q.label } : null;
}

function setError(fieldset, message) {
  const errorEl = fieldset.querySelector('.field-error');
  const hint = fieldset.querySelector('.hint');
  const ids = [hint && hint.id, message && errorEl.id].filter(Boolean);
  errorEl.textContent = message;
  errorEl.hidden = !message;
  fieldset.classList.toggle('has-error', !!message);
  if (ids.length) fieldset.setAttribute('aria-describedby', ids.join(' '));
  else fieldset.removeAttribute('aria-describedby');
}

function showSummary(errors) {
  const s = els.summary;
  s.replaceChildren();
  if (!errors.length) { s.hidden = true; return; }
  const list = el('ul');
  errors.forEach((err) => {
    const link = el('a', { href: `#${err.fieldset.id}`, text: `${err.label}: ${err.message}` });
    link.addEventListener('click', (e) => {
      e.preventDefault();
      err.fieldset.scrollIntoView({ behavior: 'smooth', block: 'center' });
      err.focusTarget.focus({ preventScroll: true });
    });
    list.append(el('li', {}, [link]));
  });
  s.append(
    el('p', { text: errors.length === 1 ? 'Please fix 1 problem before submitting:' : `Please fix ${errors.length} problems before submitting:` }),
    list,
  );
  s.hidden = false;
}

function showNetworkError() {
  const s = els.summary;
  s.replaceChildren(
    el('p', { text: 'Sorry, we couldn’t send your response.' }),
    el('span', {}, [
      document.createTextNode('Please check your internet connection and try again. If it keeps failing, you can '),
      el('a', { href: FORM_VIEW_URL, target: '_blank', rel: 'noopener', text: 'fill out the form on Google Forms' }),
      document.createTextNode('.'),
    ]),
  );
  s.hidden = false;
  s.focus();
}

/* ==========================================================================
   Events
   ========================================================================== */
els.form.addEventListener('change', (e) => {
  const fieldset = e.target.closest('.question');
  if (!fieldset) return;
  if (e.target.matches('input[type=checkbox], input[type=radio]')) {
    const res = syncOther(fieldset);
    if (res && res.on && e.target.dataset.other && e.target.checked) res.text.focus();
  }
  if (attemptedSubmit) validateQuestion(fieldset);
});

els.form.addEventListener('input', (e) => {
  if (!attemptedSubmit || !e.target.matches('.text-input')) return;
  validateQuestion(e.target.closest('.question'));
});

function setSending(sending) {
  els.submit.disabled = sending;
  els.form.setAttribute('aria-busy', String(sending));
  els.submit.replaceChildren(
    ...(sending ? [el('span', { class: 'spinner', 'aria-hidden': 'true' })] : []),
    el('span', { class: 'btn-label', text: sending ? 'Sending…' : 'Submit' }),
  );
}

function buildPayload() {
  // Disabled "Other" text boxes are skipped automatically. Checkbox questions
  // produce one entry.ID pair per selected option, which is what Google expects.
  const params = new URLSearchParams();
  for (const [key, value] of new FormData(els.form)) {
    params.append(key, key.endsWith('.other_option_response') ? value.trim() : value);
  }
  params.append('fvv', '1');
  params.append('pageHistory', '0');
  return params;
}

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (els.submit.disabled) return;
  attemptedSubmit = true;

  const errors = [...els.form.querySelectorAll('.question')]
    .map(validateQuestion)
    .filter(Boolean);

  if (errors.length) {
    showSummary(errors);
    els.summary.focus();
    return;
  }

  showSummary([]);
  setSending(true);
  try {
    // no-cors: the response is opaque, so a resolved fetch is treated as success.
    // That's why the client-side validation above must mirror Google's rules.
    await fetch(FORM_RESPONSE_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: buildPayload(), // sent as application/x-www-form-urlencoded
    });
    els.formView.hidden = true;
    els.successView.hidden = false;
    window.scrollTo({ top: 0 });
    els.successHeading.focus();
  } catch (err) {
    console.error('Submission failed:', err);
    showNetworkError();
  } finally {
    setSending(false);
  }
});

els.again.addEventListener('click', () => {
  els.form.reset();
  attemptedSubmit = false;
  els.form.querySelectorAll('.question').forEach((fs) => { syncOther(fs); setError(fs, ''); });
  showSummary([]);
  els.successView.hidden = true;
  els.formView.hidden = false;
  window.scrollTo({ top: 0 });
  els.form.querySelector('input').focus();
});
