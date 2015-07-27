/// <reference path="../typings/tsd.d.ts" />

interface AssignedItem {
  assignee: User;
  effort: number;
  html_url: string;
  milestone: Milestone;
  number: number;
  priority: number;
  pr_state: string;
  state: string;
  type: string;
}

interface IssueMap {
  [title: string]: {[login: string] : AssignedItem[]};
}

interface Page {
  number: number;
  assignees: User[];
}

interface PrMap { 
  [login: string]: PullRequest[]; 
}

