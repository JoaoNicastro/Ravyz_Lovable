/**
 * Data masking utilities for protecting candidate PII
 * Masks sensitive information until explicit consent is granted
 */

export interface MaskedCandidate {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  date_of_birth?: string;
  // Other non-sensitive fields pass through
  [key: string]: any;
}

/**
 * Masks CPF by showing only first 3 and last 2 digits
 * Example: 123.456.789-01 -> 123.***.***-01
 */
export function maskCPF(cpf: string | null | undefined): string {
  if (!cpf) return '***.***.***-**';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return '***.***.***-**';
  return `${cleaned.slice(0, 3)}.***.***-${cleaned.slice(-2)}`;
}

/**
 * Masks email by showing only first char and domain
 * Example: john.doe@example.com -> j***@example.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '***@***.***';
  const [localPart, domain] = email.split('@');
  if (!domain) return '***@***.***';
  return `${localPart[0]}***@${domain}`;
}

/**
 * Masks phone by showing only area code and last 2 digits
 * Example: (11) 98765-4321 -> (11) ****-21
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '(**) ****-**';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) return '(**) ****-**';
  const areaCode = cleaned.slice(0, 2);
  const lastTwo = cleaned.slice(-2);
  return `(${areaCode}) ****-${lastTwo}`;
}

/**
 * Masks date of birth by showing only year
 * Example: 1990-05-15 -> ****-**-** (Idade: ~34)
 */
export function maskDateOfBirth(dob: string | null | undefined): string {
  if (!dob) return '****-**-**';
  const year = new Date(dob).getFullYear();
  const age = new Date().getFullYear() - year;
  return `****-**-** (Idade: ~${age})`;
}

/**
 * Masks full name by showing only first name
 * Example: João Silva Santos -> João S. S.
 */
export function maskFullName(name: string | null | undefined): string {
  if (!name) return '***';
  const parts = name.split(' ').filter(p => p.length > 0);
  if (parts.length === 1) return parts[0];
  
  const firstName = parts[0];
  const initials = parts.slice(1).map(p => `${p[0]}.`).join(' ');
  return `${firstName} ${initials}`;
}

/**
 * Masks all sensitive fields in a candidate profile
 * Used when companies view candidates without explicit consent
 */
export function maskCandidateData<T extends Record<string, any>>(
  candidate: T,
  hasConsent: boolean = false
): T {
  if (hasConsent) {
    return candidate;
  }

  return {
    ...candidate,
    cpf: maskCPF(candidate.cpf),
    email: maskEmail(candidate.email),
    phone: maskPhone(candidate.phone),
    date_of_birth: maskDateOfBirth(candidate.date_of_birth),
    full_name: maskFullName(candidate.full_name),
    // Mark as masked for UI purposes
    _is_masked: true,
  };
}
