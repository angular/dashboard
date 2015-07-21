/// <reference path="typings/angular2/angular2.d.ts" />
import {bootstrap} from 'angular2/angular2';
import {Milestones} from 'components/milestones/milestones';
import {Hotlist} from 'components/hotlist/hotlist';
import {Backlog} from 'components/backlog/backlog';
import {Triage} from 'components/triage/triage';

bootstrap(Milestones);
bootstrap(Hotlist);
bootstrap(Backlog);
bootstrap(Triage);
