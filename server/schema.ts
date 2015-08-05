export interface Issue {
  id: number;
  name: string;
  url: string;
  priority: string;
  effort: string;
  blocked: string;
  assigned: string;
}

export interface Milestone {
  id: number;
  name: string;
  url: string;
  desc: string;
  due: string;
  issues: number;
}