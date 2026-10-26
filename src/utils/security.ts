/**
 * Shadow AI Security & Package Pre-Check Validation Module
 * Enforces strict financial safeguards, RBI/Android security compliance,
 * and blocks unauthorized opening of payment and banking applications.
 */

export const RESTRICTED_FINANCIAL_PACKAGES = [
  'net.one97.paytm', // Paytm
  'com.phonepe.app', // PhonePe
  'com.google.android.apps.nbu.paisa.user', // Google Pay (Tez)
  'in.org.npci.upiapp', // BHIM UPI
  'com.dreamplug.androidapp', // CRED
  'com.sbi.lotuszaap', // YONO SBI
  'com.csam.icici.bank.imobile', // ICICI iMobile
  'com.snapwork.hdfc', // HDFC MobileBanking
  'com.axis.mobile', // Axis Mobile
  'com.msf.kopl', // Kotak 811
  'com.bankofbaroda.mconnect', // BOB World
  'com.pnb.pnbone', // PNB ONE
  'com.canarabank.mobility', // Canara ai1
  'com.finopaytech.bpay', // Fino BPay
  'com.mobikwik_new', // MobiKwik
  'com.freecharge.android', // Freecharge
  'in.amazon.mShop.android.shopping.payments', // Amazon Pay
  'com.zerodha.kite3', // Zerodha Kite
  'com.nextbillion.groww', // Groww
  'com.angelbroking.angelmobile', // Angel One
  'com.upstox.pro', // Upstox
  'com.paytmmoney', // Paytm Money
];

export const FINANCIAL_KEYWORDS = [
  'paytm',
  'phonepe',
  'phone pe',
  'google pay',
  'googlepay',
  'gpay',
  'g pay',
  'tez',
  'bhim',
  'upi',
  'cred',
  'yono',
  'imobile',
  'hdfc',
  'icici',
  'sbi',
  'axis bank',
  'kotak',
  'pnb',
  'bank of baroda',
  'canara bank',
  'bank app',
  'banking',
  'wallet',
  'netbanking',
  'passbook',
  'money transfer',
  'send money',
  'paise bhejo',
  'paise transfer',
  'zerodha',
  'groww',
  'upstox',
];

export interface IntentValidationResult {
  allowed: boolean;
  blockedReason?: string;
  matchedIdentifier?: string;
  isFinancialApp: boolean;
}

/**
 * Pre-check validation for EVERY package, intent action, or target parameter before launching.
 * Ensures the payment-app blocklist is consistently enforced across the entire application.
 */
export function validateIntentBeforeLaunch(
  action: string,
  param?: string | null,
  customBlockedPackages: string[] = []
): IntentValidationResult {
  const normAction = (action || '').toUpperCase().trim();
  const normParam = (param || '').trim();
  const combined = `${normAction} ${normParam}`.toLowerCase();

  // 1. Direct BLOCKED_PAYMENT_APP intent action
  if (normAction === 'BLOCKED_PAYMENT_APP') {
    return {
      allowed: false,
      blockedReason: 'Explicitly classified as restricted financial / payment application',
      matchedIdentifier: normParam || 'Payment & Banking App',
      isFinancialApp: true,
    };
  }

  // 2. Exact or substring match against known restricted financial packages
  for (const pkg of RESTRICTED_FINANCIAL_PACKAGES) {
    if (combined.includes(pkg.toLowerCase())) {
      return {
        allowed: false,
        blockedReason: `Restricted financial package blocked by security policy: ${pkg}`,
        matchedIdentifier: pkg,
        isFinancialApp: true,
      };
    }
  }

  // 3. User-defined custom blocked packages from Settings
  if (Array.isArray(customBlockedPackages)) {
    for (const customPkg of customBlockedPackages) {
      const cleanCustom = customPkg.toLowerCase().trim();
      if (cleanCustom && combined.includes(cleanCustom)) {
        return {
          allowed: false,
          blockedReason: `User-defined blocked package: ${customPkg}`,
          matchedIdentifier: customPkg,
          isFinancialApp: false,
        };
      }
    }
  }

  // 4. Financial & UPI keyword detection in intent parameter or action
  for (const kw of FINANCIAL_KEYWORDS) {
    // Check if combined text contains the keyword as a word or token
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(combined) || combined.includes(kw)) {
      return {
        allowed: false,
        blockedReason: `Security policy blocks automated opening of ${kw.toUpperCase()} to protect banking credentials & UPI transactions`,
        matchedIdentifier: kw.toUpperCase(),
        isFinancialApp: true,
      };
    }
  }

  return {
    allowed: true,
    isFinancialApp: false,
  };
}

/**
 * Validates, normalizes, and sanitizes destination URLs requested via voice commands.
 * Strictly permits only http and https protocols, blocks private/local network IPs,
 * and converts search terms into safe Google search queries.
 */
export function validateAndSanitizeUrl(target: string): { isValid: boolean; url: string; domain: string } {
  if (!target || typeof target !== 'string') return { isValid: false, url: '', domain: '' };
  let trimmed = target.trim();

  // If no scheme is provided, determine if it is a domain or a search phrase
  if (!/^https?:\/\//i.test(trimmed)) {
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    } else {
      const encoded = encodeURIComponent(trimmed);
      return { isValid: true, url: `https://www.google.com/search?q=${encoded}`, domain: 'google.com' };
    }
  }

  try {
    const parsed = new URL(trimmed);
    // Strictly restrict to http/https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, url: '', domain: '' };
    }

    // Block private/local network probing
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return { isValid: false, url: '', domain: '' };
    }

    return { isValid: true, url: parsed.toString(), domain: host };
  } catch {
    return { isValid: false, url: '', domain: '' };
  }
}
