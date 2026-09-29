/** Shared content types. Everything user-facing lives in src/content as typed data. */

/** Whether a piece of copy is a verified fact, deliberate fiction, or blocked pending review. */
export type ContentStatus = 'verified' | 'fictional' | 'needs-review';

/** Block IDs from the Résumé Context Pack (plus a few skill/education anchors used by jokes). */
export type BlockId =
  | 'ID'
  | 'SUM-GEN'
  | 'SUM-EMB-SHORT'
  | 'SUM-PLT'
  | 'SUM-BE'
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'A5'
  | 'A6'
  | 'B1'
  | 'C1'
  | 'C2'
  | 'D1'
  | 'E1'
  | 'E2'
  | 'E3'
  | 'E4'
  /** Coursework lines. The pack calls these C2 and C4, which collide with the C Spire bullets. */
  | 'CW2'
  | 'CW4'
  | 'P1'
  | 'P2'
  | 'P3'
  | 'P4'
  | 'S2'
  | 'S3'
  | 'S4'
  | 'SK-linux'
  | 'SK-git';

/** A joke or statement. `blockRefs` = grounded in verified facts; absent = pure fiction. */
export interface CopyRecord {
  id: string;
  text: string;
  status: ContentStatus;
  blockRefs?: readonly BlockId[];
}

export type DestId = 'github' | 'linkedin' | 'email' | 'pdf' | 'repo';
