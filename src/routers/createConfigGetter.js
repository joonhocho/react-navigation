/*
 * @flow
 */

import invariant from 'fbjs/lib/invariant';

import getScreenForRouteName from './getScreenForRouteName';
import addNavigationHelpers from '../addNavigationHelpers';

import type {
  NavigationProp,
  NavigationAction,
  NavigationRouteConfigMap,
  NavigationScreenOption,
  NavigationScreenOptions,
} from '../TypeDefinition';

export default (
  routeConfigs: NavigationRouteConfigMap,
  defaultOptions?: NavigationScreenOptions
) => {
  let prevNavigation;
  let prevOptionName;
  let prevConfig;
  let prevResult;
  (
    navigation: NavigationProp<*, NavigationAction>,
    optionName: string,
    config?: NavigationScreenOption<*>
  ) => {
    if (navigation === prevNavigation &&
        optionName === prevOptionName &&
        config === prevConfig) {
      return prevResult;
    }

    prevNavigation = navigation;
    prevOptionName = optionName;
    prevConfig = config;

    const route = navigation.state;
    invariant(
      route.routeName &&
      typeof route.routeName === 'string',
      'Cannot get config because the route does not have a routeName.'
    );

    const Component = getScreenForRouteName(routeConfigs, route.routeName);

    let outputConfig = config || null;

    if (Component.router) {
      const { state, dispatch } = navigation;
      invariant(
        state && state.routes && state.index != null,
        `Expect nav state to have routes and index, ${JSON.stringify(route)}`
      );
      const childNavigation = addNavigationHelpers({
        state: state.routes[state.index],
        dispatch,
      });
      outputConfig = Component.router.getScreenConfig(childNavigation, optionName);
    }

    const routeConfig = routeConfigs[route.routeName];

    prevResult = [
      defaultOptions,
      Component.navigationOptions,
      routeConfig.navigationOptions,
    ].reduce(
      (acc: *, options: NavigationScreenOptions) => {
        if (options && options[optionName] !== undefined) {
          return typeof options[optionName] === 'function'
            ? options[optionName](navigation, acc)
            : options[optionName];
        }
        return acc;
      },
      outputConfig,
    );

    return prevResult;
  };
