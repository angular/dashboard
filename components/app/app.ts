/// <reference path="../../typings/angular2/angular2.d.ts" />
/// <reference path="../../typings/angular2/router.d.ts" />
import {bind, bootstrap, Component, NgIf, View} from 'angular2/angular2';
import {Router, RouterOutlet, routerInjectables, appBaseHrefToken} from 'angular2/router';
import {Demo} from '../demo/demo';
import {Milestone} from '../milestone/milestone';
import tactical_dm = require('tactical/dist/tactical/src/data_manager');
import tactical_socket = require('tactical/dist/tactical/src/socket');
import tactical_store = require('tactical/dist/tactical/src/tactical_store');
import tactical_idb = require('tactical/dist/tactical/src/idb');
declare var io;

@Component({selector : 'app', appInjector : []})
@View({templateUrl : 'components/app/app.html', directives : [ NgIf, RouterOutlet ]})
class App {

  constructor(router: Router) {
    router.config([{
      path: '/',
      component: Demo
    }, {
      path: '/milestone/:id',
      component: Milestone,
      as: 'milestone'
    }]).then(() => router.navigate('/'));
  }
}

bootstrap(App, routerInjectables.concat([bind(tactical_dm.TacticalDataManager).toFactory(() => {
    var socket = io.connect('ws://localhost:8081');
    var backend = new tactical_socket.SocketIOClient(socket);
    var store = new tactical_store.TacticalStore(tactical_idb.IndexedDBFactory, 'demo');
    return new tactical_dm.TacticalDataManager(backend, store);
  }, []),
  bind(appBaseHrefToken).toValue("/")]));
