// @flow

import {
  GET_ACTIVATED_FEATURE,
  getActivatedFeatureSuccess,
  getActivatedFeatureError
} from "./activatedFeature.action";
import {call, put, takeLatest} from "redux-saga/effects";
import {request, generateRequest} from "../helper";
import {List} from "immutable";

/**
 * Listens for the submit attachment action and trigger the request flow, cancelling the previous
 * request if it was still ongoing.
 * @return {null} nothing
 */
export const getActivatedFeatureRequest =
  function *getActivatedFeatureRequest (): Generator<any, void, any> {
    try {
      const response = yield call(request, generateRequest(
        "api/feature-toggles/activated",
        "get"
      ));
      const activatedFeatures = List(response.data);
      yield put(getActivatedFeatureSuccess(activatedFeatures));
    } catch (error) {
      yield put(getActivatedFeatureError("Couldn't get activated feature list"));
    }
  };

/**
 * Listens for the get item groups action and trigger the request flow, cancelling the previous
 * request if it was still ongoing.
 * @return {null} nothing
 */
export default function *(): Generator<any, void, any> {
  yield takeLatest(GET_ACTIVATED_FEATURE, getActivatedFeatureRequest);
}
