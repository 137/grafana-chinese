import coreModule from 'app/core/core_module';
import locationUtil from 'app/core/utils/location_util';
import { UrlQueryMap } from '@grafana/runtime';
import { DashboardLoaderSrv } from 'app/features/dashboard/services/DashboardLoaderSrv';
import { BackendSrv } from 'app/core/services/backend_srv';
import { ILocationService } from 'angular';

export class LoadDashboardCtrl {
  /** @ngInject */
  constructor(
    $scope: any,
    $routeParams: UrlQueryMap,
    dashboardLoaderSrv: DashboardLoaderSrv,
    backendSrv: BackendSrv,
    $location: ILocationService,
    $browser: any
  ) {
    $scope.appEvent('dashboard-fetch-start');

    if (!$routeParams.uid && !$routeParams.slug) {
      backendSrv.get('/api/dashboards/home').then((homeDash: { redirectUri: string; meta: any }) => {
        if (homeDash.redirectUri) {
          const newUrl = locationUtil.stripBaseFromUrl(homeDash.redirectUri);
          $location.path(newUrl);
        } else {
          const meta = homeDash.meta;
          meta.canSave = meta.canShare = meta.canStar = false;
          $scope.initDashboard(homeDash, $scope);
        }
      });
      return;
    }

    // if no uid, redirect to new route based on slug
    if (!($routeParams.type === 'script' || $routeParams.type === 'snapshot') && !$routeParams.uid) {
      // @ts-ignore
      backendSrv.getDashboardBySlug($routeParams.slug).then(res => {
        if (res) {
          $location.path(locationUtil.stripBaseFromUrl(res.meta.url)).replace();
        }
      });
      return;
    }

    dashboardLoaderSrv.loadDashboard($routeParams.type, $routeParams.slug, $routeParams.uid).then((result: any) => {
      if (result.meta.url) {
        const url = locationUtil.stripBaseFromUrl(result.meta.url);

        if (url !== $location.path()) {
          // replace url to not create additional history items and then return so that initDashboard below isn't executed multiple times.
          $location.path(url).replace();
          return;
        }
      }

      result.meta.autofitpanels = $routeParams.autofitpanels;
      result.meta.kiosk = $routeParams.kiosk;

      $scope.initDashboard(result, $scope);
    });
  }
}

export class NewDashboardCtrl {
  /** @ngInject */
  constructor($scope: any, $routeParams: UrlQueryMap) {
    $scope.initDashboard(
      {
        meta: {
          canStar: false,
          canShare: false,
          isNew: true,
          folderId: Number($routeParams.folderId),
        },
        dashboard: {
          title: '新的仪表盘',
          panels: [
            {
              type: 'add-panel',
              gridPos: { x: 0, y: 0, w: 12, h: 9 },
              title: '面板标题',
            },
          ],
        },
      },
      $scope
    );
  }
}

coreModule.controller('LoadDashboardCtrl', LoadDashboardCtrl);
coreModule.controller('NewDashboardCtrl', NewDashboardCtrl);
