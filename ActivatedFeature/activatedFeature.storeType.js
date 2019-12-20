// @flow

import type {RecordFactory, RecordOf} from "immutable";
import {Record, List} from "immutable";

type activatedFeatureProps = {
  status: "loading" | "error" | "success" | "idle",
  error: string,
  activatedFeatures: List<string>;
};

export type ActivatedFeatureType = RecordOf<activatedFeatureProps>;
export type ActivatedFeatureFactoryType = RecordFactory<activatedFeatureProps>;

export const ActivatedFeatureFactory: ActivatedFeatureFactoryType = Record({
  "status": "idle",
  "error": "",
  "activatedFeatures": List()
});
