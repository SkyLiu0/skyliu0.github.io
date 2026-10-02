const paperList = document.querySelector('#paper-list');
const papersToggle = document.querySelector('#papers-toggle');
const DEFAULT_VISIBLE_COUNT = 5;
const LOAD_MORE_COUNT = 5;
let allPublications = [];
let authorHighlightEnabled = true;
let authorHighlightNames = [];
let visiblePaperCount = DEFAULT_VISIBLE_COUNT;
let papersAnimating = false;
const formatMarked = (text) => String(text ?? '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, '$1<em>$2</em>');
const formatLines = (value) => (Array.isArray(value) ? value : [value]).map(formatMarked).join('<br>');
const formatAuthors = (text) => {
  const manualStrong = [];
  let source = String(text ?? '').replace(/\*\*(.+?)\*\*/g, (_, value) => {
    const token = `__MANUAL_STRONG_${manualStrong.length}__`;
    manualStrong.push(`<strong>${value}</strong>`);
    return token;
  });
  if (authorHighlightEnabled) {
    authorHighlightNames.forEach((name) => {
      if (!name) return;
      source = source.split(name).join(`<strong>${name}</strong>`);
    });
  }
  manualStrong.forEach((value, index) => {
    source = source.split(`__MANUAL_STRONG_${index}__`).join(value);
  });
  return source;
};
const normalizePublication = (paper = {}) => {
  paper = paper && typeof paper === 'object' ? paper : {};
  return {
  year: String(paper.year ?? ''),
  type: String(paper.type ?? ''),
  title: String(paper.title ?? ''),
  authors: String(paper.authors ?? ''),
  venue: String(paper.venue ?? ''),
  links: Array.isArray(paper.links) ? paper.links.filter(Boolean).map((link) => ({
    label: String(link.label ?? ''),
    url: String(link.url ?? '#')
  })) : []
};
};
const renderPapers = (publications, animate = true, revealFrom = 0) => {
  allPublications = (Array.isArray(publications) ? publications : []).map(normalizePublication);
  const visiblePapers = allPublications.slice(0, visiblePaperCount);
  if (!allPublications.length) {
    paperList.innerHTML = '<p class="paper-empty">Publications will appear here as they are added.</p>';
    papersToggle.hidden = true;
    return;
  }
  paperList.innerHTML = visiblePapers.map((paper, index) => {
    const revealClass = animate && index >= revealFrom ? ' reveal' : '';
    return `<article class="paper${revealClass}" style="--delay:${(index - revealFrom) * 80}ms"><div class="paper-year">${paper.year}</div><div class="paper-main"><p class="paper-type">${paper.type}</p><h3>${paper.title}</h3><p class="paper-meta"><span class="paper-authors">${formatAuthors(paper.authors)}</span><span class="paper-venue">${paper.venue}</span></p><div class="paper-links">${paper.links.map(link => `<a href="${link.url}" ${link.url !== '#' ? 'target="_blank" rel="noreferrer"' : ''}>${link.label} <span>↗</span></a>`).join('')}</div></div><span class="paper-index">${index + 1}</span></article>`;
  }).join('');
  if (animate) paperList.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  papersToggle.hidden = allPublications.length <= DEFAULT_VISIBLE_COUNT;
  papersToggle.textContent = visiblePaperCount >= allPublications.length ? 'Show less' : 'Show more';
};

const loadContent = async () => {
  try { const response = await fetch('src/data/publications.json'); if (!response.ok) throw new Error('Could not load publications'); const data = await response.json(); renderPapers(data.items || data); }
  catch (error) { paperList.innerHTML = '<p class="paper-error">Publications are temporarily unavailable.</p>'; }
};
papersToggle.addEventListener('click', () => {
  if (papersAnimating) return;
  papersAnimating = true;
  const buttonTop = papersToggle.getBoundingClientRect().top;
  const layoutTargets = [document.querySelector('#contact'), document.querySelector('.site-footer')].filter(Boolean);
  const targetTops = layoutTargets.map((element) => [element, element.getBoundingClientRect().top]);
  const previousCount = visiblePaperCount;
  const showingLess = visiblePaperCount >= allPublications.length;
  visiblePaperCount = showingLess
    ? DEFAULT_VISIBLE_COUNT
    : Math.min(allPublications.length, visiblePaperCount + LOAD_MORE_COUNT);
  renderPapers(allPublications, !showingLess, showingLess ? 0 : previousCount);

  const animateLayoutMove = () => {
    const deltaY = buttonTop - papersToggle.getBoundingClientRect().top;
    papersToggle.style.transition = 'none';
    papersToggle.style.transform = `translateY(${deltaY}px)`;
    requestAnimationFrame(() => {
      papersToggle.style.transition = 'transform .62s cubic-bezier(.22,.61,.36,1), background .25s, color .25s, border-color .25s';
      papersToggle.style.transform = 'translateY(0)';
    });
    targetTops.forEach(([element, top]) => {
      const delta = top - element.getBoundingClientRect().top;
      element.style.transition = 'none';
      element.style.transform = `translateY(${delta}px)`;
      requestAnimationFrame(() => {
        element.style.transition = 'transform .62s cubic-bezier(.22,.61,.36,1)';
        element.style.transform = 'translateY(0)';
      });
    });
    window.setTimeout(() => {
      papersToggle.style.transition = '';
      papersToggle.style.transform = '';
      layoutTargets.forEach((element) => {
        element.style.transition = '';
        element.style.transform = '';
      });
      papersAnimating = false;
    }, 680);
  };
  animateLayoutMove();
});


const loadResearch = async () => {
  try {
    const response = await fetch('src/data/research.json');
    if (!response.ok) throw new Error('Could not load research topics');
    const data = await response.json();
    document.querySelector('#research-intro').innerHTML = formatMarked(data.intro ?? '');
    document.querySelector('#research-topics').innerHTML = (data.items || []).map(item => `<span>${item.number}&nbsp; ${formatMarked(item.title)}</span>`).join('');
  } catch (error) { console.warn('Research topics could not be loaded.', error); }
};

const loadProfile = async () => {
  try {
    const response = await fetch('src/data/about.json');
    if (!response.ok) throw new Error('Could not load profile');
    const profile = await response.json();
    authorHighlightEnabled = profile.authorHighlight !== false && profile.authorHighlight?.enabled !== false;
    authorHighlightNames = Array.isArray(profile.authorHighlight?.names) ? profile.authorHighlight.names : [profile.name];
    document.querySelector('.wordmark span').textContent = profile.initials;
    document.querySelector('.wordmark strong').textContent = profile.name;
    document.querySelector('.hero .eyebrow').textContent = profile.role;
    document.querySelector('.hero h1').textContent = profile.headline.join(' ');
    document.querySelector('.lede').innerHTML = formatMarked(profile.bio);
    document.querySelector('.affiliation').innerHTML = `<span class="detail-label">Affiliation</span>${formatLines(profile.affiliation)}`;
    document.querySelector('.experience').innerHTML = `<span class="detail-label">Previously visited</span>${formatMarked(profile.previousVisit)}`;
    const quickFacts = profile.quickFacts || [
      { label: 'Based in', value: profile.location },
      { label: 'Research', value: profile.researchInterests },
      { label: 'Email', key: 'email', hrefPrefix: 'mailto:' }
    ];
    document.querySelector('#quick-facts').innerHTML = quickFacts.map((fact) => {
      const rawValue = fact.key ? profile[fact.key] ?? '' : fact.value ?? '';
      const value = formatMarked(rawValue);
      const href = fact.href ?? (fact.hrefPrefix ? `${fact.hrefPrefix}${rawValue}` : '');
      const content = href ? `<a class="fact-email" href="${href}">${value}</a>` : value;
      return `<span><b>${formatMarked(fact.label ?? '')}</b>${content}</span>`;
    }).join('');
    document.querySelector('.portrait-frame img').src = profile.portrait;
    document.querySelector('.portrait-frame img').alt = `${profile.name} portrait`;
    document.querySelector('.email-link').href = `mailto:${profile.email}`;
    document.querySelector('.email-link').firstChild.textContent = `${profile.email} `;
    const profileIcons = profile.profileIcons || [];
    document.querySelector('#social-links').innerHTML = profileIcons.map((item) => {
      const href = item.url || (item.key ? profile.links?.[item.key] : '') || '#';
      return `<a href="${href}" ${href !== '#' ? 'target="_blank" rel="noreferrer"' : ''} aria-label="${item.label}"><img class="social-icon" src="${item.icon}" alt="">${item.label}</a>`;
    }).join('');
  } catch (error) { console.warn('Profile data could not be loaded.', error); }
};
const root = document.documentElement; const themeButton = document.querySelector('.theme-toggle'); const storedTheme = localStorage.getItem('theme');
if (storedTheme === 'dark' || (!storedTheme && matchMedia('(prefers-color-scheme: dark)').matches)) root.dataset.theme = 'dark';
const updateThemeLabel = () => themeButton.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); updateThemeLabel();
themeButton.addEventListener('click', () => { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('theme', root.dataset.theme); updateThemeLabel(); });
document.querySelector('#year').textContent = new Date().getFullYear();
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); }), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el)); loadResearch(); loadProfile().then(() => loadContent());
