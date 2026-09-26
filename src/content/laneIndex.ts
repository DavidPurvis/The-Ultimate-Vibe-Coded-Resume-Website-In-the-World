/** Where each résumé cut lives: metadata only, no résumé content, so it is cheap on the client. */
export type LaneId = 'gen' | 'emb' | 'plt' | 'be';

export interface LaneMeta {
  code: 'GEN' | 'EMB' | 'PLT' | 'BE';
  /** "Embedded software" etc.: what the cut is for. */
  label: string;
  path: string;
  /** Output file in dist/ (and its link, relative to the base). */
  pdf: string;
  /** Suggested filename for the download attribute. */
  pdfName: string;
}

export const LANE_META: Record<LaneId, LaneMeta> = {
  gen: {
    code: 'GEN',
    label: 'General software engineering',
    path: '/resume/',
    pdf: 'resume.pdf',
    pdfName: 'David-Purvis-Resume.pdf',
  },
  emb: {
    code: 'EMB',
    label: 'Embedded software',
    path: '/resume/for/emb/',
    pdf: 'resume-emb.pdf',
    pdfName: 'David-Purvis-Resume-Embedded.pdf',
  },
  plt: {
    code: 'PLT',
    label: 'Platform, DevOps and SRE',
    path: '/resume/for/plt/',
    pdf: 'resume-plt.pdf',
    pdfName: 'David-Purvis-Resume-Platform.pdf',
  },
  be: {
    code: 'BE',
    label: 'Backend and distributed systems',
    path: '/resume/for/be/',
    pdf: 'resume-be.pdf',
    pdfName: 'David-Purvis-Resume-Backend.pdf',
  },
};
