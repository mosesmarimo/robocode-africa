import { Injectable, Logger } from "@nestjs/common";

/** A DNS record type we manage (only what publish needs). */
export type DnsRecordType = "A" | "CNAME";

export interface DnsTarget {
  type: DnsRecordType;
  value: string;
}

export interface DnsRecord {
  data: string;
  ttl?: number;
}

export interface GoDaddyResult {
  /** true when creds are unset — no network call was made. */
  dryRun: boolean;
  /** true when a record was actually created/updated/deleted (or would be, live). */
  changed: boolean;
}

const DEFAULT_TTL = 600;

/**
 * Thin GoDaddy Domains v1 DNS client. Dry-run by default: every mutating
 * method no-ops (logs + returns) unless BOTH `GODADDY_API_KEY` and
 * `GODADDY_API_SECRET` are set. This lets the publish feature ship (and be
 * smoke-tested) with zero risk of touching real DNS until real creds are
 * provisioned — see PUBLISH_TARGET_TYPE/PUBLISH_TARGET_VALUE in .env.example.
 *
 * DNS is best-effort for publish: callers must wrap `ensureWildcard` in a
 * try/catch so a GoDaddy hiccup never fails the publish transaction itself
 * (the record can always be reconciled later).
 */
@Injectable()
export class GoDaddyService {
  private readonly logger = new Logger(GoDaddyService.name);

  private get apiKey(): string {
    return process.env.GODADDY_API_KEY ?? "";
  }

  private get apiSecret(): string {
    return process.env.GODADDY_API_SECRET ?? "";
  }

  /** Both key and secret must be set to leave dry-run mode. */
  isLive(): boolean {
    return !!this.apiKey && !!this.apiSecret;
  }

  private baseUrl(): string {
    return process.env.GODADDY_OTE === "true" ? "https://api.ote-godaddy.com" : "https://api.godaddy.com";
  }

  private async rawFetch(method: string, path: string, body?: unknown): Promise<Response> {
    return fetch(`${this.baseUrl()}${path}`, {
      method,
      headers: {
        Authorization: `sso-key ${this.apiKey}:${this.apiSecret}`,
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /** GET a DNS record; returns null when absent (404) or in dry-run. Throws on any other non-2xx. */
  async getRecord(domain: string, type: DnsRecordType, name: string): Promise<DnsRecord[] | null> {
    if (!this.isLive()) {
      this.logger.log(`[godaddy dry-run] would GET record ${type}/${name} for ${domain}`);
      return null;
    }
    const res = await this.rawFetch("GET", `/v1/domains/${domain}/records/${type}/${name}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GoDaddy getRecord ${type}/${name} (${domain}) failed: ${res.status} ${text}`);
    }
    return (await res.json()) as DnsRecord[];
  }

  /** PUT (idempotent replace) a DNS record. Dry-run: no network call. */
  async upsertRecord(domain: string, type: DnsRecordType, name: string, value: string, ttl = DEFAULT_TTL): Promise<GoDaddyResult> {
    if (!this.isLive()) {
      this.logger.log(`[godaddy dry-run] would PUT record ${type}/${name}=${value} (ttl=${ttl}) for ${domain}`);
      return { dryRun: true, changed: false };
    }
    const res = await this.rawFetch("PUT", `/v1/domains/${domain}/records/${type}/${name}`, [{ data: value, ttl }]);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GoDaddy upsertRecord ${type}/${name} (${domain}) failed: ${res.status} ${text}`);
    }
    return { dryRun: false, changed: true };
  }

  /** DELETE a DNS record. Dry-run: no network call. */
  async deleteRecord(domain: string, type: DnsRecordType, name: string): Promise<GoDaddyResult> {
    if (!this.isLive()) {
      this.logger.log(`[godaddy dry-run] would DELETE record ${type}/${name} for ${domain}`);
      return { dryRun: true, changed: false };
    }
    const res = await this.rawFetch("DELETE", `/v1/domains/${domain}/records/${type}/${name}`);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GoDaddy deleteRecord ${type}/${name} (${domain}) failed: ${res.status} ${text}`);
    }
    return { dryRun: false, changed: true };
  }

  /**
   * Ensure the wildcard record (`*`) for `domain` points at `target`.
   * Idempotent: checks the current record first and only PUTs when absent or
   * different. Dry-run: logs the intent and returns without calling `getRecord`
   * either (zero network calls when creds are unset).
   */
  async ensureWildcard(domain: string, target: DnsTarget): Promise<GoDaddyResult> {
    if (!this.isLive()) {
      this.logger.log(`[godaddy dry-run] would ensure wildcard *.${domain} -> ${target.type} ${target.value}`);
      return { dryRun: true, changed: false };
    }
    const existing = await this.getRecord(domain, target.type, "*");
    const alreadyCorrect = !!existing?.some((r) => r.data === target.value);
    if (alreadyCorrect) {
      return { dryRun: false, changed: false };
    }
    return this.upsertRecord(domain, target.type, "*", target.value);
  }
}
