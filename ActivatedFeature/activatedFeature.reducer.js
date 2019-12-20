// @flow

import {
  GET_ACTIVATED_FEATURE,
  GET_ACTIVATED_FEATURE_SUCCESS,
  GET_ACTIVATED_FEATURE_ERROR
} from "./activatedFeature.action";
import type {
  GetActivatedFeatureAction,
  GetActivatedFeatureSuccessAction,
  GetActivatedFeatureErrorAction
} from "./activatedFeature.action";

import type {ActivatedFeatureType} from "./activatedFeature.storeType";
import {ActivatedFeatureFactory} from "./activatedFeature.storeType";

const DEFAULT_STATE: ActivatedFeatureType = ActivatedFeatureFactory({});

type ActivatedFeatureAction = GetActivatedFeatureAction
  | GetActivatedFeatureSuccessAction
  | GetActivatedFeatureErrorAction;

/**
 * Handles activated feature actions
 * @param {int} state The current state
 * @param {object} action The action to handle
 * @returns {int} The new state
 */
export default function (
  state: ActivatedFeatureType = DEFAULT_STATE,
  action: ActivatedFeatureAction
): ActivatedFeatureType {
  switch (action.type) {
  case GET_ACTIVATED_FEATURE:
    return state.set("status", "loading");
  case GET_ACTIVATED_FEATURE_SUCCESS:
    return state.
      set("activatedFeatures", action.activatedFeatures).
      set("status", "success");
  case GET_ACTIVATED_FEATURE_ERROR:
    return state.
      set("error", action.error).
      set("status", "error");
  default:
    return state;
  }
}
