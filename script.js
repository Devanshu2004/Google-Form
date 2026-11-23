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
      emojis: ['😞', '🙁', '😐', '🙂', '🤩'],
    },
  ],

  /* The "little something" shown on the thank-you screen.
     Set to null to hide the card. linkText/linkUrl are optional. */
  reward: null,
  // Example:
  // reward: {
  //   title: 'Free DLP sticker pack',
  //   text: 'Use the link below to claim it.',
  //   linkText: 'Claim my gift',
  //   linkUrl: 'https://example.com',
  // },
};

const FORM_RESPONSE_URL = `https://docs.google.com/forms/d/e/${CONFIG.formId}/formResponse`;
const FORM_VIEW_URL = `https://docs.google.com/forms/d/e/${CONFIG.formId}/viewform`;
const OTHER_VALUE = '__other_option__';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const TOTAL = CONFIG.questions.length;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ==========================================================================
   Helpers
   ========================================================================== */
const $ = (id) => document.getElementById(id);
const els = {
  form: $('dlp-form'),
  formView: $('form-view'),
  questions: $('questions'),
  summary: $('error-summary'),
  submit: $('submit-btn'),
  progress: $('progress'),
  progressFill: $('progress-fill'),
  start: $('start-btn'),
  success: $('success-view'),
  successHeading: $('success-heading'),
  again: $('again-btn'),
};

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value; // static strings only
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
}

const TICK_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* ==========================================================================
   Rendering: every question on one page
   ========================================================================== */
function renderQuestion(q, index) {
  const n = index + 1;
  const qid = `q${n}`;
  const name = `entry.${q.entry}`;

  const fs = el('fieldset', {
    class: 'question', id: qid, 'data-index': index,
    'aria-describedby': `${qid}-hint`,
  });

  fs.append(el('legend', { class: 'q-head' }, [
    el('span', { class: 'q-num', 'aria-hidden': 'true' }, [
      el('span', { class: 'n', text: String(n) }),
      el('span', { class: 'check', html: TICK_SVG }),
    ]),
    el('span', { class: 'q-title' }, [
      el('span', { class: 'sr-only', text: `Question ${n}: ` }),
      document.createTextNode(q.label),
      q.required ? el('span', { class: 'req', 'aria-hidden': 'true', text: ' *' }) : null,
      q.required ? el('span', { class: 'sr-only', text: ' (required)' }) : null,
    ]),
  ]));

  const hintText = q.type === 'checkbox' ? 'Choose as many as you like'
    : q.type === 'scale' ? `${q.min} = ${q.minLabel}, ${q.max} = ${q.maxLabel}`
    : 'Choose one';
  fs.append(el('p', { class: 'hint', id: `${qid}-hint`, text: hintText }));

  if (q.type === 'scale') {
    const options = el('div', { class: 'scale-options' });
    for (let v = q.min; v <= q.max; v++) {
      const endLabel = v === q.min ? q.minLabel : v === q.max ? q.maxLabel : '';
      options.append(el('label', { class: 'scale-option', 'data-key': String(v) }, [
        el('input', { type: 'radio', name, value: String(v) }),
        el('span', { class: 'scale-face' }, [
          el('span', { class: 'emoji', 'aria-hidden': 'true', text: (q.emojis || [])[v - q.min] || '' }),
          el('span', { class: 'num', text: String(v) }),
          endLabel ? el('span', { class: 'sr-only', text: ` (${endLabel})` }) : null,
        ]),
      ]));
    }
    fs.append(el('div', { class: 'scale' }, [
      options,
      el('div', { class: 'scale-labels', 'aria-hidden': 'true' }, [
        el('span', { text: q.minLabel }),
        el('span', { text: q.maxLabel }),
      ]),
    ]));
  } else {
    const items = q.options.map((text) => ({ text, value: text }));
    if (q.other) items.push({ text: 'Other', value: OTHER_VALUE, other: true });

    const options = el('div', { class: `options${q.columns === 2 ? ' two-col' : ''}` });
    items.forEach((item, i) => {
      options.append(el('label', { class: 'option', 'data-key': LETTERS[i] }, [
        el('input', {
          type: q.type, name, value: item.value,
          'data-other': item.other ? 'true' : null,
          'aria-controls': item.other ? `${qid}-other-wrap` : null,
        }),
        el('span', { class: 'key', 'aria-hidden': 'true', text: LETTERS[i] }),
        el('span', { class: 'option-text', text: item.text }),
        el('span', { class: 'tick', html: TICK_SVG }),
      ]));
    });
    fs.append(options);

    if (q.other) {
      fs.append(el('div', { class: 'other-wrap', id: `${qid}-other-wrap`, hidden: true }, [
        el('label', { for: `${qid}-other-text`, text: 'Tell us more' }),
        el('input', {
          type: 'text', class: 'text-input', id: `${qid}-other-text`,
          name: `${name}.other_option_response`,
          placeholder: 'Type your answer here…', autocomplete: 'off',
          disabled: true, // disabled inputs are left out of the submission
        }),
      ]));
    }
  }

  fs.append(el('p', { class: 'field-error', id: `${qid}-error`, hidden: true }));
  return fs;
}

CONFIG.questions.forEach((q, i) => els.questions.append(renderQuestion(q, i)));
const fieldsets = [...els.questions.querySelectorAll('.question')];
document.getElementById('year').textContent = new Date().getFullYear();

/* ==========================================================================
   Answer state + validation (mirrors the Google Form's required questions)
   ========================================================================== */
const questionOf = (fs) => CONFIG.questions[Number(fs.dataset.index)];
let attemptedSubmit = false;

function syncOther(fs) {
  const otherInput = fs.querySelector('input[data-other]');
  if (!otherInput) return null;
  const wrap = fs.querySelector('.other-wrap');
  const text = wrap.querySelector('input');
  const on = otherInput.checked;
  wrap.hidden = !on;
  text.disabled = !on;
  text.required = on;
  otherInput.setAttribute('aria-expanded', String(on));
  return { on, text };
}

function problemWith(fs) {
  const q = questionOf(fs);
  const checked = fs.querySelectorAll('input:checked');
  const otherOn = !!fs.querySelector('input[data-other]:checked');
  const otherText = fs.querySelector('.other-wrap input');
  if (q.required && checked.length === 0) {
    return {
      message: q.type === 'checkbox' ? 'Please select at least one option'
        : q.type === 'scale' ? `Please pick a number from ${q.min} to ${q.max}`
        : 'Please choose an option',
      focus: fs.querySelector('input'),
    };
  }
  if (otherOn && !otherText.value.trim()) {
    return { message: 'Please type your “Other” answer', focus: otherText };
  }
  return null;
}

function showError(fs, problem) {
  const errorEl = fs.querySelector('.field-error');
  const hintId = `${fs.id}-hint`;
  errorEl.hidden = !problem;
  errorEl.textContent = problem ? problem.message : '';
  fs.classList.toggle('has-error', !!problem);
  fs.setAttribute('aria-describedby', problem ? `${hintId} ${errorEl.id}` : hintId);
  const otherText = fs.querySelector('.other-wrap input');
  if (otherText) otherText.setAttribute('aria-invalid', String(!!problem && problem.focus === otherText));
}

function refresh(fs) {
  const problem = problemWith(fs);
  fs.classList.toggle('is-answered', !problem);
  if (attemptedSubmit) showError(fs, problem);
  const answered = fieldsets.filter((f) => !problemWith(f)).length;
  els.progressFill.style.width = `${(answered / TOTAL) * 100}%`;
  els.progress.setAttribute('aria-valuenow', String(answered));
  els.progress.setAttribute('aria-valuetext', `${answered} of ${TOTAL} answered`);
  if (attemptedSubmit && !fieldsets.some((f) => problemWith(f))) els.summary.hidden = true;
}

function focusQuestion(fs) {
  fs.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
  const target = fs.querySelector('input:checked') || fs.querySelector('input');
  target.focus({ preventScroll: true });
}

/* ==========================================================================
   Events
   ========================================================================== */
els.start.addEventListener('click', (e) => {
  e.preventDefault();
  focusQuestion(fieldsets[0]);
});

els.form.addEventListener('change', (e) => {
  const fs = e.target.closest('.question');
  if (!fs || !e.target.matches('input[type=checkbox], input[type=radio]')) return;
  const other = syncOther(fs);
  if (other && other.on && e.target.dataset.other && e.target.checked) other.text.focus();
  refresh(fs);
});

els.form.addEventListener('input', (e) => {
  if (e.target.matches('.text-input')) refresh(e.target.closest('.question'));
});

// Keyboard shortcuts inside a question: letters (or 1–5) pick options,
// Enter jumps to the next question.
els.form.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const fs = e.target.closest('.question');
  if (!fs) return;
  const inText = e.target.matches('input[type=text]');

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault(); // don't submit the whole form from inside a question
    const next = fieldsets[fieldsets.indexOf(fs) + 1];
    if (next) focusQuestion(next);
    else els.submit.focus();
    return;
  }
  if (inText || e.key.length !== 1) return;

  const opt = fs.querySelector(`[data-key="${CSS.escape(e.key.toUpperCase())}"]`);
  if (!opt) return;
  e.preventDefault();
  const input = opt.querySelector('input');
  input.focus({ preventScroll: true }); // before change, so "Other" can move focus to its text box
  input.checked = input.type === 'checkbox' ? !input.checked : true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  if (!reducedMotion) { opt.classList.remove('flash'); void opt.offsetWidth; opt.classList.add('flash'); }
});

/* ==========================================================================
   Submit
   ========================================================================== */
function setSending(sending) {
  els.submit.disabled = sending;
  els.form.setAttribute('aria-busy', String(sending));
  els.submit.replaceChildren(
    ...(sending ? [el('span', { class: 'spinner', 'aria-hidden': 'true' })] : []),
    el('span', { class: 'btn-label', text: sending ? 'Sending…' : 'Submit' }),
  );
}

function showSummary(problems) {
  const s = els.summary;
  s.replaceChildren();
  if (!problems.length) { s.hidden = true; return; }
  const list = el('ul');
  problems.forEach(({ fs, problem }) => {
    const n = Number(fs.dataset.index) + 1;
    const link = el('a', { href: `#${fs.id}`, text: `Question ${n}: ${problem.message}` });
    link.addEventListener('click', (e) => { e.preventDefault(); focusQuestion(fs); problem.focus.focus({ preventScroll: true }); });
    list.append(el('li', {}, [link]));
  });
  s.append(
    el('p', { text: problems.length === 1 ? 'Almost there! 1 question still needs an answer:' : `Almost there! ${problems.length} questions still need an answer:` }),
    list,
  );
  s.hidden = false;
}

function buildPayload() {
  // Checkbox questions produce one entry.ID pair per selected option.
  // Disabled "Other" text boxes are skipped automatically by FormData.
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

  // Google silently drops incomplete responses (and no-cors can't tell us), so check everything here.
  const problems = fieldsets.map((fs) => ({ fs, problem: problemWith(fs) })).filter((p) => p.problem);
  fieldsets.forEach((fs) => showError(fs, problemWith(fs)));
  if (problems.length) {
    showSummary(problems);
    els.summary.focus({ preventScroll: true });
    els.summary.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    return;
  }

  showSummary([]);
  setSending(true);
  try {
    // no-cors: the response is opaque, so a resolved fetch is treated as success.
    await fetch(FORM_RESPONSE_URL, { method: 'POST', mode: 'no-cors', body: buildPayload() });
    showSuccess();
  } catch (err) {
    console.error('Submission failed:', err);
    els.summary.replaceChildren(
      el('p', { text: 'Sorry, we couldn’t send your response.' }),
      el('span', {}, [
        'Please check your internet connection and try again. If it keeps failing, you can ',
        el('a', { href: FORM_VIEW_URL, target: '_blank', rel: 'noopener', text: 'fill out the form on Google Forms' }),
        '.',
      ]),
    );
    els.summary.hidden = false;
    els.summary.focus();
  } finally {
    setSending(false);
  }
});

/* ==========================================================================
   Thank-you screen + confetti
   ========================================================================== */
function showSuccess() {
  els.formView.hidden = true;
  els.progressFill.style.width = '100%';

  const r = CONFIG.reward;
  $('reward-card').hidden = !r;
  if (r) {
    $('reward-title').textContent = r.title || '';
    $('reward-text').textContent = r.text || '';
    const link = $('reward-link');
    link.hidden = !(r.linkUrl && r.linkText);
    if (!link.hidden) { link.href = r.linkUrl; link.textContent = r.linkText; }
  }

  els.success.hidden = false;
  window.scrollTo({ top: 0, behavior: 'auto' });
  els.successHeading.focus({ preventScroll: true });
  launchConfetti();
}

function launchConfetti() {
  if (reducedMotion) return;
  const canvas = el('canvas', { class: 'confetti', 'aria-hidden': 'true' });
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const resize = () => {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);

  const colors = ['#ffffff', '#9cc2ff', '#3b7bff', '#dbe7ff', '#ffd166'];
  const pieces = Array.from({ length: 180 }, (_, i) => {
    const fromLeft = i % 2 === 0;
    return {
      x: fromLeft ? -10 : innerWidth + 10,
      y: innerHeight * (0.55 + Math.random() * 0.35),
      vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 9),
      vy: -(10 + Math.random() * 12),
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 10,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      color: colors[i % colors.length],
    };
  });

  const start = performance.now();
  (function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of pieces) {
      p.vy += 0.38; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 2600) / 900);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 2);
      ctx.restore();
    }
    if (t < 3500) requestAnimationFrame(frame);
    else { removeEventListener('resize', resize); canvas.remove(); }
  })(start);
}

els.again.addEventListener('click', () => {
  els.form.reset();
  attemptedSubmit = false;
  fieldsets.forEach((fs) => { syncOther(fs); showError(fs, null); refresh(fs); });
  showSummary([]);
  els.success.hidden = true;
  els.formView.hidden = false;
  window.scrollTo({ top: 0, behavior: 'auto' });
  els.start.focus({ preventScroll: true });
});
