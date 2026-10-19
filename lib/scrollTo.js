/**
 * ==============================================================================
 * SMART AUTO-SCROLL UTILITY FOR MMD WEBSITE
 * ==============================================================================
 * Memberikan animasi gulir (smooth scroll) yang pintar, presisi, dan aksesibel.
 *
 * Fitur:
 * 1. Mengukur tinggi sticky header / navbar secara dinamis (termasuk JamIstiwaTopBar & Waka3SubNav).
 * 2. Memeriksa apakah elemen sudah terlihat nyaman di viewport sebelum melakukan scroll
 *    (mencegah scroll berulang atau goyangan layar yang tidak perlu).
 * 3. Menghormati pengaturan prefers-reduced-motion dari OS pengguna.
 * 4. Aman di SSR / Next.js.
 */

/**
 * Menghitung tinggi akumulatif header sticky saat ini (dalam pixel)
 * Ditambah padding lega (16px) agar judul konten tidak menempel atau tertutup.
 */
export function getStickyHeaderOffset() {
  if (typeof window === 'undefined') return 120;
  try {
    const header = document.querySelector('header.sticky');
    if (header) {
      const rect = header.getBoundingClientRect();
      return Math.ceil(rect.height) + 16;
    }
  } catch (e) {
    // Abaikan jika query selector gagal
  }
  return 120; // Fallback rata-rata tinggi navbar
}

/**
 * Memeriksa preferensi reduced motion dari pengguna
 */
export function isPrefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Memeriksa apakah elemen tujuan sudah terlihat nyaman di dalam viewport
 * @param {HTMLElement} element
 * @param {number} topOffset
 */
export function isElementComfortablyInView(element, topOffset = 120) {
  if (!element || typeof window === 'undefined') return false;
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;

  // Elemen sudah nyaman dilihat jika bagian atasnya berada di bawah navbar
  // dan di dalam paruh atas layar (tidak tertutup dan tidak terlalu jauh ke bawah)
  return rect.top >= topOffset && rect.top <= windowHeight * 0.6;
}

/**
 * Fungsi utama Smart Scroll ke elemen target
 * @param {string|HTMLElement} target - ID elemen (misal 'table-waka1' atau '#table-waka1') atau instance HTMLElement
 * @param {Object} options
 * @param {number} [options.offset] - Custom offset dalam pixel
 * @param {boolean} [options.force=false] - Paksa scroll meskipun elemen sudah terlihat
 * @param {ScrollBehavior} [options.behavior='smooth'] - Perilaku scroll ('smooth' | 'auto')
 */
export function smartScrollTo(target, options = {}) {
  if (typeof window === 'undefined') return;

  let element = null;
  if (typeof target === 'string') {
    const id = target.startsWith('#') ? target.slice(1) : target;
    element = document.getElementById(id);
  } else if (target && target instanceof HTMLElement) {
    element = target;
  }

  if (!element) return;

  const offset = options.offset !== undefined ? options.offset : getStickyHeaderOffset();
  const force = options.force ?? false;
  const reducedMotion = isPrefersReducedMotion();

  // Jangan gulir jika elemen sudah nyaman dilihat kecuali jika dipaksa (force: true)
  if (!force && isElementComfortablyInView(element, offset)) {
    return;
  }

  const elementPosition = element.getBoundingClientRect().top + window.scrollY;
  const targetY = Math.max(0, elementPosition - offset);

  window.scrollTo({
    top: targetY,
    behavior: reducedMotion ? 'auto' : (options.behavior || 'smooth'),
  });
}

/**
 * Gulir halus kembali ke paling atas halaman
 */
export function scrollToTop(options = {}) {
  if (typeof window === 'undefined') return;
  const reducedMotion = isPrefersReducedMotion();
  window.scrollTo({
    top: 0,
    behavior: reducedMotion ? 'auto' : (options.behavior || 'smooth'),
  });
}
