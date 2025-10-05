/**
 * Service for managing candidate contact information sharing consent
 * Temporary implementation using localStorage until database table is created
 */

export interface ContactConsent {
  id: string;
  candidate_id: string;
  company_id: string;
  job_id: string | null;
  consent_given: boolean;
  consent_date: string | null;
  created_at: string;
}

const CONSENT_STORAGE_KEY = 'candidate_contact_consents';

/**
 * Get all consents from localStorage
 */
function getStoredConsents(): ContactConsent[] {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save consents to localStorage
 */
function saveStoredConsents(consents: ContactConsent[]): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consents));
  } catch (error) {
    console.error('Error saving consents:', error);
  }
}

/**
 * Check if a candidate has given consent to share contact info with a company
 * Returns false by default for security (always mask unless explicitly consented)
 */
export async function hasContactConsent(
  candidateId: string,
  companyId: string,
  jobId?: string
): Promise<boolean> {
  try {
    const consents = getStoredConsents();
    const consent = consents.find(c => 
      c.candidate_id === candidateId &&
      c.company_id === companyId &&
      (jobId ? c.job_id === jobId : true) &&
      c.consent_given
    );
    return !!consent;
  } catch (error) {
    console.error('Error checking consent:', error);
    return false;
  }
}

/**
 * Grant consent for a company to view contact information
 */
export async function grantContactConsent(
  candidateId: string,
  companyId: string,
  jobId: string | null = null
): Promise<{ success: boolean; error?: string }> {
  try {
    const consents = getStoredConsents();
    const existingIndex = consents.findIndex(c =>
      c.candidate_id === candidateId &&
      c.company_id === companyId &&
      c.job_id === jobId
    );

    const newConsent: ContactConsent = {
      id: crypto.randomUUID(),
      candidate_id: candidateId,
      company_id: companyId,
      job_id: jobId,
      consent_given: true,
      consent_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      consents[existingIndex] = newConsent;
    } else {
      consents.push(newConsent);
    }

    saveStoredConsents(consents);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Revoke consent for a company to view contact information
 */
export async function revokeContactConsent(
  candidateId: string,
  companyId: string,
  jobId: string | null = null
): Promise<{ success: boolean; error?: string }> {
  try {
    const consents = getStoredConsents();
    const filteredConsents = consents.filter(c =>
      !(c.candidate_id === candidateId &&
        c.company_id === companyId &&
        c.job_id === jobId)
    );

    saveStoredConsents(filteredConsents);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get all consents for a candidate
 */
export async function getCandidateConsents(
  candidateId: string
): Promise<ContactConsent[]> {
  try {
    const consents = getStoredConsents();
    return consents
      .filter(c => c.candidate_id === candidateId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('Error fetching consents:', error);
    return [];
  }
}
