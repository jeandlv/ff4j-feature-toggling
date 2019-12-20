/* eslint-disable no-invalid-this */
// @flow

import * as React from "react";
import {connect} from "react-redux";
import {List} from "immutable";


type Props = {
  OldComponent: any,
  Component: any,
  featureName: string,
  activatedFeatures: List<string>
};

class FeatureFlipper extends React.Component<Props> {
  isFeatureFlipped = (activatedFeatures, featureName) => activatedFeatures.includes(featureName)

  getFallbackComponent = (OldComponent, otherProps) => OldComponent
    ? <OldComponent {...otherProps} />
    : <React.Fragment />

  render () {
    const {activatedFeatures, featureName, OldComponent, Component, ...otherProps} = this.props;
    return (
      <React.Fragment>
        {this.isFeatureFlipped(activatedFeatures, featureName)
          ? <Component {...otherProps} />
          : this.getFallbackComponent(OldComponent, otherProps)
        }
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state) => (
  {"activatedFeatures": state.activatedFeature.get("activatedFeatures")}
);

const ConnectedFeatureFlipper = connect(mapStateToProps)(FeatureFlipper);

export default (ConnectedFeatureFlipper);
