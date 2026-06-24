import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type AuditType = 'initial' | 'update' | 'delete';

export interface AgentAudit {
  id: number;
  nom: string;
  role: string;
  derniere_connexion: string;
  dossiers_traites: number;
  dossiers_consultes: number;
  dossiers_valides: number;
  alertes: number;
  statut: 'connecte' | 'actif' | 'hors_ligne';
}

export interface AuditChange {
  champ: string;
  avant?: string;
  apres?: string;
  valeur?: string;
}

/**
 * Une entrée du journal d'audit, enrichie côté front d'un hash chaîné de
 * vérification (visualisation pédagogique pour l'agent).
 *
 * NB : la garantie cryptographique réelle est portée par le backend
 * (table `audit_logs` PostgreSQL append-only + colonnes `signature` et
 * `previous_hash` à activer via flag `AUDIT_CRYPTO_ENABLED`, cf.
 * `app/models/audit.py` et `app/services/audit_crypto.py`).
 *
 * Le `hash` calculé ici ne fait foi de rien - c'est un FNV simple, lisible
 * par un humain. Quand le flag backend sera ON, on remplacera ce hash par
 * la `signature` HMAC servie par l'API et la vérification deviendra réelle.
 */
export interface AuditEntry {
  index: number;
  timestamp: string;
  agent: string;
  action: string;
  type: AuditType;
  dossier: string;
  module: string;
  ip: string;
  device: string;
  previousHash: string;
  hash: string;
  valide: boolean;
  initial: AuditChange[];
  updates: AuditChange[];
  deleted: AuditChange[];
}

interface AuditLogRow {
  id: number;
  acteur_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  payload_before: Record<string, unknown> | null;
  payload_after: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  collectivite_id: number | null;
  created_at: string | null;
}

interface AuditListResponse {
  logs: AuditLogRow[];
  total: number;
  pages: number;
  page: number;
}

interface AgentPerf {
  agent: string;
  dossiers_traites: number;
  taux_reussite: number;
}

/**
 * B6 - Service connecté au vrai backend (`GET /api/audit` + `GET /api/stats/agent-performance`).
 *
 * Expose deux signals - `agents` (perf agrégée) et `entries` (journal d'audit
 * chainé pour visualisation). Charge les données au démarrage (fire-and-forget)
 * et expose `refresh()` pour rejouer la récupération.
 *
 * Le hash de chaque entrée est un FNV-like local pour visualisation ; la
 * véritable intégrité vient du backend (table append-only + signature HMAC
 * optionnelle).
 */
@Injectable({ providedIn: 'root' })
export class AuditAgentService {
  private http = inject(HttpClient);
  private apiBase = '/api';

  agents = signal<AgentAudit[]>([]);
  entries = signal<AuditEntry[]>([]);

  constructor() {
    // Chargement initial - non bloquant.
    void this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      const [logsResp, perfResp] = await Promise.all([
        firstValueFrom(
          this.http.get<AuditListResponse>(`${this.apiBase}/audit`, {
            params: { per_page: 50 },
          }),
        ).catch(() => ({ logs: [], total: 0, pages: 0, page: 1 } as AuditListResponse)),
        firstValueFrom(
          this.http.get<AgentPerf[]>(`${this.apiBase}/stats/agent-performance`),
        ).catch(() => [] as AgentPerf[]),
      ]);

      this.agents.set(this.mapAgents(perfResp));
      this.entries.set(this.mapEntries(logsResp.logs));
    } catch {
      // Si tout échoue (ex: pas connecté), on laisse les signals vides
      // plutôt que d'exposer des données mockées trompeuses.
      this.agents.set([]);
      this.entries.set([]);
    }
  }

  verifierChaine(): boolean {
    const blocks = this.entries();
    if (blocks.length === 0) return true;
    return blocks.every((block, index) => {
      const expectedHash = this.computeEntryHash(block);
      const validPreviousHash =
        index === blocks.length - 1 || block.previousHash === blocks[index + 1].hash;
      return block.hash === expectedHash && validPreviousHash && block.valide;
    });
  }

  ajouterEvenement(agent: string, type: AuditType, dossier: string): void {
    // Helper conservé pour compat : enregistre un évènement local seulement.
    // Pour persister, appeler une route métier - c'est elle qui écrira un AuditLog.
    const blocks = this.entries();
    const previousHash = blocks[0]?.hash || 'GENESIS';
    const event: Partial<AuditEntry> = {
      timestamp: new Date().toISOString(),
      agent,
      type,
      dossier,
      action: this.actionLabel(type),
      module: 'Dossiers',
      ip: '127.0.0.1',
      device: 'Web admin',
    };
    const block = this.buildBlock(blocks.length + 1, previousHash, event);
    this.entries.set([block, ...blocks]);
  }

  // ─── Mapping ──────────────────────────────────────────────────────────────

  private mapAgents(perf: AgentPerf[]): AgentAudit[] {
    return perf.map((p, i) => ({
      id: i + 1,
      nom: p.agent,
      role: 'Agent',
      derniere_connexion: '',
      dossiers_traites: p.dossiers_traites,
      dossiers_consultes: 0,
      dossiers_valides: Math.round(p.dossiers_traites * (p.taux_reussite / 100)),
      alertes: p.dossiers_traites - Math.round(p.dossiers_traites * (p.taux_reussite / 100)),
      statut: 'actif',
    }));
  }

  private mapEntries(logs: AuditLogRow[]): AuditEntry[] {
    // On reçoit les logs en ordre antichronologique (cf. routes/audit.py).
    // On les passe en ordre chronologique pour calculer la chaîne, puis on inverse.
    const ordered = [...logs].reverse();
    const chain: AuditEntry[] = [];
    ordered.forEach((log, idx) => {
      const previousHash = chain[idx - 1]?.hash || 'GENESIS';
      chain.push(this.fromAuditLog(idx + 1, previousHash, log));
    });
    return chain.reverse();
  }

  private fromAuditLog(
    index: number,
    previousHash: string,
    log: AuditLogRow,
  ): AuditEntry {
    const type = this.inferType(log.action);
    const diff = this.diffPayloads(log.payload_before, log.payload_after);
    return this.buildBlock(index, previousHash, {
      timestamp: log.created_at ?? new Date().toISOString(),
      agent: log.acteur_id ? `acteur#${log.acteur_id}` : 'systeme',
      action: log.action,
      type,
      dossier: log.entity_id ? `${log.entity_type}#${log.entity_id}` : log.entity_type,
      module: log.entity_type,
      ip: log.ip ?? '',
      device: log.user_agent?.slice(0, 60) ?? '',
      initial: type === 'initial' ? diff : [],
      updates: type === 'update' ? diff : [],
      deleted: type === 'delete' ? diff : [],
    });
  }

  private inferType(action: string): AuditType {
    if (action.endsWith('_CREATED')) return 'initial';
    if (action.endsWith('_DELETED') || action === 'USER_BLOCKED') return 'delete';
    return 'update';
  }

  private diffPayloads(
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
  ): AuditChange[] {
    if (!before && !after) return [];
    if (!before && after) {
      return Object.entries(after).map(([k, v]) => ({ champ: k, valeur: String(v) }));
    }
    if (before && !after) {
      return Object.entries(before).map(([k, v]) => ({ champ: k, valeur: String(v) }));
    }
    const keys = new Set([...Object.keys(before!), ...Object.keys(after!)]);
    const out: AuditChange[] = [];
    keys.forEach((k) => {
      const a = before?.[k];
      const b = after?.[k];
      if (a !== b) {
        out.push({ champ: k, avant: a !== undefined ? String(a) : '', apres: b !== undefined ? String(b) : '' });
      }
    });
    return out;
  }

  private buildBlock(
    index: number,
    previousHash: string,
    event: Partial<AuditEntry>,
  ): AuditEntry {
    const block: AuditEntry = {
      index,
      previousHash,
      timestamp: event.timestamp || new Date().toISOString(),
      agent: event.agent || '',
      action: event.action || '',
      type: event.type || 'update',
      dossier: event.dossier || '',
      module: event.module || 'audit',
      ip: event.ip || '',
      device: event.device || '',
      valide: true,
      hash: '',
      initial: event.initial || [],
      updates: event.updates || [],
      deleted: event.deleted || [],
    };
    return { ...block, hash: this.computeEntryHash(block) };
  }

  private actionLabel(type: AuditType): string {
    if (type === 'initial') return 'Enregistrement initial';
    if (type === 'delete') return 'Suppression controlee';
    return 'Modification de donnees';
  }

  private computeEntryHash(block: AuditEntry): string {
    const payload = {
      index: block.index,
      timestamp: block.timestamp,
      agent: block.agent,
      action: block.action,
      type: block.type,
      dossier: block.dossier,
      module: block.module,
      previousHash: block.previousHash,
      initial: block.initial,
      updates: block.updates,
      deleted: block.deleted,
    };
    const input = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return `0x${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }
}
