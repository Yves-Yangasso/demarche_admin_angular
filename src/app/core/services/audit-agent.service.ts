import { Injectable, signal } from '@angular/core';

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

export interface BlockchainAuditBlock {
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

@Injectable({
  providedIn: 'root'
})
export class AuditAgentService {
  private readonly agentsData: AgentAudit[] = [
    {
      id: 1,
      nom: 'Aminata Diop',
      role: 'Agent etat civil',
      derniere_connexion: '2026-06-18T08:12:00',
      dossiers_traites: 34,
      dossiers_consultes: 58,
      dossiers_valides: 21,
      alertes: 0,
      statut: 'connecte'
    },
    {
      id: 2,
      nom: 'Mamadou Fall',
      role: 'Superviseur dossiers',
      derniere_connexion: '2026-06-18T07:45:00',
      dossiers_traites: 29,
      dossiers_consultes: 44,
      dossiers_valides: 26,
      alertes: 1,
      statut: 'actif'
    },
    {
      id: 3,
      nom: 'Fatou Ndiaye',
      role: 'Agent urbanisme',
      derniere_connexion: '2026-06-17T16:20:00',
      dossiers_traites: 18,
      dossiers_consultes: 31,
      dossiers_valides: 12,
      alertes: 0,
      statut: 'hors_ligne'
    },
    {
      id: 4,
      nom: 'Cheikh Ba',
      role: 'Controle interne',
      derniere_connexion: '2026-06-18T09:03:00',
      dossiers_traites: 12,
      dossiers_consultes: 63,
      dossiers_valides: 8,
      alertes: 2,
      statut: 'connecte'
    }
  ];

  agents = signal<AgentAudit[]>(this.agentsData);
  blockchain = signal<BlockchainAuditBlock[]>(this.createBlockchain());

  verifierChaine(): boolean {
    const blocks = this.blockchain();

    return blocks.every((block, index) => {
      const expectedHash = this.hashBlock(block);
      const validPreviousHash = index === blocks.length - 1 || block.previousHash === blocks[index + 1].hash;

      return block.hash === expectedHash && validPreviousHash && block.valide;
    });
  }

  ajouterEvenement(agent: string, type: AuditType, dossier: string) {
    const blocks = this.blockchain();
    const previousHash = blocks[0]?.hash || 'GENESIS';
    const timestamp = new Date().toISOString();
    const index = blocks.length + 1;
    const event = this.createEvent(index, previousHash, {
      timestamp,
      agent,
      type,
      dossier,
      action: this.actionByType(type),
      module: 'Dossiers',
      ip: '197.255.12.44',
      device: 'Poste admin mairie'
    });

    this.blockchain.set([event, ...blocks]);
  }

  private createBlockchain(): BlockchainAuditBlock[] {
    const events = [
      {
        agent: 'Aminata Diop',
        action: 'Creation du dossier',
        type: 'initial' as AuditType,
        dossier: 'DOS-2026-00421',
        module: 'Etat civil',
        ip: '197.255.12.17',
        device: 'Chrome Windows',
        timestamp: '2026-06-18T08:31:00',
        initial: [
          { champ: 'statut', valeur: 'Nouveau' },
          { champ: 'priorite', valeur: 'Normale' },
          { champ: 'citoyen', valeur: 'Mariama Sarr' }
        ]
      },
      {
        agent: 'Mamadou Fall',
        action: 'Modification du statut',
        type: 'update' as AuditType,
        dossier: 'DOS-2026-00412',
        module: 'Validation',
        ip: '197.255.12.19',
        device: 'Firefox Windows',
        timestamp: '2026-06-18T08:04:00',
        updates: [
          { champ: 'statut', avant: 'En cours', apres: 'En validation' },
          { champ: 'agent_assignation', avant: 'Non assigne', apres: 'Mamadou Fall' }
        ]
      },
      {
        agent: 'Cheikh Ba',
        action: 'Suppression de piece jointe',
        type: 'delete' as AuditType,
        dossier: 'DOS-2026-00398',
        module: 'Documents',
        ip: '197.255.12.24',
        device: 'Edge Windows',
        timestamp: '2026-06-18T07:58:00',
        deleted: [
          { champ: 'document', valeur: 'ancien_certificat_residence.pdf' },
          { champ: 'motif', valeur: 'Document remplace par une version certifiee' }
        ]
      },
      {
        agent: 'Fatou Ndiaye',
        action: 'Correction des informations',
        type: 'update' as AuditType,
        dossier: 'DOS-2026-00372',
        module: 'Urbanisme',
        ip: '197.255.12.31',
        device: 'Chrome Android',
        timestamp: '2026-06-17T16:05:00',
        updates: [
          { champ: 'adresse_parcelle', avant: 'Nord foire lot 18', apres: 'Nord foire lot 18B' },
          { champ: 'surface', avant: '180 m2', apres: '182 m2' }
        ]
      }
    ];

    return events.reduce<BlockchainAuditBlock[]>((chain, event, idx) => {
      const index = idx + 1;
      const previousHash = chain[idx - 1]?.hash || 'GENESIS';
      const block = this.createEvent(index, previousHash, event);

      chain.push(block);
      return chain;
    }, []).reverse();
  }

  private createEvent(index: number, previousHash: string, event: Partial<BlockchainAuditBlock>): BlockchainAuditBlock {
    const block: BlockchainAuditBlock = {
      index,
      previousHash,
      timestamp: event.timestamp || new Date().toISOString(),
      agent: event.agent || '',
      action: event.action || '',
      type: event.type || 'update',
      dossier: event.dossier || '',
      module: event.module || 'Dossiers',
      ip: event.ip || '197.255.12.44',
      device: event.device || 'Poste agent',
      valide: true,
      hash: '',
      initial: event.initial || (event.type === 'initial' ? [
        { champ: 'statut', valeur: 'Nouveau' },
        { champ: 'canal', valeur: 'Guichet admin' }
      ] : []),
      updates: event.updates || (event.type === 'update' ? [
        { champ: 'statut', avant: 'Nouveau', apres: 'En cours' }
      ] : []),
      deleted: event.deleted || (event.type === 'delete' ? [
        { champ: 'element', valeur: 'Piece obsolete' }
      ] : [])
    };

    return { ...block, hash: this.hashBlock(block) };
  }

  private actionByType(type: AuditType): string {
    if (type === 'initial') return 'Enregistrement initial';
    if (type === 'delete') return 'Suppression controlee';
    return 'Modification de donnees';
  }

  private hashBlock(block: BlockchainAuditBlock): string {
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
      deleted: block.deleted
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
