// @flow
import {List} from "immutable";

export const GET_ACTIVATED_FEATURE = "GET_ACTIVATED_FEATURE";

export type GetActivatedFeatureAction = {
  type: "GET_ACTIVATED_FEATURE"
}

export const getActivatedFeature = (): GetActivatedFeatureAction => ({"type": GET_ACTIVATED_FEATURE});

// Success
export const GET_ACTIVATED_FEATURE_SUCCESS = "GET_ACTIVATED_FEATURE_SUCCESS";

export type GetActivatedFeatureSuccessAction = {
  type: "GET_ACTIVATED_FEATURE_SUCCESS",
  activatedFeatures: List<string>
}

export const getActivatedFeatureSuccess = (activatedFeatures: List<string>): GetActivatedFeatureSuccessAction => ({
  "type": GET_ACTIVATED_FEATURE_SUCCESS,
  activatedFeatures
});


// Error
export const GET_ACTIVATED_FEATURE_ERROR = "GET_ACTIVATED_FEATURE_ERROR";

export type GetActivatedFeatureErrorAction = {
  type: "GET_ACTIVATED_FEATURE_ERROR",
  error: string
}

export const getActivatedFeatureError = (error: string): GetActivatedFeatureErrorAction => ({
  "type": GET_ACTIVATED_FEATURE_ERROR,
  error
});
